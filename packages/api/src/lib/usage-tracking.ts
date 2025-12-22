/**
 * Usage Tracking Service
 * Redis-cached usage tracking with database sync for trials and subscriptions
 * 
 * Features:
 * - Rollback pattern on quota exceeded
 * - Pre-check before action (canPerformAction)
 * - Warning/critical thresholds for usage alerts
 * - Auto monthly reset using Redis expireat
 * - Domain-specific helper methods (UsageTracker object)
 */

import { PLAN_LIMITS, TRIAL_LIMITS } from "@mocah/auth/subscription-plans";
import prisma from "@mocah/db";
import { logger } from "@mocah/shared/logger";
import { getRedis, isRedisAvailable } from "@mocah/shared/redis";
import { TRPCError } from "@trpc/server";

// ============================================================================
// Types & Interfaces
// ============================================================================

export type UsageType = "templateGeneration" | "imageGeneration";
export type PlanName = "starter" | "pro" | "scale";

export interface PlanLimits {
  templatesLimit: number;
  imagesLimit: number;
  plan: PlanName;
  hasPremiumImageModel: boolean;
  hasPriorityQueue: boolean;
}

export interface UsageCheckResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
  resetDate?: Date;
  isTrialUser?: boolean;
}

export interface TrialData {
  userId: string;
  plan: PlanName;
  templatesUsed: number;
  imagesUsed: number;
  templatesLimit: number;
  imagesLimit: number;
  startedAt: Date;
  expiresAt: Date;
  status: "active" | "converted" | "cancelled" | "expired";
  stripeCustomerId: string;
}

export interface UsageQuotaData {
  userId: string;
  plan: PlanName;
  templatesUsed: number;
  templatesLimit: number;
  imagesUsed: number;
  imagesLimit: number;
  periodStart: Date;
  periodEnd: Date;
  lastSyncedAt: Date;
}

/** Usage limit with warning/critical thresholds */
export interface UsageLimit {
  type: UsageType;
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
  resetDate: Date;
}

/** Comprehensive usage summary with warning/critical alerts */
export interface UsageSummary {
  userId: string;
  planName: PlanName;
  isTrialUser: boolean;
  limits: UsageLimit[];
  isOverLimit: boolean;
  warningLimits: UsageLimit[]; // > 80% used
  criticalLimits: UsageLimit[]; // > 95% used
}

// ============================================================================
// Cache Keys
// ============================================================================

const USAGE_CACHE_KEYS = {
  trial: (userId: string) => `trial:${userId}`,
  usage: (userId: string, month: string) => `usage:${userId}:${month}`,
  planLimits: (userId: string) => `plan:${userId}`,
} as const;

// Cache TTLs in seconds
const CACHE_TTL = {
  trial: 8 * 24 * 60 * 60, // 8 days (7-day trial + 1 day buffer)
  usage: 35 * 24 * 60 * 60, // 35 days (month + buffer)
  planLimits: 5 * 60, // 5 minutes
} as const;

// Sync thresholds
const SYNC_THRESHOLD = {
  trialIncrements: 5, // Sync to DB every 5 increments
  usageIncrements: 10, // Sync to DB every 10 increments
  maxSyncInterval: 5 * 60 * 1000, // 5 minutes max between syncs
} as const;

// Warning thresholds
const USAGE_THRESHOLDS = {
  warning: 80, // 80% usage
  critical: 95, // 95% usage
} as const;

// ============================================================================
// Error Classes
// ============================================================================

export class UsageLimitError extends TRPCError {
  public remaining: number;
  public limit: number;
  public resetDate?: Date;
  public upgradeUrl: string;

  constructor(options: {
    code: "QUOTA_EXCEEDED" | "TRIAL_LIMIT_REACHED" | "ONE_TRIAL_PER_CARD";
    remaining: number;
    limit: number;
    resetDate?: Date;
    message?: string;
  }) {
    const messages: Record<string, string> = {
      QUOTA_EXCEEDED: `You've reached your generation limit this month (${options.limit} used). Upgrade to continue.`,
      TRIAL_LIMIT_REACHED: `You've used all ${options.limit} generations in your trial. Upgrade to unlock full access.`,
      ONE_TRIAL_PER_CARD:
        "This card has already been used for a trial. Please use a different payment method.",
    };

    super({
      code: "FORBIDDEN",
      message: options.message || messages[options.code],
      cause: {
        upgradeRequired: true,
        errorCode: options.code,
        remaining: options.remaining,
        limit: options.limit,
        resetDate: options.resetDate,
      },
    });

    this.remaining = options.remaining;
    this.limit = options.limit;
    this.resetDate = options.resetDate;
    this.upgradeUrl = "/pricing";
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthBoundaries(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

/** Get end of current month as Unix timestamp */
function getEndOfMonthTimestamp(): number {
  const { end } = getMonthBoundaries();
  return Math.floor(end.getTime() / 1000);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function calculatePercentage(used: number, limit: number): number {
  if (limit === 0) return 100;
  return Math.round((used / limit) * 100);
}

// ============================================================================
// Trial Management Functions
// ============================================================================

/**
 * Create a new trial for a user
 */
export async function createTrial(
  userId: string,
  email: string,
  plan: PlanName,
  stripeCustomerId: string
): Promise<TrialData> {
  const redis = getRedis();
  const now = new Date();
  const expiresAt = addDays(now, TRIAL_LIMITS.durationDays);

  // Check one-trial-per-card rule
  const existingTrial = await checkOneTrialPerCard(stripeCustomerId);
  if (existingTrial) {
    throw new UsageLimitError({
      code: "ONE_TRIAL_PER_CARD",
      remaining: 0,
      limit: 1,
    });
  }

  // Create database record
  const trial = await prisma.trial.create({
    data: {
      userId,
      email,
      plan,
      stripeCustomerId,
      startedAt: now,
      expiresAt,
      templatesUsed: 0,
      imagesUsed: 0,
      templatesLimit: TRIAL_LIMITS.templatesLimit,
      imagesLimit: TRIAL_LIMITS.imagesLimit,
      status: "active",
    },
  });

  const trialData: TrialData = {
    userId: trial.userId,
    plan: trial.plan as PlanName,
    templatesUsed: trial.templatesUsed,
    imagesUsed: trial.imagesUsed,
    templatesLimit: trial.templatesLimit,
    imagesLimit: trial.imagesLimit,
    startedAt: trial.startedAt,
    expiresAt: trial.expiresAt,
    status: trial.status as TrialData["status"],
    stripeCustomerId: trial.stripeCustomerId,
  };

  // Initialize Redis cache with expiration at trial end
  if (redis && isRedisAvailable()) {
    try {
      const expirationTs = Math.floor(expiresAt.getTime() / 1000) + 86400; // +1 day buffer
      await redis.set(USAGE_CACHE_KEYS.trial(userId), JSON.stringify(trialData));
      await redis.expireat(USAGE_CACHE_KEYS.trial(userId), expirationTs);
    } catch (error) {
      logger.error("Failed to cache trial data", error as Error);
    }
  }

  return trialData;
}

/**
 * Get active trial for a user
 */
export async function getActiveTrial(userId: string): Promise<TrialData | null> {
  const redis = getRedis();

  // Check Redis first
  if (redis && isRedisAvailable()) {
    try {
      const cached = await redis.get<string>(USAGE_CACHE_KEYS.trial(userId));
      if (cached) {
        const trial = typeof cached === "string" ? JSON.parse(cached) : cached;
        // Check if trial is still active
        if (trial.status === "active" && new Date(trial.expiresAt) > new Date()) {
          return {
            ...trial,
            startedAt: new Date(trial.startedAt),
            expiresAt: new Date(trial.expiresAt),
          };
        }
      }
    } catch (error) {
      logger.warn("Redis cache miss for trial", { userId });
    }
  }

  // Fallback to database
  const trial = await prisma.trial.findUnique({
    where: { userId },
  });

  if (!trial || trial.status !== "active" || trial.expiresAt <= new Date()) {
    return null;
  }

  const trialData: TrialData = {
    userId: trial.userId,
    plan: trial.plan as PlanName,
    templatesUsed: trial.templatesUsed,
    imagesUsed: trial.imagesUsed,
    templatesLimit: trial.templatesLimit,
    imagesLimit: trial.imagesLimit,
    startedAt: trial.startedAt,
    expiresAt: trial.expiresAt,
    status: trial.status as TrialData["status"],
    stripeCustomerId: trial.stripeCustomerId,
  };

  // Repopulate Redis cache with expireat
  if (redis && isRedisAvailable()) {
    try {
      const expirationTs = Math.floor(trial.expiresAt.getTime() / 1000) + 86400;
      await redis.set(USAGE_CACHE_KEYS.trial(userId), JSON.stringify(trialData));
      await redis.expireat(USAGE_CACHE_KEYS.trial(userId), expirationTs);
    } catch (error) {
      logger.error("Failed to repopulate trial cache", error as Error);
    }
  }

  return trialData;
}

/**
 * Check if user is within trial usage limit
 */
export async function checkTrialUsageLimit(
  userId: string,
  type: UsageType
): Promise<UsageCheckResult> {
  const trial = await getActiveTrial(userId);

  if (!trial) {
    return {
      allowed: false,
      used: 0,
      limit: 0,
      remaining: 0,
      percentage: 0,
      isTrialUser: false,
    };
  }

  const used = type === "templateGeneration" ? trial.templatesUsed : trial.imagesUsed;
  const limit = type === "templateGeneration" ? trial.templatesLimit : trial.imagesLimit;
  const remaining = Math.max(0, limit - used);

  return {
    allowed: used < limit,
    used,
    limit,
    remaining,
    percentage: calculatePercentage(used, limit),
    resetDate: trial.expiresAt,
    isTrialUser: true,
  };
}

/**
 * Increment trial usage counter with rollback on failure
 */
export async function incrementTrialUsage(
  userId: string,
  type: UsageType,
  amount: number = 1
): Promise<number> {
  const redis = getRedis();
  const field = type === "templateGeneration" ? "templatesUsed" : "imagesUsed";
  const limitField = type === "templateGeneration" ? "templatesLimit" : "imagesLimit";

  if (redis && isRedisAvailable()) {
    try {
      const key = USAGE_CACHE_KEYS.trial(userId);
      const cached = await redis.get<string>(key);
      
      if (cached) {
        const trial = typeof cached === "string" ? JSON.parse(cached) : cached;
        const newUsage = (trial[field] || 0) + amount;
        const limit = trial[limitField] || TRIAL_LIMITS.templatesLimit;
        
        // Check limit BEFORE committing
        if (newUsage > limit) {
          throw new UsageLimitError({
            code: "TRIAL_LIMIT_REACHED",
            remaining: 0,
            limit,
            resetDate: new Date(trial.expiresAt),
          });
        }
        
        trial[field] = newUsage;
        
        // Get remaining TTL and update
        const ttl = await redis.ttl(key);
        await redis.setex(key, ttl > 0 ? ttl : CACHE_TTL.trial, JSON.stringify(trial));

        // Async sync to database every N increments
        if (newUsage % SYNC_THRESHOLD.trialIncrements === 0) {
          syncTrialToDatabase(userId).catch((err) =>
            logger.error("Trial sync error", err as Error)
          );
        }
        
        return newUsage;
      }
    } catch (error) {
      if (error instanceof UsageLimitError) throw error;
      logger.error("Failed to increment trial in Redis", error as Error);
    }
  }

  // Direct database update if Redis unavailable
  const result = await prisma.trial.update({
    where: { userId },
    data: {
      [field]: { increment: amount },
      lastSyncedAt: new Date(),
    },
  });

  return result[field as keyof typeof result] as number;
}

/**
 * Check one-trial-per-card rule
 * Returns true if card has been used for a trial (block new trial)
 */
export async function checkOneTrialPerCard(stripeCustomerId: string): Promise<boolean> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const existingTrial = await prisma.trial.findFirst({
    where: {
      stripeCustomerId,
      createdAt: { gte: ninetyDaysAgo },
    },
  });

  return !!existingTrial;
}

/**
 * Sync trial data from Redis to database
 */
export async function syncTrialToDatabase(userId: string): Promise<void> {
  const redis = getRedis();
  if (!redis || !isRedisAvailable()) return;

  try {
    const cached = await redis.get<string>(USAGE_CACHE_KEYS.trial(userId));
    if (!cached) return;

    const trial = typeof cached === "string" ? JSON.parse(cached) : cached;

    await prisma.trial.update({
      where: { userId },
      data: {
        templatesUsed: trial.templatesUsed,
        imagesUsed: trial.imagesUsed,
        lastSyncedAt: new Date(),
      },
    });
  } catch (error) {
    logger.error("Failed to sync trial to database", error as Error);
  }
}

/**
 * Convert trial to paid subscription
 */
export async function convertTrial(userId: string): Promise<void> {
  const redis = getRedis();

  // Update database
  await prisma.trial.update({
    where: { userId },
    data: {
      status: "converted",
      convertedAt: new Date(),
    },
  });

  // Clear Redis cache
  if (redis && isRedisAvailable()) {
    try {
      await redis.del(USAGE_CACHE_KEYS.trial(userId));
    } catch (error) {
      logger.error("Failed to clear trial cache", error as Error);
    }
  }
}

// ============================================================================
// Plan-Based Usage Functions
// ============================================================================

/**
 * Get plan limits for a user
 */
export async function getPlanLimits(userId: string): Promise<PlanLimits> {
  const redis = getRedis();

  // Check cache first
  if (redis && isRedisAvailable()) {
    try {
      const cached = await redis.get<string>(USAGE_CACHE_KEYS.planLimits(userId));
      if (cached) {
        return typeof cached === "string" ? JSON.parse(cached) : cached;
      }
    } catch (error) {
      logger.warn("Redis cache miss for plan limits", { userId });
    }
  }

  // Check if user has active trial
  const trial = await getActiveTrial(userId);
  if (trial) {
    const limits: PlanLimits = {
      templatesLimit: TRIAL_LIMITS.templatesLimit,
      imagesLimit: TRIAL_LIMITS.imagesLimit,
      plan: trial.plan,
      hasPremiumImageModel: false, // No premium images during trial
      hasPriorityQueue: false,
    };

    // Cache briefly
    if (redis && isRedisAvailable()) {
      await redis.setex(
        USAGE_CACHE_KEYS.planLimits(userId),
        60, // 1 minute for trial users
        JSON.stringify(limits)
      );
    }

    return limits;
  }

  // Query subscription from database
  const subscription = await prisma.subscription.findFirst({
    where: {
      referenceId: userId,
      status: "active",
    },
  });

  const planName = (subscription?.plan as PlanName) || "starter";
  const planConfig = PLAN_LIMITS[planName] || PLAN_LIMITS.starter;

  const limits: PlanLimits = {
    templatesLimit: planConfig.templatesLimit,
    imagesLimit: planConfig.imagesLimit,
    plan: planName,
    hasPremiumImageModel: planConfig.hasPremiumImageModel,
    hasPriorityQueue: planConfig.hasPriorityQueue,
  };

  // Cache plan limits
  if (redis && isRedisAvailable()) {
    try {
      await redis.setex(
        USAGE_CACHE_KEYS.planLimits(userId),
        CACHE_TTL.planLimits,
        JSON.stringify(limits)
      );
    } catch (error) {
      logger.error("Failed to cache plan limits", error as Error);
    }
  }

  return limits;
}

/**
 * Get current usage quota for a user
 */
export async function getCurrentQuota(userId: string): Promise<UsageQuotaData> {
  const redis = getRedis();
  const month = getCurrentMonth();
  const cacheKey = USAGE_CACHE_KEYS.usage(userId, month);

  // Check Redis cache first
  if (redis && isRedisAvailable()) {
    try {
      const cached = await redis.get<string>(cacheKey);
      if (cached) {
        const quota = typeof cached === "string" ? JSON.parse(cached) : cached;
        return {
          ...quota,
          periodStart: new Date(quota.periodStart),
          periodEnd: new Date(quota.periodEnd),
          lastSyncedAt: new Date(quota.lastSyncedAt),
        };
      }
    } catch (error) {
      logger.warn("Redis cache miss for usage quota", { userId, month });
    }
  }

  // Query database
  const { start, end } = getMonthBoundaries();
  let quota = await prisma.usageQuota.findFirst({
    where: {
      userId,
      periodStart: { lte: new Date() },
      periodEnd: { gte: new Date() },
    },
  });

  // Create new quota record if none exists
  if (!quota) {
    const limits = await getPlanLimits(userId);
    quota = await prisma.usageQuota.create({
      data: {
        userId,
        plan: limits.plan,
        periodStart: start,
        periodEnd: end,
        templatesUsed: 0,
        templatesLimit: limits.templatesLimit,
        imagesUsed: 0,
        imagesLimit: limits.imagesLimit,
      },
    });
  }

  const quotaData: UsageQuotaData = {
    userId: quota.userId,
    plan: quota.plan as PlanName,
    templatesUsed: quota.templatesUsed,
    templatesLimit: quota.templatesLimit,
    imagesUsed: quota.imagesUsed,
    imagesLimit: quota.imagesLimit,
    periodStart: quota.periodStart,
    periodEnd: quota.periodEnd,
    lastSyncedAt: quota.lastSyncedAt,
  };

  // Populate Redis cache with expireat at end of month
  if (redis && isRedisAvailable()) {
    try {
      await redis.set(cacheKey, JSON.stringify(quotaData));
      await redis.expireat(cacheKey, getEndOfMonthTimestamp() + 86400); // +1 day buffer
    } catch (error) {
      logger.error("Failed to cache usage quota", error as Error);
    }
  }

  return quotaData;
}

/**
 * Check if user is within usage limit (pre-check before action)
 */
export async function checkUsageLimit(
  userId: string,
  type: UsageType,
  amount: number = 1
): Promise<UsageCheckResult> {
  // Check if user is in trial
  const trial = await getActiveTrial(userId);
  if (trial) {
    return checkTrialUsageLimit(userId, type);
  }

  // Get current quota
  const quota = await getCurrentQuota(userId);
  const used = type === "templateGeneration" ? quota.templatesUsed : quota.imagesUsed;
  const limit = type === "templateGeneration" ? quota.templatesLimit : quota.imagesLimit;
  const remaining = Math.max(0, limit - used);

  return {
    allowed: used + amount <= limit,
    used,
    limit,
    remaining,
    percentage: calculatePercentage(used, limit),
    resetDate: quota.periodEnd,
    isTrialUser: false,
  };
}

/**
 * Check if user can perform an action WITHOUT incrementing usage
 * Use this to check before performing an expensive operation
 */
export async function canPerformAction(
  userId: string,
  type: UsageType,
  amount: number = 1
): Promise<boolean> {
  try {
    const result = await checkUsageLimit(userId, type, amount);
    return result.allowed;
  } catch (error) {
    logger.error(`Error checking action permission for ${type}`, { userId, error });
    // Default to allowing action if check fails (fail-open)
    return true;
  }
}

/**
 * Increment usage counter with rollback on quota exceeded
 */
export async function incrementUsage(
  userId: string,
  type: UsageType,
  amount: number = 1
): Promise<number> {
  // Check if user is in trial
  const trial = await getActiveTrial(userId);
  if (trial) {
    return incrementTrialUsage(userId, type, amount);
  }

  const redis = getRedis();
  const month = getCurrentMonth();
  const cacheKey = USAGE_CACHE_KEYS.usage(userId, month);
  const field = type === "templateGeneration" ? "templatesUsed" : "imagesUsed";
  const limitField = type === "templateGeneration" ? "templatesLimit" : "imagesLimit";

  if (redis && isRedisAvailable()) {
    try {
      const cached = await redis.get<string>(cacheKey);
      
      if (cached) {
        const quota = typeof cached === "string" ? JSON.parse(cached) : cached;
        const newUsage = (quota[field] || 0) + amount;
        const limit = quota[limitField];
        
        // Check limit BEFORE committing (rollback pattern)
        if (newUsage > limit) {
          throw new UsageLimitError({
            code: "QUOTA_EXCEEDED",
            remaining: 0,
            limit,
            resetDate: new Date(quota.periodEnd),
          });
        }
        
        quota[field] = newUsage;
        quota.lastSyncedAt = new Date().toISOString();

        // Update cache (TTL managed by expireat)
        await redis.set(cacheKey, JSON.stringify(quota));

        // Async sync to database every N increments
        if (newUsage % SYNC_THRESHOLD.usageIncrements === 0) {
          syncUsageToDatabase(userId).catch((err) =>
            logger.error("Usage sync error", err as Error)
          );
        }
        
        return newUsage;
      }
    } catch (error) {
      if (error instanceof UsageLimitError) throw error;
      logger.error("Failed to increment usage in Redis", error as Error);
    }
  }

  // Direct database update if Redis unavailable or cache miss
  const { start, end } = getMonthBoundaries();
  
  // First check limit
  const currentQuota = await getCurrentQuota(userId);
  const currentUsed = type === "templateGeneration" ? currentQuota.templatesUsed : currentQuota.imagesUsed;
  const currentLimit = type === "templateGeneration" ? currentQuota.templatesLimit : currentQuota.imagesLimit;
  
  if (currentUsed + amount > currentLimit) {
    throw new UsageLimitError({
      code: "QUOTA_EXCEEDED",
      remaining: 0,
      limit: currentLimit,
      resetDate: currentQuota.periodEnd,
    });
  }
  
  const result = await prisma.usageQuota.upsert({
    where: {
      userId_periodStart: {
        userId,
        periodStart: start,
      },
    },
    create: {
      userId,
      plan: "starter", // Will be updated on next check
      periodStart: start,
      periodEnd: end,
      templatesUsed: type === "templateGeneration" ? amount : 0,
      templatesLimit: PLAN_LIMITS.starter.templatesLimit,
      imagesUsed: type === "imageGeneration" ? amount : 0,
      imagesLimit: PLAN_LIMITS.starter.imagesLimit,
    },
    update: {
      [field]: { increment: amount },
      lastSyncedAt: new Date(),
    },
  });

  return result[field as keyof typeof result] as number;
}

/**
 * Sync usage data from Redis to database
 */
export async function syncUsageToDatabase(userId: string): Promise<void> {
  const redis = getRedis();
  if (!redis || !isRedisAvailable()) return;

  const month = getCurrentMonth();
  const cacheKey = USAGE_CACHE_KEYS.usage(userId, month);

  try {
    const cached = await redis.get<string>(cacheKey);
    if (!cached) return;

    const quota = typeof cached === "string" ? JSON.parse(cached) : cached;

    await prisma.usageQuota.update({
      where: {
        userId_periodStart: {
          userId,
          periodStart: new Date(quota.periodStart),
        },
      },
      data: {
        templatesUsed: quota.templatesUsed,
        imagesUsed: quota.imagesUsed,
        lastSyncedAt: new Date(),
      },
    });
  } catch (error) {
    logger.error("Failed to sync usage to database", error as Error);
  }
}

/**
 * Reset monthly usage (called at billing period start)
 */
export async function resetMonthlyUsage(userId: string): Promise<void> {
  const redis = getRedis();

  // Delete old Redis key
  if (redis && isRedisAvailable()) {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;
    
    try {
      await redis.del(USAGE_CACHE_KEYS.usage(userId, lastMonthKey));
      await redis.del(USAGE_CACHE_KEYS.planLimits(userId));
    } catch (error) {
      logger.error("Failed to clear usage cache", error as Error);
    }
  }

  // New quota will be created lazily on first generation
}

// ============================================================================
// Utility Functions for Checking Plan Features
// ============================================================================

/**
 * Check if user can use premium image models
 * Use with image-models.ts for model selection
 */
export async function canUsePremiumImageModel(userId: string): Promise<boolean> {
  const trial = await getActiveTrial(userId);
  if (trial) return false; // No premium images during trial

  const limits = await getPlanLimits(userId);
  return limits.hasPremiumImageModel;
}

/**
 * Check if user has priority processing
 */
export async function hasPriorityQueue(userId: string): Promise<boolean> {
  const trial = await getActiveTrial(userId);
  if (trial) return false;

  const limits = await getPlanLimits(userId);
  return limits.hasPriorityQueue;
}

/**
 * Get comprehensive usage summary with warning/critical alerts
 */
export async function getUsageSummary(userId: string): Promise<UsageSummary> {
  const trial = await getActiveTrial(userId);
  const limits = await getPlanLimits(userId);
  
  let usageLimits: UsageLimit[] = [];
  let resetDate: Date;
  
  if (trial) {
    resetDate = trial.expiresAt;
    usageLimits = [
      {
        type: "templateGeneration",
        used: trial.templatesUsed,
        limit: trial.templatesLimit,
        remaining: Math.max(0, trial.templatesLimit - trial.templatesUsed),
        percentage: calculatePercentage(trial.templatesUsed, trial.templatesLimit),
        resetDate,
      },
      {
        type: "imageGeneration",
        used: trial.imagesUsed,
        limit: trial.imagesLimit,
        remaining: Math.max(0, trial.imagesLimit - trial.imagesUsed),
        percentage: calculatePercentage(trial.imagesUsed, trial.imagesLimit),
        resetDate,
      },
    ];
  } else {
    const quota = await getCurrentQuota(userId);
    resetDate = quota.periodEnd;
    usageLimits = [
      {
        type: "templateGeneration",
        used: quota.templatesUsed,
        limit: quota.templatesLimit,
        remaining: Math.max(0, quota.templatesLimit - quota.templatesUsed),
        percentage: calculatePercentage(quota.templatesUsed, quota.templatesLimit),
        resetDate,
      },
      {
        type: "imageGeneration",
        used: quota.imagesUsed,
        limit: quota.imagesLimit,
        remaining: Math.max(0, quota.imagesLimit - quota.imagesUsed),
        percentage: calculatePercentage(quota.imagesUsed, quota.imagesLimit),
        resetDate,
      },
    ];
  }
  
  // Categorize by warning/critical thresholds
  const warningLimits = usageLimits.filter(
    (l) => l.percentage >= USAGE_THRESHOLDS.warning && l.percentage < USAGE_THRESHOLDS.critical
  );
  const criticalLimits = usageLimits.filter(
    (l) => l.percentage >= USAGE_THRESHOLDS.critical
  );
  const isOverLimit = usageLimits.some((l) => l.percentage >= 100);

  return {
    userId,
    planName: limits.plan,
    isTrialUser: !!trial,
    limits: usageLimits,
    isOverLimit,
    warningLimits,
    criticalLimits,
  };
}

/**
 * Get comprehensive usage stats for a user (legacy format for backward compatibility)
 */
export async function getUserUsageStats(userId: string): Promise<{
  trial: TrialData | null;
  quota: UsageQuotaData | null;
  limits: PlanLimits;
  templateUsage: UsageCheckResult;
  imageUsage: UsageCheckResult;
}> {
  const trial = await getActiveTrial(userId);
  const limits = await getPlanLimits(userId);

  let quota: UsageQuotaData | null = null;
  if (!trial) {
    quota = await getCurrentQuota(userId);
  }

  const templateUsage = await checkUsageLimit(userId, "templateGeneration");
  const imageUsage = await checkUsageLimit(userId, "imageGeneration");

  return {
    trial,
    quota,
    limits,
    templateUsage,
    imageUsage,
  };
}

/**
 * Clear all cached data for a user (useful after plan changes)
 */
export async function clearUserCache(userId: string): Promise<void> {
  const redis = getRedis();
  if (!redis || !isRedisAvailable()) return;

  const month = getCurrentMonth();
  
  try {
    await Promise.all([
      redis.del(USAGE_CACHE_KEYS.trial(userId)),
      redis.del(USAGE_CACHE_KEYS.usage(userId, month)),
      redis.del(USAGE_CACHE_KEYS.planLimits(userId)),
    ]);
  } catch (error) {
    logger.error("Failed to clear user cache", error as Error);
  }
}

// ============================================================================
// Domain-Specific Helper Methods (UsageTracker)
// ============================================================================

/**
 * Domain-specific helper methods for common usage tracking scenarios
 * Provides a cleaner API for specific operations
 */
export const UsageTracker = {
  /**
   * Track template generation
   * @returns New usage count
   * @throws UsageLimitError if quota exceeded
   */
  async trackTemplateGeneration(userId: string, count: number = 1): Promise<number> {
    return incrementUsage(userId, "templateGeneration", count);
  },

  /**
   * Track image generation
   * @returns New usage count
   * @throws UsageLimitError if quota exceeded
   */
  async trackImageGeneration(userId: string, count: number = 1): Promise<number> {
    return incrementUsage(userId, "imageGeneration", count);
  },

  /**
   * Check if user can generate templates without incrementing
   */
  async canGenerateTemplate(userId: string, count: number = 1): Promise<boolean> {
    return canPerformAction(userId, "templateGeneration", count);
  },

  /**
   * Check if user can generate images without incrementing
   */
  async canGenerateImage(userId: string, count: number = 1): Promise<boolean> {
    return canPerformAction(userId, "imageGeneration", count);
  },

  /**
   * Get template usage info
   */
  async getTemplateUsage(userId: string): Promise<UsageCheckResult> {
    return checkUsageLimit(userId, "templateGeneration");
  },

  /**
   * Get image usage info
   */
  async getImageUsage(userId: string): Promise<UsageCheckResult> {
    return checkUsageLimit(userId, "imageGeneration");
  },

  /**
   * Check if user is near template limit (>80%)
   */
  async isNearTemplateLimit(userId: string): Promise<boolean> {
    const result = await checkUsageLimit(userId, "templateGeneration");
    return result.percentage >= USAGE_THRESHOLDS.warning;
  },

  /**
   * Check if user is near image limit (>80%)
   */
  async isNearImageLimit(userId: string): Promise<boolean> {
    const result = await checkUsageLimit(userId, "imageGeneration");
    return result.percentage >= USAGE_THRESHOLDS.warning;
  },

  /**
   * Get full usage summary with warnings
   */
  async getSummary(userId: string): Promise<UsageSummary> {
    return getUsageSummary(userId);
  },
};

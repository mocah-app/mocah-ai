/**
 * Usage Tracking Service
 * Redis-cached usage tracking with database sync for subscriptions
 * 
 * Features:
 * - Rollback pattern on quota exceeded
 * - Pre-check before action (canPerformAction)
 * - Warning/critical thresholds for usage alerts
 * - Auto monthly reset using Redis expireat
 * - Domain-specific helper methods (UsageTracker object)
 * - Trial usage tracked directly in Subscription model
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
  plan: PlanName;
  templatesUsed: number;
  imagesUsed: number;
  templatesLimit: number;
  imagesLimit: number;
  startedAt: Date;
  expiresAt: Date;
  status: "active";
}

interface UsageQuotaData {
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


// ============================================================================
// Cache Keys
// ============================================================================

const USAGE_CACHE_KEYS = {
  usage: (userId: string, month: string) => `usage:${userId}:${month}`,
  planLimits: (userId: string) => `plan:${userId}`,
} as const;

// Cache TTLs in seconds
const CACHE_TTL = {
  usage: 35 * 24 * 60 * 60, // 35 days (month + buffer)
  planLimits: 5 * 60, // 5 minutes
} as const;

// Sync thresholds
const SYNC_THRESHOLD = {
  usageIncrements: 10, // Sync to DB every 10 increments
  maxSyncInterval: 5 * 60 * 1000, // 5 minutes max between syncs
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


function calculatePercentage(used: number, limit: number): number {
  if (limit === 0) return 100;
  return Math.round((used / limit) * 100);
}

// ============================================================================
// Trial Management Functions
// ============================================================================

/**
 * Get active trial for a user from subscription
 */
export async function getActiveTrial(userId: string): Promise<TrialData | null> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      referenceId: userId,
      status: "trialing",
    },
  });

  if (!subscription || !subscription.trialEnd) {
    return null;
  }

  // Check if trial has expired
  if (subscription.trialEnd <= new Date()) {
    return null;
  }

  return {
    plan: subscription.plan as PlanName,
    templatesUsed: subscription.trialTemplatesUsed,
    imagesUsed: subscription.trialImagesUsed,
    templatesLimit: TRIAL_LIMITS.templatesLimit,
    imagesLimit: TRIAL_LIMITS.imagesLimit,
    startedAt: subscription.trialStart || subscription.createdAt || new Date(),
    expiresAt: subscription.trialEnd,
    status: "active",
  };
}

/**
 * Check if user is within trial usage limit
 */
async function checkTrialUsageLimit(
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
 * Increment trial usage counter directly in subscription
 */
async function incrementTrialUsage(
  userId: string,
  type: UsageType,
  amount: number = 1
): Promise<number> {
  const field = type === "templateGeneration" ? "trialTemplatesUsed" : "trialImagesUsed";
  const limit = type === "templateGeneration" ? TRIAL_LIMITS.templatesLimit : TRIAL_LIMITS.imagesLimit;

  // Get current subscription to check limit
  const subscription = await prisma.subscription.findFirst({
    where: {
      referenceId: userId,
      status: "trialing",
    },
  });

  if (!subscription) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "No active trial found",
    });
  }

  const currentUsage = subscription[field];
  const newUsage = currentUsage + amount;

  // Check limit BEFORE committing
  if (newUsage > limit) {
    throw new UsageLimitError({
      code: "TRIAL_LIMIT_REACHED",
      remaining: 0,
      limit,
      resetDate: subscription.trialEnd || undefined,
    });
  }

  // Update subscription
  const updated = await prisma.subscription.updateMany({
    where: {
      referenceId: userId,
      status: "trialing",
    },
    data: {
      [field]: newUsage,
      updatedAt: new Date(),
    },
  });

  if (updated.count === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Failed to update trial usage",
    });
  }

  return newUsage;
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

  // Check if user is in trial first (uses cache + validation)
  const trial = await getActiveTrial(userId);
  if (trial) {
    const limits: PlanLimits = {
      templatesLimit: TRIAL_LIMITS.templatesLimit,
      imagesLimit: TRIAL_LIMITS.imagesLimit,
      plan: (trial.plan as PlanName) || "starter",
      hasPremiumImageModel: false, // No premium images during trial
      hasPriorityQueue: false,
    };

    // Cache briefly for trial users
    if (redis && isRedisAvailable()) {
      await redis.setex(
        USAGE_CACHE_KEYS.planLimits(userId),
        60, // 1 minute for trial users
        JSON.stringify(limits)
      );
    }

    return limits;
  }

  // Query subscription for active users
  const subscription = await prisma.subscription.findFirst({
    where: {
      referenceId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Active subscription limits
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


// ============================================================================
// Utility Functions for Checking Plan Features
// ============================================================================

/**
 * Check if user can use premium image models
 * Use with image-models.ts for model selection
 */
export async function canUsePremiumImageModel(userId: string): Promise<boolean> {
  const limits = await getPlanLimits(userId);
  return limits.hasPremiumImageModel;
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



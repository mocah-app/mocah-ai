/**
 * Usage Quota Limit Management
 * Handles updating usage quota limits when subscription plans change
 */

import prisma from "@mocah/db";
import { getRedis, CACHE_KEYS, isRedisAvailable } from "@mocah/shared/redis";
import { logger } from "@mocah/shared/logger";
import { PLAN_LIMITS, type PlanName } from "./subscription-plans";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get current month in YYYY-MM format
 */
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Get end of current month as Unix timestamp
 */
function getEndOfMonthTimestamp(): number {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return Math.floor(end.getTime() / 1000);
}

// ============================================================================
// Main Export
// ============================================================================

/**
 * Update usage quota limits for a plan change (upgrade/downgrade)
 * Updates Redis immediately, then syncs to database in background
 * 
 * @param userId - User ID
 * @param planName - New plan name (starter, pro, scale)
 * @param periodStart - Billing period start date
 * @param periodEnd - Billing period end date
 */
export async function updateUsageQuotaLimits(
  userId: string,
  planName: PlanName,
  periodStart: Date,
  periodEnd: Date
): Promise<void> {
  const redis = getRedis();
  const limits = PLAN_LIMITS[planName];

  if (!limits) {
    logger.error("Invalid plan name for usage quota update", { userId, planName });
    throw new Error(`Invalid plan name: ${planName}`);
  }

  const month = getCurrentMonth();
  const cacheKey = CACHE_KEYS.usage(userId, month);

  // Step 1: Update Redis first for immediate effect
  if (redis && isRedisAvailable()) {
    try {
      const cached = await redis.get<string>(cacheKey);
      
      if (cached) {
        const quota = typeof cached === "string" ? JSON.parse(cached) : cached;
        
        // Update limits in cache (keep usage counters)
        quota.plan = planName;
        quota.templatesLimit = limits.templatesLimit;
        quota.imagesLimit = limits.imagesLimit;
        quota.lastSyncedAt = new Date().toISOString();

        // Write back to Redis immediately
        await redis.set(cacheKey, JSON.stringify(quota));
        await redis.expireat(cacheKey, getEndOfMonthTimestamp() + 86400);

        logger.info("Updated usage quota limits in Redis", {
          userId,
          planName,
          newLimits: { templates: limits.templatesLimit, images: limits.imagesLimit },
        });
      }

      // Clear plan limits cache so fresh limits are fetched
      await redis.del(CACHE_KEYS.planLimits(userId));
    } catch (error) {
      logger.error("Failed to update usage quota in Redis", { userId, planName, error });
    }
  }

  // Step 2: Update database in background (non-blocking)
  setImmediate(async () => {
    try {
      // Find existing quota for current period
      const existingQuota = await prisma.usageQuota.findFirst({
        where: {
          userId,
          periodEnd: { gte: new Date() }, // Current or future period
        },
      });

      if (existingQuota) {
        // Update existing quota with new limits (keep usage counters)
        await prisma.usageQuota.update({
          where: { id: existingQuota.id },
          data: {
            plan: planName,
            templatesLimit: limits.templatesLimit,
            imagesLimit: limits.imagesLimit,
            lastSyncedAt: new Date(),
          },
        });

        logger.info("Updated usage quota limits in database", {
          userId,
          planName,
          oldLimits: { 
            templates: existingQuota.templatesLimit, 
            images: existingQuota.imagesLimit 
          },
          newLimits: { 
            templates: limits.templatesLimit, 
            images: limits.imagesLimit 
          },
        });
      } else {
        // Create new quota if none exists
        await prisma.usageQuota.create({
          data: {
            userId,
            plan: planName,
            periodStart,
            periodEnd,
            templatesUsed: 0,
            templatesLimit: limits.templatesLimit,
            imagesUsed: 0,
            imagesLimit: limits.imagesLimit,
          },
        });

        logger.info("Created new usage quota in database", { userId, planName });
      }
    } catch (error) {
      logger.error("Failed to update usage quota in database", { 
        userId, 
        planName, 
        error 
      });
    }
  });
}


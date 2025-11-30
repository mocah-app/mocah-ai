/**
 * Quota caching utilities for usage tracking
 * Caches usage quotas to reduce database queries for real-time enforcement
 *
 */

import { logger } from "@mocah/shared";
import { CACHE_KEYS, getRedis, isRedisAvailable } from "@mocah/shared/redis";

// TTL for quota cache (5 minutes - balances freshness with performance)
const QUOTA_TTL_SECONDS = 5 * 60;

export interface QuotaData {
  textGenerations: number;
  imageGenerations: number;
  totalTokens: number;
  limitTextGenerations: number | null;
  limitImageGenerations: number | null;
  limitTokens: number | null;
  periodStart: string; // ISO date string
  periodEnd: string; // ISO date string
}

/**
 * Get cached quota data for an organization/user
 * Uses Redis hash (HGETALL) for efficient field access
 */
export async function getCachedQuota(
  orgId: string,
  userId: string | null,
  period: string
): Promise<QuotaData | null> {
  const redis = getRedis();
  const key = CACHE_KEYS.quota(orgId, userId, period);

  if (!isRedisAvailable() || !redis) {
    return null;
  }

  try {
    const hash = await redis.hgetall<Record<string, string>>(key);
    
    // If hash is empty or doesn't exist, return null
    if (!hash || Object.keys(hash).length === 0) {
      return null;
    }

    // Reconstruct QuotaData from hash fields
    return {
      textGenerations: parseInt(hash.textGenerations || "0", 10),
      imageGenerations: parseInt(hash.imageGenerations || "0", 10),
      totalTokens: parseInt(hash.totalTokens || "0", 10),
      limitTextGenerations: hash.limitTextGenerations
        ? parseInt(hash.limitTextGenerations, 10)
        : null,
      limitImageGenerations: hash.limitImageGenerations
        ? parseInt(hash.limitImageGenerations, 10)
        : null,
      limitTokens: hash.limitTokens ? parseInt(hash.limitTokens, 10) : null,
      periodStart: hash.periodStart || "",
      periodEnd: hash.periodEnd || "",
    };
  } catch (error) {
    logger.error("Redis HGETALL error for quota cache", error as Error);
    return null;
  }
}

/**
 * Cache quota data using Redis hash (HSET)
 * Stores quota fields as hash fields for atomic operations
 */
export async function cacheQuota(
  orgId: string,
  userId: string | null,
  period: string,
  quota: QuotaData
): Promise<void> {
  const redis = getRedis();
  const key = CACHE_KEYS.quota(orgId, userId, period);

  if (!isRedisAvailable() || !redis) {
    logger.warn("Redis not available for quota cache set");
    return;
  }

  try {
    // Store quota data as hash fields
    await redis.hset(key, {
      textGenerations: quota.textGenerations.toString(),
      imageGenerations: quota.imageGenerations.toString(),
      totalTokens: quota.totalTokens.toString(),
      limitTextGenerations: quota.limitTextGenerations?.toString() || "",
      limitImageGenerations: quota.limitImageGenerations?.toString() || "",
      limitTokens: quota.limitTokens?.toString() || "",
      periodStart: quota.periodStart,
      periodEnd: quota.periodEnd,
    });

    // Set TTL on the hash key
    await redis.expire(key, QUOTA_TTL_SECONDS);
  } catch (error) {
    logger.error("Redis HSET error for quota cache", error as Error);
  }
}

/**
 * Invalidate quota cache (call when quota is updated)
 */
export async function invalidateQuotaCache(
  orgId: string,
  userId: string | null,
  period: string
): Promise<void> {
  const redis = getRedis();
  const key = CACHE_KEYS.quota(orgId, userId, period);

  if (isRedisAvailable() && redis) {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error("Redis del error for quota cache", error as Error);
    }
  }
}

/**
 * Increment quota counters atomically using HINCRBY
 * Thread-safe atomic increments without race conditions
 * 
 * Note: The quota hash must exist (call cacheQuota first if needed)
 * If fields don't exist, HINCRBY will initialize them to 0 before incrementing
 */
export async function incrementQuotaCounters(
  orgId: string,
  userId: string | null,
  period: string,
  increments: {
    textGenerations?: number;
    imageGenerations?: number;
    totalTokens?: number;
  }
): Promise<void> {
  const redis = getRedis();
  const key = CACHE_KEYS.quota(orgId, userId, period);

  if (!isRedisAvailable() || !redis) {
    logger.warn("Redis not available for quota counter increment");
    return;
  }

  try {
    // Use HINCRBY for atomic increments on hash fields
    const promises: Promise<number>[] = [];

    if (increments.textGenerations !== undefined) {
      promises.push(
        redis.hincrby(key, "textGenerations", increments.textGenerations)
      );
    }

    if (increments.imageGenerations !== undefined) {
      promises.push(
        redis.hincrby(key, "imageGenerations", increments.imageGenerations)
      );
    }

    if (increments.totalTokens !== undefined) {
      promises.push(
        redis.hincrby(key, "totalTokens", increments.totalTokens)
      );
    }

    // Execute all increments atomically
    if (promises.length > 0) {
      await Promise.all(promises);
      
      // Refresh TTL to ensure cache doesn't expire during active usage
      await redis.expire(key, QUOTA_TTL_SECONDS);
    }
  } catch (error) {
    logger.error("Redis HINCRBY error for quota cache", error as Error);
  }
}

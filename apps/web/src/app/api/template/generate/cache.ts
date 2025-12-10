/**
 * Redis-backed cache for template generation API
 * Works across all serverless function instances (Vercel-compatible)
 * Redis handles TTL expiration automatically
 */

import { logger } from "@mocah/shared";
import {
  CACHE_KEYS,
  getRedis,
  isRedisAvailable,
} from "@mocah/shared/redis";


// TTL settings (in seconds for Redis)
const BRAND_KIT_TTL_SECONDS = 10 * 60; // 10 minutes (rarely changes)
const BRAND_GUIDE_PREFERENCE_TTL_SECONDS = 30 * 60; // 30 minutes (user preference)

/**
 * Get cached brand kit or null if not cached/expired
 */
export async function getCachedBrandKit(
  orgId: string
): Promise<unknown | null> {
  const redis = getRedis();
  const key = CACHE_KEYS.brandKit(orgId);

  if (!isRedisAvailable() || !redis) {
    logger.warn("Redis not available for brand kit cache lookup");
    return null;
  }

  try {
    const cached = await redis.get(key);
    return cached ?? null;
  } catch (error) {
    logger.error("Redis get error for brand kit cache", error as Error);
    return null;
  }
}

/**
 * Cache brand kit with TTL
 */
export async function cacheBrandKit(
  orgId: string,
  brandKit: unknown
): Promise<void> {
  const redis = getRedis();
  const key = CACHE_KEYS.brandKit(orgId);

  if (!isRedisAvailable() || !redis) {
    logger.warn("Redis not available for brand kit cache set");
    return;
  }

  try {
    await redis.setex(key, BRAND_KIT_TTL_SECONDS, brandKit);
  } catch (error) {
    logger.error("Redis set error for brand kit cache", error as Error);
  }
}

/**
 * Invalidate brand kit cache (call when brand kit is updated)
 * Redis TTL handles automatic expiration, but manual invalidation ensures
 * immediate consistency when brand kit is updated
 */
export async function invalidateBrandKitCache(orgId: string): Promise<void> {
  const redis = getRedis();
  const key = CACHE_KEYS.brandKit(orgId);

  if (!isRedisAvailable() || !redis) {
    logger.warn("Redis not available for brand kit cache invalidation");
    return;
  }

  try {
    await redis.del(key);
  } catch (error) {
    logger.error("Redis del error for brand kit cache", error as Error);
  }
}

/**
 * Get cached brand guide preference or null if not cached/expired
 * Returns true if brand guide should be included, false if excluded, null if not set
 */
export async function getCachedBrandGuidePreference(
  userId: string,
  orgId: string
): Promise<boolean | null> {
  const redis = getRedis();
  const key = CACHE_KEYS.brandGuidePreference(userId, orgId);

  if (!isRedisAvailable() || !redis) {
    logger.warn("Redis not available for brand guide preference cache lookup");
    return null;
  }

  try {
    const cached = await redis.get<boolean>(key);
    return cached ?? null;
  } catch (error) {
    logger.error("Redis get error for brand guide preference cache", error as Error);
    return null;
  }
}

/**
 * Cache brand guide preference with TTL
 * @param includeBrandGuide - true to include brand guide, false to exclude
 */
export async function cacheBrandGuidePreference(
  userId: string,
  orgId: string,
  includeBrandGuide: boolean
): Promise<void> {
  const redis = getRedis();
  const key = CACHE_KEYS.brandGuidePreference(userId, orgId);

  if (!isRedisAvailable() || !redis) {
    logger.warn("Redis not available for brand guide preference cache set");
    return;
  }

  try {
    await redis.setex(key, BRAND_GUIDE_PREFERENCE_TTL_SECONDS, includeBrandGuide);
  } catch (error) {
    logger.error("Redis set error for brand guide preference cache", error as Error);
  }
}

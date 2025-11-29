/**
 * Redis-backed cache for template generation API
 * Works across all serverless function instances (Vercel-compatible)
 * Redis handles TTL expiration automatically
 */

import { getRedis, isRedisAvailable, CACHE_KEYS, logger } from "@mocah/shared";

// TTL settings (in seconds for Redis)
const MEMBERSHIP_TTL_SECONDS = 2 * 60; // 2 minutes (shorter for security)
const BRAND_KIT_TTL_SECONDS = 10 * 60; // 10 minutes (rarely changes)

/**
 * Get cached membership status or null if not cached/expired
 */
export async function getCachedMembership(
  userId: string,
  orgId: string
): Promise<boolean | null> {
  const redis = getRedis();
  const key = CACHE_KEYS.membership(userId, orgId);

  if (!isRedisAvailable() || !redis) {
    logger.warn("Redis not available for membership cache lookup");
    return null;
  }

  try {
    const cached = await redis.get<boolean>(key);
    return cached ?? null;
  } catch (error) {
    logger.error("Redis get error for membership cache", error as Error);
    return null;
  }
}

/**
 * Cache membership status with TTL
 */
export async function cacheMembership(
  userId: string,
  orgId: string,
  isMember: boolean
): Promise<void> {
  const redis = getRedis();
  const key = CACHE_KEYS.membership(userId, orgId);

  if (!isRedisAvailable() || !redis) {
    logger.warn("Redis not available for membership cache set");
    return;
  }

  try {
    await redis.setex(key, MEMBERSHIP_TTL_SECONDS, isMember);
  } catch (error) {
    logger.error("Redis set error for membership cache", error as Error);
  }
}

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

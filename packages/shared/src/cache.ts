import { CACHE_KEYS, getRedis, isRedisAvailable } from "./redis";
import { logger } from "./logger";

// TTL settings (in seconds for Redis)
const MEMBERSHIP_TTL_SECONDS = 2 * 60; // 2 minutes (shorter for security)

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
    return;
  }

  try {
    await redis.setex(key, MEMBERSHIP_TTL_SECONDS, isMember);
  } catch (error) {
    logger.error("Redis set error for membership cache", error as Error);
  }
}

/**
 * Invalidate (delete) cached membership status
 * Call this when membership changes (user added/removed from org)
 */
export async function invalidateMembershipCache(
  userId: string,
  orgId: string
): Promise<void> {
  const redis = getRedis();
  const key = CACHE_KEYS.membership(userId, orgId);

  if (!isRedisAvailable() || !redis) {
    return;
  }

  try {
    await redis.del(key);
  } catch (error) {
    logger.error("Redis delete error for membership cache", error as Error);
  }
}

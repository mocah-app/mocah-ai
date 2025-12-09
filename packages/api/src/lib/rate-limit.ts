import { serverEnv } from "@mocah/config/env";
import { logger } from "@mocah/shared/logger";
import { CACHE_KEYS, getRedis, isRedisAvailable } from "@mocah/shared/redis";
const DEFAULT_PER_MINUTE = 10;
const DEFAULT_PER_DAY = 200;

export async function enforceImageRateLimits(
  userId: string,
  organizationId: string
) {
  const redis = getRedis();
  if (!isRedisAvailable() || !redis) {
    logger.warn("Redis unavailable - skipping image rate limits");
    return;
  }

  const perMinute = serverEnv.FAL_IMAGE_RATE_PER_MINUTE ?? DEFAULT_PER_MINUTE;
  const perDay = serverEnv.FAL_IMAGE_RATE_PER_DAY ?? DEFAULT_PER_DAY;

  const minuteKey = CACHE_KEYS.rateLimit(
    `image:${organizationId}:${userId}`,
    "1m"
  );
  const dayKey = CACHE_KEYS.rateLimit(
    `image:${organizationId}:${userId}`,
    "1d"
  );

  const [minuteCount, dayCount] = await Promise.all([
    redis.incr(minuteKey),
    redis.incr(dayKey),
  ]);

  if (minuteCount === 1) {
    await redis.expire(minuteKey, 60);
  }
  if (dayCount === 1) {
    await redis.expire(dayKey, 60 * 60 * 24);
  }

  if (minuteCount > perMinute) {
    throw new Error("Image generation rate limit exceeded (per minute)");
  }
  if (dayCount > perDay) {
    throw new Error("Image generation rate limit exceeded (per day)");
  }
}

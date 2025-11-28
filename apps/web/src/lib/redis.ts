/**
 * Upstash Redis client for serverless caching
 * Works across all Vercel serverless function instances
 */

import { Redis } from "@upstash/redis";
import { logger } from "@mocah/shared";

// Initialize Redis client (will be null if env vars not set)
let redis: Redis | null = null;

try {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    logger.info("Redis client initialized successfully");
  } else {
    logger.warn(
      "Redis environment variables not set. Caching will be disabled."
    );
  }
} catch (error) {
  logger.error("Failed to initialize Redis client", error as Error);
  redis = null;
}

/**
 * Get Redis client instance
 * Returns null if Redis is not configured (graceful degradation)
 */
export function getRedis(): Redis | null {
  return redis;
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return redis !== null;
}

/**
 * Cache key prefixes for namespacing
 */
export const CACHE_KEYS = {
  membership: (userId: string, orgId: string) =>
    `membership:${userId}:${orgId}`,
  brandKit: (orgId: string) => `brandkit:${orgId}`,
  quota: (orgId: string, userId: string | null, period: string) =>
    `quota:${orgId}:${userId || "org"}:${period}`,
  rateLimit: (identifier: string, window: string) =>
    `ratelimit:${identifier}:${window}`,
} as const;


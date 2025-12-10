/**
 * Upstash Redis client for serverless caching
 * Works across all Vercel serverless function instances
 * 
 * Note: In dev mode, this module may be loaded multiple times across
 * different Next.js contexts (SSR, API routes, middleware, etc.)
 * 
 * IMPORTANT: This is SERVER-SIDE ONLY. Not exported from @mocah/shared main index.
 * Import directly from '@mocah/shared/redis' in server-side code only.
 */

import { Redis } from "@upstash/redis";
import { serverEnv } from "@mocah/config/env";
import { logger } from "./logger";


// Initialize Redis client (will be null if env vars not set)
let redis: Redis | null = null;

try {
  if (serverEnv.UPSTASH_REDIS_REST_URL && serverEnv.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: serverEnv.UPSTASH_REDIS_REST_URL,
      token: serverEnv.UPSTASH_REDIS_REST_TOKEN,
    });
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
  brandGuidePreference: (userId: string, orgId: string) =>
    `brandguide:${userId}:${orgId}`,
  quota: (orgId: string, userId: string | null, period: string) =>
    `quota:${orgId}:${userId || "org"}:${period}`,
  rateLimit: (identifier: string, window: string) =>
    `ratelimit:${identifier}:${window}`,
} as const;


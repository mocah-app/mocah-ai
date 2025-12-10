import { z } from "zod";
import { router } from "../index";
import { organizationProcedure } from "../middleware";
import { logger } from "@mocah/shared";
import { getRedis, isRedisAvailable, CACHE_KEYS } from "@mocah/shared/redis";

// TTL settings (in seconds for Redis)
const BRAND_GUIDE_PREFERENCE_TTL_SECONDS = 30 * 60; // 30 minutes (user preference)

/**
 * Get cached brand guide preference or null if not cached/expired
 * Returns true if brand guide should be included, false if excluded, null if not set
 */
async function getCachedBrandGuidePreference(
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
async function cacheBrandGuidePreference(
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

export const brandGuideRouter = router({
  /**
   * Get brand guide preference for active organization
   * Returns true if brand guide should be included, false if excluded
   * Defaults to true if not set (backward compatibility)
   */
  getPreference: organizationProcedure.query(async ({ ctx }) => {
    const userId = ctx.session!.user.id;
    const orgId = ctx.organizationId;

    // Check Redis cache first
    const cached = await getCachedBrandGuidePreference(userId, orgId);
    
    // Default to true if not set (backward compatibility - include brand guide by default)
    return cached ?? true;
  }),

  /**
   * Set brand guide preference for active organization
   */
  setPreference: organizationProcedure
    .input(
      z.object({
        includeBrandGuide: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id;
      const orgId = ctx.organizationId;

      // Cache the preference in Redis
      await cacheBrandGuidePreference(userId, orgId, input.includeBrandGuide);

      return { success: true, includeBrandGuide: input.includeBrandGuide };
    }),
});

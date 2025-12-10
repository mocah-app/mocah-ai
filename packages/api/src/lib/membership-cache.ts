/**
 * Membership cache utilities with Redis fallback to database
 * Provides fast membership checks with proper error handling
 */

import type { PrismaClient } from "@mocah/db";
import { logger } from "@mocah/shared/logger";
import {
  getCachedMembership,
  cacheMembership,
  invalidateMembershipCache,
} from "@mocah/shared/cache";

/**
 * Check if user is member of organization with caching
 * @returns true if user is a member, false otherwise
 */
export async function checkMembership(
  db: PrismaClient,
  userId: string,
  organizationId: string
): Promise<boolean> {
  try {
    // Try Redis cache first
    const cached = await getCachedMembership(userId, organizationId);
    if (cached !== null) {
      return cached;
    }

    // Check database
    const membership = await db.member.findFirst({
      where: {
        userId,
        organizationId,
      },
    });

    const isMember = !!membership;

    // Cache the result (fire and forget)
    cacheMembership(userId, organizationId, isMember).catch((error) => {
      logger.error("Failed to cache membership result", error as Error);
    });

    return isMember;
  } catch (error) {
    logger.error("Failed to check membership", {
      error: error as Error,
      userId,
      organizationId,
    });
    // On error, return false to be safe (deny access)
    return false;
  }
}

/**
 * Invalidate membership cache for a user-organization pair
 * Call this when membership changes (add/remove member)
 */
export async function invalidateMembership(
  userId: string,
  organizationId: string
): Promise<void> {
  try {
    await invalidateMembershipCache(userId, organizationId);
  } catch (error) {
    logger.error("Failed to invalidate membership cache", {
      error: error as Error,
      userId,
      organizationId,
    });
  }
}

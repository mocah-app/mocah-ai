import { NextRequest } from "next/server";
import { auth } from "@mocah/auth";
import {
  invalidateBrandKitCache,
  getCachedMembership,
  cacheMembership,
} from "../../template/generate/cache";
import { logger } from "@mocah/shared";
import prisma from "@mocah/db";

/**
 * API endpoint to invalidate server-side caches
 * Used after brand kit updates to ensure AI generation uses fresh brand data
 * Requires user to be a member of the organization
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Parse and validate request body
    let organizationId: string;
    try {
      const body = await req.json();
      organizationId = body.organizationId;

      if (!organizationId || typeof organizationId !== "string") {
        return new Response(
          JSON.stringify({
            error: "Invalid request: organizationId (string) is required",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Verify organization membership (check cache first)
    let isMember = await getCachedMembership(session.user.id, organizationId);

    if (isMember === null) {
      // Not in cache, query database
      const membership = await prisma.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId: session.user.id,
          },
        },
        select: {
          id: true,
        },
      });

      isMember = !!membership;
      // Cache the result for future requests
      await cacheMembership(session.user.id, organizationId, isMember);
    }

    if (!isMember) {
      logger.warn("Unauthorized cache invalidation attempt", {
        component: "api/cache/invalidate",
        action: "POST",
        userId: session.user.id,
        organizationId,
        reason: "not_a_member",
      });

      return new Response(
        JSON.stringify({
          error: "Forbidden: You are not a member of this organization",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Perform cache invalidation
    await invalidateBrandKitCache(organizationId);

    logger.info("Cache invalidated successfully", {
      component: "api/cache/invalidate",
      action: "POST",
      userId: session.user.id,
      organizationId,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error(
      "Failed to invalidate cache",
      {
        component: "api/cache/invalidate",
        action: "POST",
      },
      error instanceof Error ? error : new Error(String(error))
    );

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

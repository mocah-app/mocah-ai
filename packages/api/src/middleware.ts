import { TRPCError } from "@trpc/server";
import { protectedProcedure, t } from "./index";
import {
  checkUsageLimit,
  getActiveTrial,
  getPlanLimits,
  UsageLimitError
} from "./lib/usage-tracking";

/**
 * Middleware that requires an active organization to be set in the session
 * Use this for endpoints that need organization context
 */
export const requireActiveOrganization = t.middleware(({ ctx, next }) => {
  if (!ctx.activeOrganization) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "No active organization. Please select or create an organization first.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      // Type-safe organization context
      organizationId: ctx.activeOrganization.id,
      organization: ctx.activeOrganization,
    },
  });
});

/**
 * Middleware that verifies user has a specific role in the organization
 */
export const requireOrganizationRole = (allowedRoles: string[]) =>
  t.middleware(({ ctx, next }) => {
    if (!ctx.activeOrganization) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "No active organization",
      });
    }

    // Get user's role from the members array
    const member = ctx.activeOrganization.members.find(
      (m) => m.userId === ctx.session?.user.id
    );

    if (!member) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not a member of this organization",
      });
    }

    // Better Auth stores role as string, but can be parsed as array
    let userRoles: string[] = [];
    try {
      userRoles = JSON.parse(member.role);
    } catch {
      userRoles = [member.role];
    }

    const hasPermission = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Insufficient permissions for this action",
      });
    }

    return next({
      ctx: {
        ...ctx,
        organizationId: ctx.activeOrganization.id,
        organization: ctx.activeOrganization,
        userRoles,
      },
    });
  });

/**
 * Protected procedure that requires active organization
 * Use this for most organization-scoped endpoints
 */
export const organizationProcedure = protectedProcedure.use(requireActiveOrganization);

/**
 * Protected procedure that requires admin role
 * Use this for admin-only actions like deleting organization
 */
export const adminProcedure = protectedProcedure.use(
  requireOrganizationRole(["owner", "admin"])
);

// ============================================================================
// Usage Quota Middleware
// ============================================================================

/**
 * Middleware that requires template generation quota
 * Use this for template generation endpoints
 */
export const requireTemplateGenerationQuota = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  const userId = ctx.session.user.id;
  const usageCheck = await checkUsageLimit(userId, "templateGeneration");

  if (!usageCheck.allowed) {
    const trial = await getActiveTrial(userId);
    throw new UsageLimitError({
      code: trial ? "TRIAL_LIMIT_REACHED" : "QUOTA_EXCEEDED",
      remaining: usageCheck.remaining,
      limit: usageCheck.limit,
      resetDate: usageCheck.resetDate,
    });
  }

  const planLimits = await getPlanLimits(userId);

  return next({
    ctx: {
      ...ctx,
      usageCheck,
      planLimits,
    },
  });
});

/**
 * Middleware that requires image generation quota
 * Use this for image generation endpoints
 */
export const requireImageGenerationQuota = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  const userId = ctx.session.user.id;
  const usageCheck = await checkUsageLimit(userId, "imageGeneration");

  if (!usageCheck.allowed) {
    const trial = await getActiveTrial(userId);
    throw new UsageLimitError({
      code: trial ? "TRIAL_LIMIT_REACHED" : "QUOTA_EXCEEDED",
      remaining: usageCheck.remaining,
      limit: usageCheck.limit,
      resetDate: usageCheck.resetDate,
    });
  }

  const planLimits = await getPlanLimits(userId);

  return next({
    ctx: {
      ...ctx,
      usageCheck,
      planLimits,
    },
  });
});

/**
 * Middleware that blocks certain actions during trial
 * Use this for features that should be restricted during trial (e.g., template deletion)
 */
export const requireTrialNotActive = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  const userId = ctx.session.user.id;
  const trial = await getActiveTrial(userId);

  if (trial && trial.status === "active") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "This action is not available during your trial. Upgrade to unlock full access.",
      cause: {
        trialRestriction: true,
        upgradeUrl: "/pricing",
      },
    });
  }

  return next({ ctx });
});

/**
 * Protected procedure with template generation quota check
 */
export const templateQuotaProcedure = protectedProcedure.use(
  requireTemplateGenerationQuota
);

/**
 * Protected procedure with image generation quota check
 */
export const imageQuotaProcedure = protectedProcedure.use(
  requireImageGenerationQuota
);

/**
 * Protected procedure that requires user NOT be in trial
 * Use for actions blocked during trial (e.g., deleting templates)
 */
export const paidUserProcedure = protectedProcedure.use(requireTrialNotActive);

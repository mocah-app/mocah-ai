import { TRPCError } from "@trpc/server";
import { t, protectedProcedure } from "./index";

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

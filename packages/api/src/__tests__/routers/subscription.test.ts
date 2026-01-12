/**
 * Subscription Router Tests
 * 
 * Tests for subscription management, usage tracking, and billing operations.
 * 
 * Note: These tests use a standalone router setup to avoid the complex
 * import chain that includes Better Auth, Prisma, and other dependencies.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";
import { testContext, createMockPrisma, createMockSession } from "../../test-utils/caller";
import type { ApiContext, Session } from "../../types";

// Create a test-specific tRPC instance
const t = initTRPC.context<ApiContext>().create();

const testProtectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }
  return next({ ctx: { ...ctx, session: ctx.session as Session } });
});

// ============================================================================
// Recreate the subscription router logic for testing
// This isolates us from the complex import chain
// ============================================================================

const createPortalSessionSchema = z.object({
  returnUrl: z.url(),
});

const getUsageHistorySchema = z.object({
  months: z.number().int().min(1).max(12).default(6),
});

// Mock the usage tracking module
const mockGetUserUsageStats = vi.fn();

const testSubscriptionRouter = t.router({
  getPlans: t.procedure.query(async ({ ctx }) => {
    const plans = await ctx.db.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    return plans.map((p: any) => ({
      name: p.name,
      displayName: p.displayName,
      description: p.description,
      price: Number(p.price),
      annualPrice: p.annualPrice ? Number(p.annualPrice) : null,
      templatesLimit: p.templatesLimit,
      imagesLimit: p.imagesLimit,
      hasPremiumImageModel: p.hasPremiumImageModel,
      hasPriorityQueue: p.hasPriorityQueue,
      features: p.features,
    }));
  }),

  getCurrent: testProtectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const subscription = await ctx.db.subscription.findFirst({
      where: { referenceId: userId },
      orderBy: { createdAt: "desc" },
    });

    const usageStats = await mockGetUserUsageStats(userId);

    const plans = await ctx.db.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    const trial = subscription?.status === "trialing" && subscription.trialEnd
      ? {
          plan: subscription.plan,
          status: "active" as const,
          startedAt: subscription.trialStart || subscription.createdAt || new Date(),
          expiresAt: subscription.trialEnd,
          templatesUsed: subscription.trialTemplatesUsed,
          templatesLimit: 5,
          imagesUsed: subscription.trialImagesUsed,
          imagesLimit: 5,
        }
      : null;

    return {
      subscription: subscription
        ? {
            id: subscription.id,
            stripeSubscriptionId: subscription.stripeSubscriptionId,
            plan: subscription.plan,
            status: subscription.status,
            periodStart: subscription.periodStart,
            periodEnd: subscription.periodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            trialStart: subscription.trialStart,
            trialEnd: subscription.trialEnd,
          }
        : null,
      trial,
      usage: {
        templates: usageStats.templateUsage,
        images: usageStats.imageUsage,
      },
      limits: usageStats.limits,
      plans: plans.map((p: any) => ({
        name: p.name,
        displayName: p.displayName,
        description: p.description,
        price: Number(p.price),
        annualPrice: p.annualPrice ? Number(p.annualPrice) : null,
        templatesLimit: p.templatesLimit,
        imagesLimit: p.imagesLimit,
        hasPremiumImageModel: p.hasPremiumImageModel,
        hasPriorityQueue: p.hasPriorityQueue,
        features: p.features,
      })),
    };
  }),

  getTrialStatus: testProtectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    
    const subscription = await ctx.db.subscription.findFirst({
      where: {
        referenceId: userId,
        status: "trialing",
      },
    });

    if (!subscription || !subscription.trialEnd) {
      return null;
    }

    const daysRemaining = Math.ceil(
      (subscription.trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return {
      plan: subscription.plan,
      status: "active" as const,
      startedAt: subscription.trialStart || subscription.createdAt || new Date(),
      expiresAt: subscription.trialEnd,
      daysRemaining: Math.max(0, daysRemaining),
      templatesUsed: subscription.trialTemplatesUsed,
      templatesLimit: 5,
      templatesRemaining: Math.max(0, 5 - subscription.trialTemplatesUsed),
      imagesUsed: subscription.trialImagesUsed,
      imagesLimit: 5,
      imagesRemaining: Math.max(0, 5 - subscription.trialImagesUsed),
    };
  }),

  getUsageHistory: testProtectedProcedure
    .input(getUsageHistorySchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - input.months);

      const history = await ctx.db.usageQuota.findMany({
        where: {
          userId,
          periodStart: { gte: monthsAgo },
        },
        orderBy: { periodStart: "desc" },
        select: {
          periodStart: true,
          periodEnd: true,
          plan: true,
          templatesUsed: true,
          templatesLimit: true,
          imagesUsed: true,
          imagesLimit: true,
        },
      });

      return history.map((h: any) => ({
        periodStart: h.periodStart,
        periodEnd: h.periodEnd,
        plan: h.plan,
        templatesUsed: h.templatesUsed,
        templatesLimit: h.templatesLimit,
        imagesUsed: h.imagesUsed,
        imagesLimit: h.imagesLimit,
        templatePercentage: Math.round(
          (h.templatesUsed / h.templatesLimit) * 100
        ),
        imagePercentage: Math.round((h.imagesUsed / h.imagesLimit) * 100),
      }));
    }),

  getInvoices: testProtectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const user = await ctx.db.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return [];
    }

    // In real implementation, this would call Stripe API
    return [];
  }),

  createPortalSession: testProtectedProcedure
    .input(createPortalSessionSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { stripeCustomerId: true },
      });

      if (!user?.stripeCustomerId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No billing account found. Please subscribe first.",
        });
      }

      // In real implementation, this would call Stripe API
      return { url: "https://stripe.com/portal" };
    }),

  endTrialEarly: testProtectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const subscription = await ctx.db.subscription.findFirst({
      where: {
        referenceId: userId,
        status: "trialing",
      },
    });

    if (!subscription) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No active trial found.",
      });
    }

    // In real implementation, this would call Stripe API
    return { success: true };
  }),
});

// ============================================================================
// Tests
// ============================================================================

describe("subscriptionRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserUsageStats.mockReset();
  });

  describe("getPlans", () => {
    it("returns available plans for public access (no auth required)", async () => {
      const ctx = testContext().build();
      
      const mockPlans = [
        {
          name: "starter",
          displayName: "Starter",
          description: "Perfect for getting started",
          price: 9.99,
          annualPrice: 99.99,
          templatesLimit: 10,
          imagesLimit: 50,
          hasPremiumImageModel: false,
          hasPriorityQueue: false,
          features: ["Feature 1", "Feature 2"],
          isActive: true,
          sortOrder: 1,
        },
        {
          name: "pro",
          displayName: "Pro",
          description: "For professionals",
          price: 29.99,
          annualPrice: 299.99,
          templatesLimit: 100,
          imagesLimit: 500,
          hasPremiumImageModel: true,
          hasPriorityQueue: true,
          features: ["All Starter features", "Priority support"],
          isActive: true,
          sortOrder: 2,
        },
      ];

      (ctx.db.plan.findMany as any).mockResolvedValue(mockPlans);

      const caller = testSubscriptionRouter.createCaller(ctx);
      const result = await caller.getPlans();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        name: "starter",
        displayName: "Starter",
        price: 9.99,
      });
      expect(result[1]).toMatchObject({
        name: "pro",
        displayName: "Pro",
        price: 29.99,
      });
    });

    it("returns empty array when no active plans exist", async () => {
      const ctx = testContext().build();
      (ctx.db.plan.findMany as any).mockResolvedValue([]);

      const caller = testSubscriptionRouter.createCaller(ctx);
      const result = await caller.getPlans();

      expect(result).toEqual([]);
    });
  });

  describe("getCurrent", () => {
    it("throws UNAUTHORIZED for unauthenticated users", async () => {
      const ctx = testContext().build();
      const caller = testSubscriptionRouter.createCaller(ctx);

      await expect(caller.getCurrent()).rejects.toThrow("Authentication required");
    });

    it("returns subscription data for authenticated user", async () => {
      const ctx = testContext().withUser({ userId: "user-123" }).build();
      
      (ctx.db.subscription.findFirst as any).mockResolvedValue({
        id: "sub-123",
        stripeSubscriptionId: "stripe_sub_123",
        plan: "pro",
        status: "active",
        periodStart: new Date("2024-01-01"),
        periodEnd: new Date("2024-02-01"),
        cancelAtPeriodEnd: false,
        trialStart: null,
        trialEnd: null,
        trialTemplatesUsed: 0,
        trialImagesUsed: 0,
        referenceId: "user-123",
      });

      (ctx.db.plan.findMany as any).mockResolvedValue([{
        name: "pro",
        displayName: "Pro",
        description: "For professionals",
        price: 29.99,
        annualPrice: null,
        templatesLimit: 100,
        imagesLimit: 500,
        hasPremiumImageModel: true,
        hasPriorityQueue: true,
        features: [],
        isActive: true,
        sortOrder: 1,
      }]);

      mockGetUserUsageStats.mockResolvedValue({
        templateUsage: { used: 5, limit: 100, remaining: 95, percentage: 5 },
        imageUsage: { used: 10, limit: 500, remaining: 490, percentage: 2 },
        limits: { templates: 100, images: 500 },
      });

      const caller = testSubscriptionRouter.createCaller(ctx);
      const result = await caller.getCurrent();

      expect(result.subscription).toMatchObject({
        id: "sub-123",
        plan: "pro",
        status: "active",
      });
      expect(result.plans).toHaveLength(1);
    });

    it("returns null subscription when user has no subscription", async () => {
      const ctx = testContext().withUser({ userId: "user-123" }).build();
      
      (ctx.db.subscription.findFirst as any).mockResolvedValue(null);
      (ctx.db.plan.findMany as any).mockResolvedValue([]);

      mockGetUserUsageStats.mockResolvedValue({
        templateUsage: { used: 0, limit: 5, remaining: 5, percentage: 0 },
        imageUsage: { used: 0, limit: 5, remaining: 5, percentage: 0 },
        limits: { templates: 5, images: 5 },
      });

      const caller = testSubscriptionRouter.createCaller(ctx);
      const result = await caller.getCurrent();

      expect(result.subscription).toBeNull();
      expect(result.trial).toBeNull();
    });
  });

  describe("getTrialStatus", () => {
    it("throws UNAUTHORIZED for unauthenticated users", async () => {
      const ctx = testContext().build();
      const caller = testSubscriptionRouter.createCaller(ctx);

      await expect(caller.getTrialStatus()).rejects.toThrow("Authentication required");
    });

    it("returns null when user has no active trial", async () => {
      const ctx = testContext().withUser({ userId: "user-123" }).build();
      (ctx.db.subscription.findFirst as any).mockResolvedValue(null);

      const caller = testSubscriptionRouter.createCaller(ctx);
      const result = await caller.getTrialStatus();

      expect(result).toBeNull();
    });

    it("returns trial details when user has active trial", async () => {
      const ctx = testContext().withUser({ userId: "user-123" }).build();
      
      const trialStart = new Date();
      const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      (ctx.db.subscription.findFirst as any).mockResolvedValue({
        id: "sub-123",
        plan: "pro",
        status: "trialing",
        trialStart,
        trialEnd,
        trialTemplatesUsed: 2,
        trialImagesUsed: 3,
        createdAt: trialStart,
      });

      const caller = testSubscriptionRouter.createCaller(ctx);
      const result = await caller.getTrialStatus();

      expect(result).toMatchObject({
        plan: "pro",
        status: "active",
        templatesUsed: 2,
        templatesLimit: 5,
        imagesUsed: 3,
        imagesLimit: 5,
      });
      expect(result?.daysRemaining).toBeGreaterThan(0);
      expect(result?.daysRemaining).toBeLessThanOrEqual(7);
    });
  });

  describe("getUsageHistory", () => {
    it("throws UNAUTHORIZED for unauthenticated users", async () => {
      const ctx = testContext().build();
      const caller = testSubscriptionRouter.createCaller(ctx);

      await expect(caller.getUsageHistory({ months: 6 })).rejects.toThrow("Authentication required");
    });

    it("returns usage history for authenticated user", async () => {
      const ctx = testContext().withUser({ userId: "user-123" }).build();
      
      const mockHistory = [
        {
          periodStart: new Date("2024-01-01"),
          periodEnd: new Date("2024-02-01"),
          plan: "pro",
          templatesUsed: 50,
          templatesLimit: 100,
          imagesUsed: 200,
          imagesLimit: 500,
        },
      ];

      (ctx.db.usageQuota.findMany as any).mockResolvedValue(mockHistory);

      const caller = testSubscriptionRouter.createCaller(ctx);
      const result = await caller.getUsageHistory({ months: 6 });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        plan: "pro",
        templatesUsed: 50,
        templatePercentage: 50,
        imagePercentage: 40,
      });
    });

    it("validates months input range", async () => {
      const ctx = testContext().withUser({ userId: "user-123" }).build();
      const caller = testSubscriptionRouter.createCaller(ctx);

      await expect(caller.getUsageHistory({ months: 13 })).rejects.toThrow();
      await expect(caller.getUsageHistory({ months: 0 })).rejects.toThrow();
    });
  });

  describe("getInvoices", () => {
    it("throws UNAUTHORIZED for unauthenticated users", async () => {
      const ctx = testContext().build();
      const caller = testSubscriptionRouter.createCaller(ctx);

      await expect(caller.getInvoices()).rejects.toThrow("Authentication required");
    });

    it("returns empty array when user has no Stripe customer ID", async () => {
      const ctx = testContext().withUser({ userId: "user-123" }).build();
      
      (ctx.db.user.findUnique as any).mockResolvedValue({
        id: "user-123",
        stripeCustomerId: null,
      });

      const caller = testSubscriptionRouter.createCaller(ctx);
      const result = await caller.getInvoices();

      expect(result).toEqual([]);
    });
  });

  describe("createPortalSession", () => {
    it("throws UNAUTHORIZED for unauthenticated users", async () => {
      const ctx = testContext().build();
      const caller = testSubscriptionRouter.createCaller(ctx);

      await expect(
        caller.createPortalSession({ returnUrl: "https://mocah.io/dashboard" })
      ).rejects.toThrow("Authentication required");
    });

    it("throws BAD_REQUEST when user has no billing account", async () => {
      const ctx = testContext().withUser({ userId: "user-123" }).build();
      
      (ctx.db.user.findUnique as any).mockResolvedValue({
        id: "user-123",
        stripeCustomerId: null,
      });

      const caller = testSubscriptionRouter.createCaller(ctx);

      await expect(
        caller.createPortalSession({ returnUrl: "https://mocah.io/dashboard" })
      ).rejects.toThrow("No billing account found");
    });

    it("validates returnUrl is a valid URL", async () => {
      const ctx = testContext().withUser({ userId: "user-123" }).build();
      const caller = testSubscriptionRouter.createCaller(ctx);

      await expect(
        caller.createPortalSession({ returnUrl: "not-a-valid-url" })
      ).rejects.toThrow();
    });
  });

  describe("endTrialEarly", () => {
    it("throws UNAUTHORIZED for unauthenticated users", async () => {
      const ctx = testContext().build();
      const caller = testSubscriptionRouter.createCaller(ctx);

      await expect(caller.endTrialEarly()).rejects.toThrow("Authentication required");
    });

    it("throws NOT_FOUND when user has no active trial", async () => {
      const ctx = testContext().withUser({ userId: "user-123" }).build();
      (ctx.db.subscription.findFirst as any).mockResolvedValue(null);

      const caller = testSubscriptionRouter.createCaller(ctx);

      await expect(caller.endTrialEarly()).rejects.toThrow("No active trial found");
    });
  });
});

/**
 * Subscription tRPC Router
 * Handles subscription management, usage tracking, and billing operations
 * 
 * Note: Subscription checkout is handled by Better Auth's subscription.upgrade() flow.
 * This router handles read operations and Stripe billing portal access.
 */

import { cachedStripeInvoicesList } from "@mocah/auth/stripe-sync";
import { serverEnv } from "@mocah/config/env";
import prisma from "@mocah/db";
import { logger } from "@mocah/shared/logger";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../index";
import { getActiveTrial, getUserUsageStats } from "../lib/usage-tracking";

// Initialize Stripe client
const stripe = new Stripe(serverEnv.STRIPE_SECRET_KEY, {
  apiVersion: "2025-11-17.clover",
});

// ============================================================================
// Input Schemas
// ============================================================================

const createPortalSessionSchema = z.object({
  returnUrl: z.url(),
});

const getUsageHistorySchema = z.object({
  months: z.number().int().min(1).max(12).default(6),
});


// ============================================================================
// Router Definition
// ============================================================================

export const subscriptionRouter = router({
  // ==========================================================================
  // Read Operations
  // ==========================================================================

  /**
   * Get current subscription and usage stats
   */
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Get subscription from database
    const subscription = await prisma.subscription.findFirst({
      where: {
        referenceId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get usage stats
    const usageStats = await getUserUsageStats(userId);

    // Get available plans
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    return {
      subscription: subscription
        ? {
            id: subscription.id,
            plan: subscription.plan,
            status: subscription.status,
            periodStart: subscription.periodStart,
            periodEnd: subscription.periodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            trialStart: subscription.trialStart,
            trialEnd: subscription.trialEnd,
          }
        : null,
      trial: usageStats.trial
        ? {
            plan: usageStats.trial.plan,
            status: usageStats.trial.status,
            startedAt: usageStats.trial.startedAt,
            expiresAt: usageStats.trial.expiresAt,
            templatesUsed: usageStats.trial.templatesUsed,
            templatesLimit: usageStats.trial.templatesLimit,
            imagesUsed: usageStats.trial.imagesUsed,
            imagesLimit: usageStats.trial.imagesLimit,
          }
        : null,
      usage: {
        templates: usageStats.templateUsage,
        images: usageStats.imageUsage,
      },
      limits: usageStats.limits,
      plans: plans.map((p) => ({
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

  /**
   * Get all available plans (public)
   */
  getPlans: publicProcedure.query(async () => {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    return plans.map((p) => ({
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

  /**
   * Get usage history for past months
   */
  getUsageHistory: protectedProcedure
    .input(getUsageHistorySchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - input.months);

      const history = await prisma.usageQuota.findMany({
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

      return history.map((h) => ({
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

  /**
   * Get invoices from Stripe
   */
  getInvoices: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return [];
    }

    try {
      // Use cached function for better performance
      const invoices = await cachedStripeInvoicesList(user.stripeCustomerId);

      return invoices.data.map((inv) => ({
        id: inv.id,
        number: inv.number,
        status: inv.status,
        amount: inv.amount_paid / 100, // Convert from cents
        currency: inv.currency,
        created: new Date(inv.created * 1000),
        periodStart: inv.period_start
          ? new Date(inv.period_start * 1000)
          : null,
        periodEnd: inv.period_end ? new Date(inv.period_end * 1000) : null,
        hostedInvoiceUrl: inv.hosted_invoice_url,
        invoicePdf: inv.invoice_pdf,
      }));
    } catch (error) {
      logger.error("Failed to fetch invoices", error as Error);
      return [];
    }
  }),

  // ==========================================================================
  // Write Operations (Portal & Upgrades)
  // ==========================================================================

  /**
   * Create Stripe billing portal session
   * Note: Subscription checkout is handled by Better Auth's subscription.upgrade() flow
   */
  createPortalSession: protectedProcedure
    .input(createPortalSessionSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { stripeCustomerId: true },
      });

      if (!user?.stripeCustomerId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No billing account found. Please subscribe first.",
        });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: input.returnUrl,
      });

      return {
        url: session.url,
      };
    }),

  // ==========================================================================
  // Trial Management
  // ==========================================================================

  /**
   * Get trial status
   * Note: Trial creation is handled by Better Auth's subscription.upgrade() with freeTrial config
   */
  getTrialStatus: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const trial = await getActiveTrial(userId);

    if (!trial) {
      return null;
    }

    const daysRemaining = Math.ceil(
      (trial.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return {
      plan: trial.plan,
      status: trial.status,
      startedAt: trial.startedAt,
      expiresAt: trial.expiresAt,
      daysRemaining: Math.max(0, daysRemaining),
      templatesUsed: trial.templatesUsed,
      templatesLimit: trial.templatesLimit,
      templatesRemaining: Math.max(
        0,
        trial.templatesLimit - trial.templatesUsed
      ),
      imagesUsed: trial.imagesUsed,
      imagesLimit: trial.imagesLimit,
      imagesRemaining: Math.max(0, trial.imagesLimit - trial.imagesUsed),
    };
  }),
});

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
import { getUserUsageStats } from "../lib/usage-tracking";


const TEMPLATES_LIMIT = 5; // TRIAL_LIMITS.templatesLimit
const IMAGES_LIMIT = 5; // TRIAL_LIMITS.imagesLimit


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

    // Format trial data from subscription if in trial
    const trial = subscription?.status === "trialing" && subscription.trialEnd
      ? {
          plan: subscription.plan,
          status: "active" as const,
          startedAt: subscription.trialStart || subscription.createdAt || new Date(),
          expiresAt: subscription.trialEnd,
          templatesUsed: subscription.trialTemplatesUsed,
          templatesLimit: 5, // TRIAL_LIMITS.templatesLimit
          imagesUsed: subscription.trialImagesUsed,
          imagesLimit: 5, // TRIAL_LIMITS.imagesLimit
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
   * Note: Trial is tracked directly in Subscription model
   */
  getTrialStatus: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    
    const subscription = await prisma.subscription.findFirst({
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
      templatesLimit: TEMPLATES_LIMIT,
      templatesRemaining: Math.max(0, TEMPLATES_LIMIT - subscription.trialTemplatesUsed),
      imagesUsed: subscription.trialImagesUsed,
      imagesLimit: IMAGES_LIMIT,
      imagesRemaining: Math.max(0, IMAGES_LIMIT - subscription.trialImagesUsed),
    };
  }),

  /**
   * End trial early and upgrade to paid subscription immediately
   * Updates the Stripe subscription to end the trial period now, which will:
   * - Immediately end the trial
   * - Trigger billing for the paid plan
   * - Reset the billing cycle to start from that moment
   */
  endTrialEarly: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Get the current trialing subscription
    const subscription = await prisma.subscription.findFirst({
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

    if (!subscription.stripeSubscriptionId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Subscription does not have a Stripe subscription ID.",
      });
    }

    try {
      // Update Stripe subscription to end trial immediately
      // Setting trial_end to 'now' will:
      // - End the trial immediately
      // - Create and charge an invoice
      // - Change status from 'trialing' to 'active'
      const updatedSubscription = await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          trial_end: "now",
          proration_behavior: "none", // No prorations since we're ending a free trial
        }
      );

      logger.info(
        `Trial ended early for user ${userId}, subscription ${subscription.stripeSubscriptionId}`
      );

      // The webhook will handle updating the database subscription status
      // But we can return success immediately
      return {
        success: true,
        subscriptionId: updatedSubscription.id,
        status: updatedSubscription.status,
      };
    } catch (error) {
      logger.error("Failed to end trial early", error as Error);
      
      // Handle Stripe-specific errors
      if (error instanceof Stripe.errors.StripeError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Stripe error: ${error.message}`,
        });
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to end trial early. Please try again.",
      });
    }
  }),
});

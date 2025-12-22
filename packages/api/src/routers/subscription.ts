/**
 * Subscription tRPC Router
 * Handles subscription management, usage tracking, and billing operations
 */

import { TRIAL_LIMITS } from "@mocah/auth/subscription-plans";
import {
  cachedStripeInvoicesList,
  setUserCustomerMapping,
} from "@mocah/auth/stripe-sync";
import { serverEnv } from "@mocah/config/env";
import prisma from "@mocah/db";
import { logger } from "@mocah/shared/logger";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../index";
import {
  clearUserCache,
  convertTrial,
  createTrial,
  getActiveTrial,
  getUserUsageStats,
  type PlanName,
} from "../lib/usage-tracking";

// Initialize Stripe client
const stripe = new Stripe(serverEnv.STRIPE_SECRET_KEY, {
  apiVersion: "2025-11-17.clover",
});

// ============================================================================
// Input Schemas
// ============================================================================

const createCheckoutSessionSchema = z.object({
  planName: z.enum(["starter", "pro", "scale"]),
  interval: z.enum(["month", "year"]).default("month"),
  successUrl: z.url(),
  cancelUrl: z.url(),
});

const createPortalSessionSchema = z.object({
  returnUrl: z.url(),
});

const getUsageHistorySchema = z.object({
  months: z.number().int().min(1).max(12).default(6),
});

const cancelSubscriptionSchema = z.object({
  reason: z.string().optional(),
  feedback: z.string().optional(),
  cancelImmediately: z.boolean().default(false),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get or create Stripe customer for a user
 */
async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name: string
): Promise<string> {
  // Check if user already has a Stripe customer ID
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (user?.stripeCustomerId) {
    // Ensure bidirectional mapping exists (might be missing in old accounts)
    await setUserCustomerMapping(userId, user.stripeCustomerId);
    return user.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      userId,
    },
  });

  // Save customer ID to user record
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  // Store bidirectional mapping for fast lookups
  await setUserCustomerMapping(userId, customer.id);

  return customer.id;
}

/**
 * Get Stripe price ID for a plan and interval
 */
function getStripePriceId(
  planName: PlanName,
  interval: "month" | "year"
): string {
  const priceIds: Record<PlanName, { month: string; year: string }> = {
    starter: {
      month: serverEnv.STRIPE_PRICE_ID_STARTER_MONTHLY || "",
      year: serverEnv.STRIPE_PRICE_ID_STARTER_ANNUAL || "",
    },
    pro: {
      month: serverEnv.STRIPE_PRICE_ID_PRO_MONTHLY || "",
      year: serverEnv.STRIPE_PRICE_ID_PRO_ANNUAL || "",
    },
    scale: {
      month: serverEnv.STRIPE_PRICE_ID_SCALE_MONTHLY || "",
      year: serverEnv.STRIPE_PRICE_ID_SCALE_ANNUAL || "",
    },
  };

  const priceId = priceIds[planName][interval];
  if (!priceId) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Price ID not configured for ${planName} (${interval})`,
    });
  }

  return priceId;
}

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
  // Write Operations (Checkout & Portal)
  // ==========================================================================

  /**
   * Create Stripe checkout session for subscription
   */
  createCheckoutSession: protectedProcedure
    .input(createCheckoutSessionSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const user = ctx.session.user;

      // Get or create Stripe customer
      const customerId = await getOrCreateStripeCustomer(
        userId,
        user.email,
        user.name || user.email
      );

      // Get price ID
      const priceId = getStripePriceId(input.planName, input.interval);

      // Create checkout session with trial
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        subscription_data: {
          trial_period_days: TRIAL_LIMITS.durationDays,
          trial_settings: {
            end_behavior: {
              missing_payment_method: "cancel",
            },
          },
          metadata: {
            userId,
            planName: input.planName,
          },
        },
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        metadata: {
          userId,
          planName: input.planName,
        },
      });

      return {
        url: session.url,
        sessionId: session.id,
      };
    }),

  /**
   * Create Stripe billing portal session
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

  /**
   * Upgrade immediately during trial (charge now, end trial)
   */
  upgradeImmediately: protectedProcedure
    .input(z.object({ planName: z.enum(["starter", "pro", "scale"]) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const user = ctx.session.user;

      // Get active trial
      const trial = await getActiveTrial(userId);
      if (!trial) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No active trial found",
        });
      }

      // Get or create customer
      const customerId = await getOrCreateStripeCustomer(
        userId,
        user.email,
        user.name || user.email
      );

      // Get price ID
      const priceId = getStripePriceId(input.planName, "month");

      // Create subscription with immediate charge (trial_end: 'now')
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        trial_end: "now", // Charges immediately
        metadata: {
          userId,
          planName: input.planName,
          upgradedFromTrial: "true",
        },
      });

      // Convert trial in database
      await convertTrial(userId);

      // Clear user cache to refresh limits
      await clearUserCache(userId);

      logger.info("Trial upgraded immediately", {
        userId,
        planName: input.planName,
        subscriptionId: subscription.id,
      });

      return {
        success: true,
        subscriptionId: subscription.id,
      };
    }),

  /**
   * Cancel subscription
   */
  cancelSubscription: protectedProcedure
    .input(cancelSubscriptionSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Get subscription
      const subscription = await prisma.subscription.findFirst({
        where: {
          referenceId: userId,
          status: { in: ["active", "trialing"] },
        },
      });

      if (!subscription?.stripeSubscriptionId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No active subscription found",
        });
      }

      // Save cancellation feedback
      if (input.reason || input.feedback) {
        await prisma.cancellationFeedback.create({
          data: {
            userId,
            subscriptionId: subscription.id,
            reason: input.reason,
            feedback: input.feedback,
          },
        });
      }

      // Cancel in Stripe
      if (input.cancelImmediately) {
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      } else {
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      }

      // Clear cache
      await clearUserCache(userId);

      logger.info("Subscription cancelled", {
        userId,
        subscriptionId: subscription.id,
        immediate: input.cancelImmediately,
      });

      return {
        success: true,
        cancelAtPeriodEnd: !input.cancelImmediately,
      };
    }),

  // ==========================================================================
  // Trial Management
  // ==========================================================================

  /**
   * Start a trial for a specific plan
   * Note: This is typically called after successful Stripe checkout
   */
  startTrial: protectedProcedure
    .input(z.object({ plan: z.enum(["starter", "pro", "scale"]) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const user = ctx.session.user;

      // Check if user already has a trial
      const existingTrial = await getActiveTrial(userId);
      if (existingTrial) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already have an active trial",
        });
      }

      // Get or create Stripe customer
      const customerId = await getOrCreateStripeCustomer(
        userId,
        user.email,
        user.name || user.email
      );

      // Create trial
      const trial = await createTrial(
        userId,
        user.email,
        input.plan,
        customerId
      );

      return {
        success: true,
        trial: {
          plan: trial.plan,
          startedAt: trial.startedAt,
          expiresAt: trial.expiresAt,
          templatesLimit: trial.templatesLimit,
          imagesLimit: trial.imagesLimit,
        },
      };
    }),

  /**
   * Get trial status
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

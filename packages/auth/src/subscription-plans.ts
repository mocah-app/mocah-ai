// subscription-plans.ts
// Subscription plan configuration for Better Auth Stripe plugin

import { serverEnv } from "@mocah/config/env";

/**
 * Plan limits configuration
 * These match the pricing structure in week4-payment-new-plan.md
 */
export const PLAN_LIMITS = {
  starter: {
    templatesLimit: 75,
    imagesLimit: 20,
    hasPremiumImageModel: false,
    hasPriorityQueue: false,
  },
  pro: {
    templatesLimit: 200,
    imagesLimit: 100,
    hasPremiumImageModel: true,
    hasPriorityQueue: true,
  },
  scale: {
    templatesLimit: 500,
    imagesLimit: 300,
    hasPremiumImageModel: true,
    hasPriorityQueue: true,
  },
} as const;

/**
 * Trial limits (same for all plans)
 */
export const TRIAL_LIMITS = {
  templatesLimit: 5,
  imagesLimit: 5,
  durationDays: 7,
  hasPremiumImageModel: false, // No premium images during trial
} as const;

export type PlanName = keyof typeof PLAN_LIMITS;

/**
 * Price ID to Plan Name mapping
 * Used to reliably determine plan from Stripe price ID in webhooks
 */
export function getPlanNameFromPriceId(priceId: string): PlanName | undefined {
  const priceIdToPlan: Record<string, PlanName> = {
    // Monthly prices
    [serverEnv.STRIPE_PRICE_ID_STARTER_MONTHLY || ""]: "starter",
    [serverEnv.STRIPE_PRICE_ID_PRO_MONTHLY || ""]: "pro",
    [serverEnv.STRIPE_PRICE_ID_SCALE_MONTHLY || ""]: "scale",
    // Annual prices
    [serverEnv.STRIPE_PRICE_ID_STARTER_ANNUAL || ""]: "starter",
    [serverEnv.STRIPE_PRICE_ID_PRO_ANNUAL || ""]: "pro",
    [serverEnv.STRIPE_PRICE_ID_SCALE_ANNUAL || ""]: "scale",
  };

  return priceIdToPlan[priceId];
}

/**
 * Subscription plans for Better Auth Stripe plugin
 * 
 * Note: Trial record creation is handled in the webhook handler (packages/auth/src/index.ts)
 * when the `customer.subscription.created` event is received with status "trialing".
 * Better Auth's `onTrialStart` callback wasn't triggering reliably.
 */
export const subscriptionPlans = [
  {
    name: "starter",
    priceId: serverEnv.STRIPE_PRICE_ID_STARTER_MONTHLY || "",
    annualDiscountPriceId: serverEnv.STRIPE_PRICE_ID_STARTER_ANNUAL || "",
    limits: {
      templateGenerations: PLAN_LIMITS.starter.templatesLimit,
      imageGenerations: PLAN_LIMITS.starter.imagesLimit,
      workspaces: -1, // Unlimited
    },
    freeTrial: {
      days: TRIAL_LIMITS.durationDays,
    },
  },
  {
    name: "pro",
    priceId: serverEnv.STRIPE_PRICE_ID_PRO_MONTHLY || "",
    annualDiscountPriceId: serverEnv.STRIPE_PRICE_ID_PRO_ANNUAL || "",
    limits: {
      templateGenerations: PLAN_LIMITS.pro.templatesLimit,
      imageGenerations: PLAN_LIMITS.pro.imagesLimit,
      workspaces: -1, // Unlimited
    },
    freeTrial: {
      days: TRIAL_LIMITS.durationDays,
    },
  },
  {
    name: "scale",
    priceId: serverEnv.STRIPE_PRICE_ID_SCALE_MONTHLY || "",
    annualDiscountPriceId: serverEnv.STRIPE_PRICE_ID_SCALE_ANNUAL || "",
    limits: {
      templateGenerations: PLAN_LIMITS.scale.templatesLimit,
      imageGenerations: PLAN_LIMITS.scale.imagesLimit,
      workspaces: -1, // Unlimited
    },
    freeTrial: {
      days: TRIAL_LIMITS.durationDays,
    },
  },
];

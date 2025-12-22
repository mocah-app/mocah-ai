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

/**
 * Subscription plans for Better Auth Stripe plugin
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

export type PlanName = keyof typeof PLAN_LIMITS;

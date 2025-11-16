// subscription-plans.ts
// Subscription plan configuration for Better Auth Stripe plugin

export const subscriptionPlans = [
  {
    name: "free",
    priceId: process.env.STRIPE_PRICE_ID_FREE || "",
    limits: {
      textGenerations: 5,
      imageGenerations: 3,
      workspaces: 1,
    },
  },
  {
    name: "starter",
    priceId: process.env.STRIPE_PRICE_ID_STARTER || "",
    limits: {
      textGenerations: 50,
      imageGenerations: 20,
      workspaces: 1,
    },
  },
  {
    name: "pro",
    priceId: process.env.STRIPE_PRICE_ID_PRO || "",
    annualDiscountPriceId: process.env.STRIPE_PRICE_ID_PRO_ANNUAL || "",
    limits: {
      textGenerations: -1, // -1 = unlimited
      imageGenerations: 100,
      workspaces: 3,
    },
    freeTrial: {
      days: 14,
    },
  },
  {
    name: "scale",
    priceId: process.env.STRIPE_PRICE_ID_SCALE || "",
    annualDiscountPriceId: process.env.STRIPE_PRICE_ID_SCALE_ANNUAL || "",
    limits: {
      textGenerations: -1, // -1 = unlimited
      imageGenerations: 300,
      workspaces: 10,
    },
    freeTrial: {
      days: 14,
    },
  },
];

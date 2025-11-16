import { nextCookies } from "better-auth/next-js";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { organization } from "better-auth/plugins";
import { stripe } from "@better-auth/stripe";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@mocah/db";
import Stripe from "stripe";
import { subscriptionPlans } from "./subscription-plans";

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-08-27.basil",
});

export const auth = betterAuth<BetterAuthOptions>({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: [process.env.CORS_ORIGIN || ""],
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    nextCookies(),
    organization(),
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
      createCustomerOnSignUp: true,
      subscription: {
        enabled: true,
        plans: subscriptionPlans,
        authorizeReference: async ({
          user,
          referenceId,
          action,
        }: {
          user: any;
          referenceId: string;
          action: string;
        }) => {
          // For organizations, check if user is owner or admin
          if (
            action === "upgrade-subscription" ||
            action === "cancel-subscription"
          ) {
            const member = await prisma.member.findFirst({
              where: {
                userId: user.id,
                organizationId: referenceId,
              },
            });
            return member?.role === "owner" || member?.role === "admin";
          }
          return true;
        },
      },
    }),
  ],
});

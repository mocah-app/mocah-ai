import { nextCookies } from "better-auth/next-js";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { organization } from "better-auth/plugins";
import { stripe } from "@better-auth/stripe";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@mocah/db";
import Stripe from "stripe";
import { subscriptionPlans } from "./subscription-plans";
import { EmailService } from "./email-service";

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-10-29.clover",
});

export const auth = betterAuth<BetterAuthOptions>({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: [process.env.CORS_ORIGIN || ""],
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }) => {
      await EmailService.sendVerificationEmail({ user, url, token });
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 86400, // 24 hours
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url, token }) => {
      await EmailService.sendPasswordResetEmail({ user, url, token });
    },
    resetPasswordTokenExpiresIn: 3600, // 1 hour
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    nextCookies(),
    organization({
      // Organization hooks for automatic Brand Kit creation
      organizationHooks: {
        afterCreateOrganization: async ({ organization }) => {
          // Create brand kit for new organization using metadata if provided
          try {
            const metadata = (organization.metadata as any) || {};

            await prisma.brandKit.create({
              data: {
                organizationId: organization.id,
                primaryColor: metadata.primaryColor || "#3B82F6",
                secondaryColor: metadata.secondaryColor || "#10B981",
                accentColor: metadata.accentColor || "#F59E0B",
                fontFamily: metadata.fontFamily || "Arial, sans-serif",
                brandVoice: metadata.brandVoice || "professional",
                logo: organization.logo || metadata.logo || null, // Prioritize top-level logo field
              },
            });
          } catch (error) {
            console.error("Failed to create brand kit:", error);
            // Don't throw - organization was created successfully
          }
        },
      },
    }),
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

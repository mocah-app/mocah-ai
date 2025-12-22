import { nextCookies } from "better-auth/next-js";
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { stripe } from "@better-auth/stripe";
import { prismaAdapter } from "better-auth/adapters/prisma";
import Stripe from "stripe";
import { subscriptionPlans } from "./subscription-plans";
import { EmailService } from "./email-service";
import {
  syncStripeSubscriptionToCache,
  invalidateAllStripeCache,
  setUserCustomerMapping,
  getUserIdByCustomerId,
} from "./stripe-sync";
import prisma, { PlanName } from "@mocah/db";
import { serverEnv } from "@mocah/config/env";
import { getRedis, CACHE_KEYS } from "@mocah/shared/redis";
import { logger } from "@mocah/shared/logger";

const stripeClient = new Stripe(serverEnv.STRIPE_SECRET_KEY, {
  apiVersion: "2025-11-17.clover",
});

const authInstance = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: [serverEnv.CORS_ORIGIN || ""],
  session: {
    // Declare organization plugin session fields for proper TypeScript inference
    additionalFields: {
      activeOrganizationId: {
        type: "string",
        required: false,
      },
    },
  },
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
      clientId: serverEnv.GOOGLE_CLIENT_ID,
      clientSecret: serverEnv.GOOGLE_CLIENT_SECRET,
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
                accentColor: metadata.accentColor || "#10B981",
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
      stripeWebhookSecret: serverEnv.STRIPE_WEBHOOK_SECRET,
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
        // Subscription lifecycle hooks for usage tracking
        onSubscriptionComplete: async ({ subscription, plan }) => {
          const userId = subscription.referenceId;
          const redis = getRedis();
          logger.info(`Subscription created for user ${userId}, plan: ${plan.name}`);

          if (redis) {
            // Clear any existing trial cache
            await redis.del(CACHE_KEYS.trial(userId));

            // Clear plan limits cache so fresh limits are fetched
            await redis.del(CACHE_KEYS.planLimits(userId));
          }

          // Get customerId from user record to sync cache and set mapping
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { stripeCustomerId: true },
          });
          if (user?.stripeCustomerId) {
            // Store bidirectional mapping for fast lookups
            await setUserCustomerMapping(userId, user.stripeCustomerId);
            await syncStripeSubscriptionToCache(user.stripeCustomerId);
          }

          // Update trial to converted if exists
          await prisma.trial.updateMany({
            where: {
              userId,
              status: "active",
            },
            data: {
              status: "converted",
              convertedAt: new Date(),
            },
          });

          logger.info(`Subscription complete hook finished for user ${userId}`);
        },
        onSubscriptionUpdate: async ({ subscription }) => {
          const userId = subscription.referenceId;
          const redis = getRedis();
          logger.info(`Subscription updated for user ${userId}`);

          if (redis) {
            // Clear plan limits cache so fresh limits are fetched
            await redis.del(CACHE_KEYS.planLimits(userId));
          }

          // Get customerId from user record to sync cache
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { stripeCustomerId: true },
          });
          if (user?.stripeCustomerId) {
            await syncStripeSubscriptionToCache(user.stripeCustomerId);
          }
        },
        onSubscriptionCancel: async ({ subscription }) => {
          const userId = subscription.referenceId;
          const redis = getRedis();
          logger.info(`Subscription cancelled for user ${userId}`);

          if (redis) {
            // Clear caches
            await redis.del(CACHE_KEYS.planLimits(userId));
          }

          // Get customerId from user record to sync cache
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { stripeCustomerId: true },
          });
          if (user?.stripeCustomerId) {
            await syncStripeSubscriptionToCache(user.stripeCustomerId);
          }
        },
        onSubscriptionDeleted: async ({ subscription }) => {
          const userId = subscription.referenceId;
          const redis = getRedis();
          logger.info(`Subscription deleted for user ${userId}`);

          if (redis) {
            // Clear all user caches
            await redis.del(CACHE_KEYS.planLimits(userId));
            await redis.del(CACHE_KEYS.trial(userId));

            // Clear usage cache for current month
            const currentMonth = new Date().toISOString().slice(0, 7);
            await redis.del(CACHE_KEYS.usage(userId, currentMonth));
          }

          // Get customerId from user record to invalidate caches
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { stripeCustomerId: true },
          });
          if (user?.stripeCustomerId) {
            await invalidateAllStripeCache(user.stripeCustomerId);
          }
        },
      },
      // Handle additional Stripe events
      onEvent: async (event) => {
        const redis = getRedis();

        // Helper to get user from customerId (try cache first, then DB)
        const getUserByCustomerId = async (customerId: string) => {
          // Try cached lookup first
          const cachedUserId = await getUserIdByCustomerId(customerId);
          if (cachedUserId) {
            return { id: cachedUserId };
          }
          // Fall back to database
          return prisma.user.findFirst({
            where: { stripeCustomerId: customerId },
            select: { id: true },
          });
        };

        switch (event.type) {
          case "customer.created": {
            // Store user-customer mapping when Stripe customer is created
            const customer = event.data.object as Stripe.Customer;
            const customerId = customer.id;
            // Better Auth stores user ID in customer metadata
            const userId = customer.metadata?.userId;

            if (userId) {
              await setUserCustomerMapping(userId, customerId);
              logger.info(`Stored user-customer mapping`, { userId, customerId });
            }
            break;
          }

          case "customer.updated": {
            // Invalidate customer cache when updated
            const customer = event.data.object as Stripe.Customer;
            await invalidateAllStripeCache(customer.id);
            break;
          }

          case "invoice.payment_succeeded": {
            // Invoice type from Stripe SDK
            const invoice = event.data.object;
            const customerId =
              typeof invoice.customer === "string"
                ? invoice.customer
                : invoice.customer?.id;

            if (!customerId) break;

            // Find user by stripe customer ID (uses cached mapping if available)
            const user = await getUserByCustomerId(customerId);

            if (user) {
              logger.info(`Payment succeeded for user ${user.id}`);

              // Check if this is a new billing period (reset usage)
              // subscription can be string, Subscription object, or null
              const invoiceData = invoice as unknown as {
                subscription?: string | { id: string } | null;
              };
              const subscriptionId =
                typeof invoiceData.subscription === "string"
                  ? invoiceData.subscription
                  : invoiceData.subscription?.id;

              if (subscriptionId) {
                const stripeSubscription = await stripeClient.subscriptions.retrieve(
                  subscriptionId,
                  { expand: ["default_payment_method"] }
                );

                // Extract billing period from subscription items
                // Pattern: subscription.items.data[0].current_period_start/end
                const firstItem = stripeSubscription.items.data[0] as {
                  current_period_start: number;
                  current_period_end: number;
                };

                const periodStart = new Date(firstItem.current_period_start * 1000);
                const periodEnd = new Date(firstItem.current_period_end * 1000);

                // Check if we need to create a new usage quota for this period
                const existingQuota = await prisma.usageQuota.findFirst({
                  where: {
                    userId: user.id,
                    periodStart: { gte: periodStart },
                  },
                });

                if (!existingQuota) {
                  // Get plan from subscription
                  const subscription = await prisma.subscription.findFirst({
                    where: { stripeSubscriptionId: subscriptionId },
                  });

                  if (subscription) {
                    const planLimitsMap = {
                      starter: { templates: 75, images: 20 },
                      pro: { templates: 200, images: 100 },
                      scale: { templates: 500, images: 300 },
                    };
                    const limits =
                      planLimitsMap[
                        subscription.plan as keyof typeof planLimitsMap
                      ] || planLimitsMap.starter;

                    await prisma.usageQuota.create({
                      data: {
                        userId: user.id,
                        plan: subscription.plan as PlanName,
                        periodStart,
                        periodEnd,
                        templatesUsed: 0,
                        templatesLimit: limits.templates,
                        imagesUsed: 0,
                        imagesLimit: limits.images,
                      },
                    });

                    // Clear old usage cache
                    if (redis) {
                      const currentMonth = new Date().toISOString().slice(0, 7);
                      await redis.del(CACHE_KEYS.usage(user.id, currentMonth));
                    }

                    logger.info(
                      `Created new usage quota for user ${user.id}, period: ${periodStart.toISOString()}`
                    );
                  }
                }

                // Sync subscription data to cache
                await syncStripeSubscriptionToCache(customerId);
              }
            }
            break;
          }
          case "invoice.payment_failed": {
            const invoice = event.data.object;
            const customerId =
              typeof invoice.customer === "string"
                ? invoice.customer
                : invoice.customer?.id;

            if (!customerId) break;

            const user = await getUserByCustomerId(customerId);

            if (user) {
              logger.warn(`Payment failed for user ${user.id}`);
              // TODO: Send payment failed email
            }
            break;
          }

          case "customer.subscription.trial_will_end": {
            // Trial ending in 3 days - send reminder email
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;

            const user = await getUserByCustomerId(customerId);

            if (user) {
              logger.info(`Trial ending soon for user ${user.id}`);
              // TODO: Send trial ending email
            }
            break;
          }

          case "customer.subscription.created": {
            // Additional sync when subscription created
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;
            await syncStripeSubscriptionToCache(customerId);
            logger.info(`Synced new subscription to cache`, { subscriptionId: subscription.id });
            break;
          }

          case "customer.subscription.updated": {
            // Sync subscription updates
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;
            await syncStripeSubscriptionToCache(customerId);
            
            const user = await getUserByCustomerId(customerId);
            if (user && redis) {
              // Clear plan limits cache so fresh limits are fetched
              await redis.del(CACHE_KEYS.planLimits(user.id));
            }
            logger.info(`Synced subscription update to cache`, { subscriptionId: subscription.id });
            break;
          }

          case "customer.subscription.deleted": {
            // Clear all caches when subscription deleted
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;
            
            await invalidateAllStripeCache(customerId);
            
            const user = await getUserByCustomerId(customerId);
            if (user && redis) {
              await redis.del(CACHE_KEYS.planLimits(user.id));
              await redis.del(CACHE_KEYS.trial(user.id));
              const currentMonth = new Date().toISOString().slice(0, 7);
              await redis.del(CACHE_KEYS.usage(user.id, currentMonth));
            }
            logger.info(`Cleared caches for deleted subscription`, { subscriptionId: subscription.id });
            break;
          }

          case "charge.dispute.created": {
            // Log dispute for monitoring - important for fraud prevention
            const dispute = event.data.object as Stripe.Dispute;
            logger.warn(`Dispute created`, {
              disputeId: dispute.id,
              chargeId: dispute.charge,
              amount: dispute.amount,
              reason: dispute.reason,
            });
            // TODO: Send alert to admin
            break;
          }
        }
      },
    }),
  ],
});

export const auth = authInstance;

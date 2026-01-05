import { nextCookies } from "better-auth/next-js";
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { stripe } from "@better-auth/stripe";
import { prismaAdapter } from "better-auth/adapters/prisma";
import Stripe from "stripe";
import { subscriptionPlans, getPlanNameFromPriceId, type PlanName } from "./subscription-plans";
import { EmailService } from "./email-service";
import {
  syncStripeSubscriptionToCache,
  invalidateAllStripeCache,
  setUserCustomerMapping,
  getUserIdByCustomerId,
} from "./stripe-sync";
import { updateUsageQuotaLimits } from "./usage-quota";
import prisma from "@mocah/db";
import { serverEnv } from "@mocah/config/env";
import { getRedis, CACHE_KEYS, isRedisAvailable } from "@mocah/shared/redis";
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

          logger.info(`Subscription complete hook finished for user ${userId}`);
        },
        onSubscriptionUpdate: async ({ subscription }) => {
          const userId = subscription.referenceId;
          const redis = getRedis();
          logger.info(`Subscription updated for user ${userId}`);

          if (redis && isRedisAvailable()) {
            // Clear both plan limits AND usage cache for complete refresh
            const currentMonth = new Date().toISOString().slice(0, 7);
            await Promise.all([
              redis.del(CACHE_KEYS.planLimits(userId)),
              redis.del(CACHE_KEYS.usage(userId, currentMonth)),
            ]);
          }

          // Get customerId from user record to sync cache and ensure mapping exists
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { stripeCustomerId: true },
          });
          if (user?.stripeCustomerId) {
            // Refresh the mapping to handle Redis restarts or missing mappings
            await setUserCustomerMapping(userId, user.stripeCustomerId);
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
        // Customize checkout session to auto-apply launch discount for annual plans
        // Uses coupon ID (not promotion code) to work with trial subscriptions
        // where initial checkout amount is $0
        getCheckoutSessionParams: async ({ user }) => {
          const { getCouponId } = await import("./promo-code");
          const couponId = getCouponId();
          
          // Read checkout preference from Redis (set by frontend before checkout)
          let isAnnual = false;
          const redis = getRedis();
          const redisKey = `checkout:annual:${user.id}`;
          
          if (redis && isRedisAvailable()) {
            try {
              const pref = await redis.get(redisKey);
              // Upstash Redis returns numbers, so check both string and number
              isAnnual = String(pref) === "1";
              // Clean up after reading (one-time use)
              if (pref !== null && pref !== undefined) {
                await redis.del(redisKey);
              }
            } catch (e) {
              logger.warn(`Failed to read checkout preference: ${e}`);
            }
          }
          
          // Only apply coupon for annual plans
          if (couponId && isAnnual) {
            return {
              params: {
                discounts: [
                  {
                    coupon: couponId,
                  },
                ],
              },
            };
          }
          
          // For monthly or if no coupon, allow manual promo code entry
          return {
            params: {
              allow_promotion_codes: true,
            },
          };
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

        // Helper to handle trial conversion to active subscription
        const handleTrialConversion = async (
          userId: string,
          stripeSubscription: Stripe.Subscription,
          planName?: string
        ) => {
          if (!planName) {
            logger.warn(`Cannot handle trial conversion without plan name`, { userId, subscriptionId: stripeSubscription.id });
            return;
          }

          // Update subscription with conversion data
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: stripeSubscription.id },
            data: {
              trialConverted: true,
              trialConvertedAt: new Date(),
            },
          });

          // Extract period from subscription items
          const firstItem = stripeSubscription.items.data[0] as {
            current_period_start: number;
            current_period_end: number;
          };

          const periodStart = new Date(firstItem.current_period_start * 1000);
          const periodEnd = new Date(firstItem.current_period_end * 1000);

          // Update usage quota with new limits
          await updateUsageQuotaLimits(userId, planName as PlanName, periodStart, periodEnd);

          logger.info(`Trial converted to active subscription`, {
            userId,
            planName,
            subscriptionId: stripeSubscription.id,
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
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;

            await syncStripeSubscriptionToCache(customerId);

            const user = await getUserByCustomerId(customerId);
            if (!user) {
              logger.warn(`User not found for subscription creation`, { customerId });
              break;
            }

            const firstItem = subscription.items.data[0];
            const priceId = firstItem?.price?.id;
            const planName = priceId ? getPlanNameFromPriceId(priceId) : undefined;

            // Update subscription status from "incomplete" (Better Auth initial state) to actual Stripe status
            await prisma.subscription.updateMany({
              where: {
                referenceId: user.id,
                status: "incomplete",
              },
              data: {
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: customerId,
                status: subscription.status,
                plan: planName,
                periodStart: firstItem?.current_period_start
                  ? new Date(firstItem.current_period_start * 1000)
                  : new Date(),
                periodEnd: firstItem?.current_period_end
                  ? new Date(firstItem.current_period_end * 1000)
                  : null,
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                trialStart: subscription.trial_start
                  ? new Date(subscription.trial_start * 1000)
                  : null,
                trialEnd: subscription.trial_end
                  ? new Date(subscription.trial_end * 1000)
                  : null,
                updatedAt: new Date(),
              },
            });

            logger.info(`Updated subscription status`, {
              userId: user.id,
              subscriptionId: subscription.id,
              status: subscription.status,
              planName,
            });

            // Clear user cache to refresh limits
            if (redis && isRedisAvailable()) {
              await redis.del(CACHE_KEYS.planLimits(user.id));
              const currentMonth = new Date().toISOString().slice(0, 7);
              await redis.del(CACHE_KEYS.usage(user.id, currentMonth));
            }

            break;
          }

          case "customer.subscription.updated": {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;
            const previousAttributes = (event.data as any).previous_attributes as { 
              status?: string;
              items?: any;
            } | undefined;
            const cachedSub = await syncStripeSubscriptionToCache(customerId);

            const user = await getUserByCustomerId(customerId);
            if (!user) {
              logger.warn(`User not found for subscription update`, { customerId, subscriptionId: subscription.id });
              break;
            }

            const firstItem = subscription.items.data[0];
            const priceId = firstItem?.price?.id;
            const planName = priceId ? getPlanNameFromPriceId(priceId) : undefined;

            // Extract billing period
            const periodStart = cachedSub.status !== "none" && cachedSub.currentPeriodStart
              ? new Date(cachedSub.currentPeriodStart * 1000)
              : new Date();
            const periodEnd = cachedSub.status !== "none" && cachedSub.currentPeriodEnd
              ? new Date(cachedSub.currentPeriodEnd * 1000)
              : new Date();

            // Detect trial → active conversion
            if (previousAttributes?.status === "trialing" && subscription.status === "active") {
              logger.info(`Trial converting to active`, {
                userId: user.id,
                subscriptionId: subscription.id,
                planName,
              });
              await handleTrialConversion(user.id, subscription, planName);
            } 
            // Detect plan change (upgrade/downgrade) - check if price changed
            else if (previousAttributes?.items && planName) {
              const previousItems = previousAttributes.items as { data?: Array<{ price?: { id?: string } }> };
              const previousPriceId = previousItems?.data?.[0]?.price?.id;
              const currentPriceId = firstItem?.price?.id;

              if (previousPriceId && currentPriceId && previousPriceId !== currentPriceId) {
                const previousPlan = getPlanNameFromPriceId(previousPriceId);
                logger.info(`Plan change detected`, {
                  userId: user.id,
                  subscriptionId: subscription.id,
                  previousPlan,
                  newPlan: planName,
                  previousPriceId,
                  currentPriceId,
                });

                // Update usage quota with new limits (Option A: keep usage, update limits)
                await updateUsageQuotaLimits(user.id, planName as PlanName, periodStart, periodEnd);
              }
            }

            // Update subscription record
            await prisma.subscription.updateMany({
              where: { stripeSubscriptionId: subscription.id },
              data: {
                status: subscription.status,
                plan: planName,
                periodStart,
                periodEnd,
                cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
                trialStart: subscription.trial_start
                  ? new Date(subscription.trial_start * 1000)
                  : null,
                trialEnd: subscription.trial_end
                  ? new Date(subscription.trial_end * 1000)
                  : null,
                trialCancelled: subscription.status === "trialing" && subscription.cancel_at_period_end,
                trialCancelledAt: subscription.status === "trialing" && subscription.cancel_at_period_end
                  ? new Date()
                  : null,
                updatedAt: new Date(),
              },
            });

            // Always clear plan limits cache on any subscription update
            if (redis) {
              await redis.del(CACHE_KEYS.planLimits(user.id));
            }
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

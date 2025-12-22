/**
 * Stripe Subscription Sync & Cache
 *
 * Syncs Stripe subscription data to Redis for fast lookups
 * without hitting the Stripe API on every request.
 */

import Stripe from "stripe";
import { serverEnv } from "@mocah/config/env";
import { getRedis, CACHE_KEYS } from "@mocah/shared/redis";
import { logger } from "@mocah/shared/logger";

// Initialize Stripe client
const stripe = new Stripe(serverEnv.STRIPE_SECRET_KEY, {
  apiVersion: "2025-11-17.clover",
});

// ============================================================================
// Types
// ============================================================================

export type StripeSubscriptionCache =
  | {
      subscriptionId: string;
      status: Stripe.Subscription.Status;
      plan: string | null;
      priceId: string | null;
      currentPeriodStart: number;
      currentPeriodEnd: number;
      cancelAtPeriodEnd: boolean;
      trialEnd: number | null;
      paymentMethod: {
        brand: string | null;
        last4: string | null;
      } | null;
    }
  | {
      status: "none";
    };

// ============================================================================
// Cache Key Helpers
// ============================================================================

const STRIPE_CACHE_TTL = 60 * 60 * 24; // 24 hours

function getSubscriptionCacheKey(customerId: string): string {
  return `stripe:subscription:${customerId}`;
}

// ============================================================================
// Sync Functions
// ============================================================================

/**
 * Syncs subscription data from Stripe to Redis cache
 * Call this after checkout success and in webhook handlers
 */
export async function syncStripeSubscriptionToCache(
  customerId: string
): Promise<StripeSubscriptionCache> {
  const redis = getRedis();

  try {
    // Fetch latest subscription data from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: "all",
      expand: ["data.default_payment_method"],
    });

    // If no subscriptions found, store "none" status
    if (subscriptions.data.length === 0) {
      const subData: StripeSubscriptionCache = { status: "none" };
      if (redis) {
        await redis.set(getSubscriptionCacheKey(customerId), subData, {
          ex: STRIPE_CACHE_TTL,
        });
      }
      return subData;
    }

    // Process the most recent subscription
    const subscription = subscriptions.data[0];
    const firstItem = subscription.items.data[0];

    // Extract payment method info if expanded
    let paymentMethod: StripeSubscriptionCache extends { status: "none" }
      ? never
      : StripeSubscriptionCache["paymentMethod"] = null;

    if (
      subscription.default_payment_method &&
      typeof subscription.default_payment_method !== "string"
    ) {
      const pm = subscription.default_payment_method;
      paymentMethod = {
        brand: pm.card?.brand ?? null,
        last4: pm.card?.last4 ?? null,
      };
    }

    // Extract plan name from price metadata or product
    let planName: string | null = null;
    const price = firstItem.price;
    if (price.metadata?.plan) {
      planName = price.metadata.plan;
    } else if (price.nickname) {
      planName = price.nickname.toLowerCase();
    }

    const subData: StripeSubscriptionCache = {
      subscriptionId: subscription.id,
      status: subscription.status,
      plan: planName,
      priceId: firstItem.price.id,
      currentPeriodStart: (firstItem as any).current_period_start,
      currentPeriodEnd: (firstItem as any).current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end,
      paymentMethod,
    };

    // Store in Redis
    if (redis) {
      await redis.set(getSubscriptionCacheKey(customerId), subData, {
        ex: STRIPE_CACHE_TTL,
      });
      logger.info("Synced Stripe subscription to cache", {
        customerId,
        subscriptionId: subscription.id,
        status: subscription.status,
      });
    }

    return subData;
  } catch (error) {
    logger.error("Error syncing Stripe subscription to cache", {
      customerId,
      error,
    });
    throw error;
  }
}

/**
 * Get cached subscription data, falls back to Stripe API if cache miss
 */
export async function getCachedSubscription(
  customerId: string
): Promise<StripeSubscriptionCache> {
  const redis = getRedis();

  // Try cache first
  if (redis) {
    const cached = await redis.get<StripeSubscriptionCache>(
      getSubscriptionCacheKey(customerId)
    );
    if (cached) {
      return cached;
    }
  }

  // Cache miss - fetch from Stripe and cache
  return syncStripeSubscriptionToCache(customerId);
}

/**
 * Invalidate subscription cache for a customer
 */
export async function invalidateSubscriptionCache(
  customerId: string
): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.del(getSubscriptionCacheKey(customerId));
    logger.info("Invalidated subscription cache", { customerId });
  }
}

// ============================================================================
// Cached Stripe API Functions
// ============================================================================

/**
 * Cached wrapper for stripe.subscriptions.list
 * Uses Redis for caching with configurable TTL
 */
export async function cachedStripeSubscriptionsList(
  customerId: string
): Promise<Stripe.ApiList<Stripe.Subscription>> {
  const redis = getRedis();
  const cacheKey = `stripe:subscriptions:list:${customerId}`;
  const TTL = 60 * 5; // 5 minutes for list

  if (redis) {
    const cached = await redis.get<Stripe.ApiList<Stripe.Subscription>>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const result = await stripe.subscriptions.list({
    customer: customerId,
    limit: 10,
    status: "all",
    expand: ["data.default_payment_method"],
  });

  if (redis) {
    await redis.set(cacheKey, result, { ex: TTL });
  }

  return result;
}

/**
 * Cached wrapper for stripe.customers.retrieve
 */
export async function cachedStripeCustomerRetrieve(
  customerId: string
): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
  const redis = getRedis();
  const cacheKey = `stripe:customer:${customerId}`;
  const TTL = 60 * 60; // 1 hour

  if (redis) {
    const cached = await redis.get<Stripe.Customer | Stripe.DeletedCustomer>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const result = await stripe.customers.retrieve(customerId);

  if (redis) {
    await redis.set(cacheKey, result, { ex: TTL });
  }

  return result;
}

/**
 * Cached wrapper for stripe.prices.retrieve
 */
export async function cachedStripePriceRetrieve(
  priceId: string
): Promise<Stripe.Price> {
  const redis = getRedis();
  const cacheKey = `stripe:price:${priceId}`;
  const TTL = 60 * 60 * 24; // 24 hours - prices don't change often

  if (redis) {
    const cached = await redis.get<Stripe.Price>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const result = await stripe.prices.retrieve(priceId);

  if (redis) {
    await redis.set(cacheKey, result, { ex: TTL });
  }

  return result;
}

/**
 * Cached wrapper for stripe.invoices.list
 */
export async function cachedStripeInvoicesList(
  customerId: string,
  limit = 12
): Promise<Stripe.ApiList<Stripe.Invoice>> {
  const redis = getRedis();
  const cacheKey = `stripe:invoices:list:${customerId}:${limit}`;
  const TTL = 60 * 15; // 15 minutes

  if (redis) {
    const cached = await redis.get<Stripe.ApiList<Stripe.Invoice>>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const result = await stripe.invoices.list({
    customer: customerId,
    limit,
  });

  if (redis) {
    await redis.set(cacheKey, result, { ex: TTL });
  }

  return result;
}

/**
 * Invalidate all Stripe caches for a customer
 * Call this after webhook events that modify subscription state
 */
export async function invalidateAllStripeCache(customerId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const keysToDelete = [
    getSubscriptionCacheKey(customerId),
    `stripe:subscriptions:list:${customerId}`,
    `stripe:customer:${customerId}`,
    // Invoices cache uses limit suffix, so we can't easily invalidate all
    // But invoices are append-only, so stale cache is acceptable
  ];

  await Promise.all(keysToDelete.map((key) => redis.del(key)));
  logger.info("Invalidated all Stripe caches for customer", { customerId });
}


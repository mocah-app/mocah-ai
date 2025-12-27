/**
 * Stripe Subscription Sync & Cache
 *
 * Syncs Stripe subscription data to Redis for fast lookups.
 * Uses webhook-driven updates (no TTL) for subscription data.
 * 
 * Pattern based on proven implementation with bidirectional mappings.
 */

import Stripe from "stripe";
import { serverEnv } from "@mocah/config/env";
import { getRedis } from "@mocah/shared/redis";
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
// Cache Key Helpers - Bidirectional Mappings
// ============================================================================

const CACHE_KEYS = {
  // Subscription data keyed by customer
  subscription: (customerId: string) => `stripe:subscription:${customerId}`,
  // Bidirectional mappings for fast lookups
  userToCustomer: (userId: string) => `stripe:user:${userId}`,
  customerToUser: (customerId: string) => `stripe:customer-to-user:${customerId}`,
} as const;

// TTLs - API caches only (subscription data has no TTL, updated via webhooks)
const API_CACHE_TTL = {
  subscriptionList: 60 * 5, // 5 minutes
  customer: 60 * 60, // 1 hour
  price: 60 * 60 * 24, // 24 hours - prices rarely change
  invoices: 60 * 15, // 15 minutes
} as const;

// ============================================================================
// Bidirectional Mapping Functions
// ============================================================================

/**
 * Store user-to-customer mapping (both directions)
 * Call this when creating a Stripe customer
 */
export async function setUserCustomerMapping(
  userId: string,
  customerId: string
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await Promise.all([
      redis.set(CACHE_KEYS.userToCustomer(userId), customerId),
      redis.set(CACHE_KEYS.customerToUser(customerId), userId),
    ]);
    logger.info("Stored user-customer mapping", { userId, customerId });
  } catch (error) {
    logger.error("Failed to store user-customer mapping", { userId, customerId, error });
  }
}

/**
 * Get customer ID from user ID
 */
export async function getCustomerIdByUserId(userId: string): Promise<string | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    return await redis.get<string>(CACHE_KEYS.userToCustomer(userId));
  } catch (error) {
    logger.error("Failed to get customer ID by user ID", { userId, error });
    return null;
  }
}

/**
 * Get user ID from customer ID
 */
export async function getUserIdByCustomerId(customerId: string): Promise<string | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    return await redis.get<string>(CACHE_KEYS.customerToUser(customerId));
  } catch (error) {
    logger.error("Failed to get user ID by customer ID", { customerId, error });
    return null;
  }
}

// ============================================================================
// Subscription Sync Functions (No TTL - Webhook Driven)
// ============================================================================

/**
 * Syncs subscription data from Stripe to Redis cache
 * NO TTL - Data is only updated via webhook events for consistency
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
        // No TTL - will be updated via webhooks
        await redis.set(CACHE_KEYS.subscription(customerId), subData);
      }
      return subData;
    }

    // Process the most recent subscription
    const subscription = subscriptions.data[0]!;
    const firstItem = subscription.items.data[0]!;

    // Extract payment method info if expanded
    let paymentMethod: {
      brand: string | null;
      last4: string | null;
    } | null = null;

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

    // Cast item to access period fields
    const itemData = firstItem as {
      current_period_start: number;
      current_period_end: number;
      price: { id: string };
    };

    const subData: StripeSubscriptionCache = {
      subscriptionId: subscription.id,
      status: subscription.status,
      plan: planName,
      priceId: itemData.price.id,
      currentPeriodStart: itemData.current_period_start,
      currentPeriodEnd: itemData.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end,
      paymentMethod,
    };

    // Store in Redis - NO TTL (webhook-driven updates)
    if (redis) {
      await redis.set(CACHE_KEYS.subscription(customerId), subData);
      logger.info("Synced Stripe subscription to cache (no TTL)", {
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
      CACHE_KEYS.subscription(customerId)
    );
    if (cached) {
      return cached;
    }
  }

  // Cache miss - fetch from Stripe and cache
  return syncStripeSubscriptionToCache(customerId);
}

/**
 * Get cached subscription by user ID (uses bidirectional mapping)
 */
export async function getCachedSubscriptionByUserId(
  userId: string
): Promise<StripeSubscriptionCache | null> {
  const customerId = await getCustomerIdByUserId(userId);
  if (!customerId) return null;
  return getCachedSubscription(customerId);
}

/**
 * Invalidate subscription cache for a customer
 */
export async function invalidateSubscriptionCache(
  customerId: string
): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.del(CACHE_KEYS.subscription(customerId));
    logger.info("Invalidated subscription cache", { customerId });
  }
}

// ============================================================================
// Cached Stripe API Functions (with TTL for request deduplication)
// ============================================================================

/**
 * Cached wrapper for stripe.subscriptions.list
 */
export async function cachedStripeSubscriptionsList(
  customerId: string
): Promise<Stripe.ApiList<Stripe.Subscription>> {
  const redis = getRedis();
  const cacheKey = `stripe:subscriptions:list:${customerId}`;

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
    await redis.set(cacheKey, result, { ex: API_CACHE_TTL.subscriptionList });
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

  if (redis) {
    const cached = await redis.get<Stripe.Customer | Stripe.DeletedCustomer>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const result = await stripe.customers.retrieve(customerId);

  if (redis) {
    await redis.set(cacheKey, result, { ex: API_CACHE_TTL.customer });
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

  if (redis) {
    const cached = await redis.get<Stripe.Price>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const result = await stripe.prices.retrieve(priceId);

  if (redis) {
    await redis.set(cacheKey, result, { ex: API_CACHE_TTL.price });
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
    await redis.set(cacheKey, result, { ex: API_CACHE_TTL.invoices });
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
    CACHE_KEYS.subscription(customerId),
    `stripe:subscriptions:list:${customerId}`,
    `stripe:customer:${customerId}`,
  ];

  await Promise.all(keysToDelete.map((key) => redis.del(key)));
  logger.info("Invalidated all Stripe caches for customer", { customerId });
}

/**
 * Clear all mappings for a user (use when deleting user)
 */
export async function clearUserStripeMappings(userId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const customerId = await getCustomerIdByUserId(userId);
  
  const keysToDelete = [CACHE_KEYS.userToCustomer(userId)];
  if (customerId) {
    keysToDelete.push(CACHE_KEYS.customerToUser(customerId));
    keysToDelete.push(CACHE_KEYS.subscription(customerId));
  }

  await Promise.all(keysToDelete.map((key) => redis.del(key)));
  logger.info("Cleared Stripe mappings for user", { userId, customerId });
}

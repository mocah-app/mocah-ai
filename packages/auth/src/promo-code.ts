import "server-only";
import { serverEnv } from "@mocah/config/env";

/**
 * Stripe coupon ID for launch discount
 * This is automatically applied when creating checkout sessions
 * 
 * IMPORTANT: Use COUPON ID (not promotion code ID) to allow discounts
 * on trial subscriptions where initial checkout amount is $0.
 * Coupons attach to the subscription and apply when billing starts.
 *
 * NOTE: This file is server-only and should never be imported by client components
 */
export const LAUNCH_COUPON_ID =
  serverEnv.STRIPE_LAUNCH_COUPON_ID || "";

/**
 * Get the launch coupon ID
 * Returns the coupon ID to attach to subscription (not promotion code)
 */
export function getCouponId(): string | undefined {
  return LAUNCH_COUPON_ID || undefined;
}

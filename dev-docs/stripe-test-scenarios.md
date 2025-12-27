# Stripe Integration Test Scenarios

> **Purpose:** Comprehensive test scenarios to ensure Stripe integration is production-ready  
> **Last Updated:** December 2025  
> **Status:** Pre-Production Checklist

---

## Table of Contents

1. [Subscription Lifecycle](#subscription-lifecycle)
2. [Trial System](#trial-system)
3. [Payment Processing](#payment-processing)
4. [Webhook Events](#webhook-events)
5. [Edge Cases & Error Handling](#edge-cases--error-handling)
6. [Cache & Data Sync](#cache--data-sync)
7. [Authorization & Security](#authorization--security)
8. [Usage Tracking & Limits](#usage-tracking--limits)
9. [Billing Portal & Invoices](#billing-portal--invoices)
10. [Performance & Reliability](#performance--reliability)

---

## Subscription Lifecycle

### ✅ New Subscription Sign-Up

**Scenario:** User signs up for a new subscription

**Test Steps:**
1. User selects a plan (Starter/Pro/Scale) on pricing page
2. User clicks "Start Trial" or "Subscribe"
3. User is redirected to Stripe Checkout
4. User enters valid payment method
5. User completes checkout

**Expected Results:**
- [ ] Stripe customer is created with `userId` in metadata
- [ ] User-customer mapping stored in Redis (`stripe:user:{userId}` and `stripe:customer-to-user:{customerId}`)
- [ ] Subscription record created in database with status `trialing` or `active`
- [ ] Trial record created if status is `trialing` (7 days, 5 templates, 5 images)
- [ ] Subscription cache synced to Redis (`stripe:subscription:{customerId}`)
- [ ] `customer.subscription.created` webhook received and processed
- [ ] Usage limits updated in Redis cache
- [ ] User redirected to success URL with `checkout=success` param

**Verification:**
- Check Stripe Dashboard → Customers → Customer exists
- Check database: `subscription` table has new record
- Check database: `trial` table has record if trialing
- Check Redis: Customer mapping exists
- Check Redis: Subscription cache exists
- Check logs: Webhook events logged

---

### ✅ Subscription Upgrade (Plan Change)

**Scenario:** User upgrades from Starter → Pro → Scale

**Test Steps:**
1. User has active Starter subscription
2. User navigates to billing settings
3. User selects Pro plan
4. User completes checkout

**Expected Results:**
- [ ] New subscription created in Stripe (old subscription cancelled)
- [ ] Database subscription record updated with new plan
- [ ] Usage limits updated immediately (200 templates, 100 images)
- [ ] Proration handled correctly by Stripe
- [ ] `customer.subscription.updated` webhook received
- [ ] Cache invalidated and refreshed
- [ ] Usage quota record created for new billing period

**Verification:**
- Check Stripe Dashboard → Subscriptions → New subscription active
- Check database: Plan field updated
- Check Redis: Limits cache refreshed
- Check logs: Upgrade webhook processed

---

### ✅ Subscription Downgrade (Plan Change)

**Scenario:** User downgrades from Scale → Pro → Starter

**Test Steps:**
1. User has active Scale subscription
2. User navigates to billing settings
3. User selects Pro plan
4. User completes checkout

**Expected Results:**
- [ ] New subscription created in Stripe
- [ ] Database subscription record updated with new plan
- [ ] Usage limits updated (may exceed new limit temporarily - OK)
- [ ] Proration handled correctly
- [ ] `customer.subscription.updated` webhook received
- [ ] Cache invalidated and refreshed
- [ ] User can continue using service (no immediate cutoff)

**Verification:**
- Check Stripe Dashboard → New subscription active
- Check database: Plan field updated
- Check Redis: Limits cache refreshed

---

### ✅ Cancel Subscription (At Period End)

**Scenario:** User cancels subscription but wants to use until period end

**Test Steps:**
1. User has active subscription
2. User navigates to billing settings
3. User clicks "Cancel Subscription"
4. User confirms cancellation

**Expected Results:**
- [ ] Subscription marked `cancel_at_period_end: true` in Stripe
- [ ] Database subscription record updated with `cancelAtPeriodEnd: true`
- [ ] User retains access until period end
- [ ] `customer.subscription.updated` webhook received
- [ ] Cache updated
- [ ] User sees "Cancels on {date}" message

**Verification:**
- Check Stripe Dashboard → Subscription shows cancel_at_period_end
- Check database: `cancelAtPeriodEnd` field is `true`
- Check UI: User sees cancellation date

---

### ✅ Subscription Cancellation Completion

**Scenario:** Cancelled subscription reaches period end

**Test Steps:**
1. User has subscription with `cancel_at_period_end: true`
2. Wait for period end date (or simulate via Stripe CLI)
3. Stripe automatically cancels subscription

**Expected Results:**
- [ ] `customer.subscription.deleted` webhook received
- [ ] Database subscription status updated to `canceled`
- [ ] All caches cleared (subscription, limits, usage)
- [ ] User loses access immediately
- [ ] User redirected to pricing page or sees upgrade prompt

**Verification:**
- Check Stripe Dashboard → Subscription status is `canceled`
- Check database: Status is `canceled`
- Check Redis: Caches cleared
- Check UI: User sees "No active subscription"

---

### ✅ Immediate Cancellation

**Scenario:** User cancels subscription immediately (not at period end)

**Test Steps:**
1. User has active subscription
2. User cancels via Stripe Billing Portal
3. User selects "Cancel immediately"

**Expected Results:**
- [ ] Subscription deleted in Stripe immediately
- [ ] `customer.subscription.deleted` webhook received
- [ ] Database subscription status updated
- [ ] All caches cleared
- [ ] User loses access immediately

**Verification:**
- Check Stripe Dashboard → Subscription deleted
- Check database: Status updated
- Check Redis: Caches cleared

---

## Trial System

### ✅ Trial Start (New User)

**Scenario:** New user starts 7-day trial

**Test Steps:**
1. New user signs up
2. User selects any plan
3. User enters payment method (card required)
4. User completes checkout

**Expected Results:**
- [ ] Trial record created in database
- [ ] Trial status: `active`
- [ ] Trial limits: 5 templates, 5 images
- [ ] Trial duration: 7 days from start
- [ ] Trial cached in Redis (`trial:{userId}`)
- [ ] Subscription status: `trialing` in Stripe
- [ ] `customer.subscription.created` webhook with `status: "trialing"`

**Verification:**
- Check database: `trial` table has record
- Check database: `startedAt` and `expiresAt` are correct
- Check Redis: Trial cache exists
- Check Stripe: Subscription status is `trialing`

---

### ✅ Trial Conversion (Auto-Convert)

**Scenario:** Trial expires and auto-converts to paid subscription

**Test Steps:**
1. User has active trial
2. Wait for trial end date (or simulate via Stripe CLI)
3. Stripe charges payment method automatically

**Expected Results:**
- [ ] `invoice.payment_succeeded` webhook received
- [ ] Trial status updated to `converted`
- [ ] `convertedAt` timestamp set
- [ ] Subscription status changes from `trialing` to `active`
- [ ] Usage limits upgraded to plan limits (75/200/500 templates, 20/100/300 images)
- [ ] Trial cache cleared
- [ ] Plan limits cache refreshed

**Verification:**
- Check database: Trial status is `converted`
- Check database: Subscription status is `active`
- Check Redis: Trial cache cleared, limits cache updated
- Check Stripe: Invoice created and paid

---

### ✅ Trial Conversion (Manual Upgrade)

**Scenario:** User upgrades during trial period

**Test Steps:**
1. User has active trial (e.g., day 3 of 7)
2. User clicks "Upgrade Now" button
3. User completes checkout

**Expected Results:**
- [ ] Trial status updated to `converted`
- [ ] `convertedAt` timestamp set
- [ ] Subscription status changes to `active` immediately
- [ ] Usage limits upgraded immediately
- [ ] Trial cache cleared
- [ ] `onSubscriptionComplete` hook fired
- [ ] Usage quota created for new billing period

**Verification:**
- Check database: Trial status is `converted`
- Check database: Subscription status is `active`
- Check Redis: Limits updated immediately

---

### ✅ Trial Cancellation

**Scenario:** User cancels during trial period

**Test Steps:**
1. User has active trial
2. User cancels subscription via billing portal
3. User confirms cancellation

**Expected Results:**
- [ ] Trial status updated to `cancelled`
- [ ] `cancelledAt` timestamp set
- [ ] Subscription marked `cancel_at_period_end: true`
- [ ] User retains access until trial end
- [ ] `customer.subscription.updated` webhook received

**Verification:**
- Check database: Trial status is `cancelled`
- Check database: Subscription `cancelAtPeriodEnd` is `true`
- Check UI: User sees cancellation date

---

### ✅ Trial Expiration (No Conversion)

**Scenario:** Trial expires without payment (card declined, etc.)

**Test Steps:**
1. User has active trial
2. Trial end date reached
3. Payment method fails or is invalid

**Expected Results:**
- [ ] `invoice.payment_failed` webhook received
- [ ] Subscription status changes to `past_due` or `unpaid`
- [ ] Trial status remains `active` (or updated to `expired`)
- [ ] User loses access
- [ ] Email notification sent (if implemented)

**Verification:**
- Check Stripe Dashboard → Subscription status
- Check database: Subscription status updated
- Check logs: Payment failed event logged

---

### ✅ One Trial Per Card Enforcement

**Scenario:** User tries to start second trial with same card

**Test Steps:**
1. User has completed trial (converted or expired)
2. User tries to start new trial with same payment method
3. User completes checkout

**Expected Results:**
- [ ] Trial creation blocked if same `stripeCustomerId` exists within 90 days
- [ ] Warning logged: "Trial already exists for customer"
- [ ] User sees message: "You've already used your trial"
- [ ] OR: Trial created if >90 days since last trial (business decision)

**Verification:**
- Check database: No duplicate trial record
- Check logs: Warning message logged
- Check UI: Appropriate error message shown

---

## Payment Processing

### ✅ Successful Payment

**Scenario:** Monthly subscription payment succeeds

**Test Steps:**
1. User has active subscription
2. Billing period ends
3. Stripe charges payment method automatically

**Expected Results:**
- [ ] `invoice.payment_succeeded` webhook received
- [ ] Invoice created in Stripe
- [ ] Usage quota record created for new billing period
- [ ] Usage counters reset (templatesUsed: 0, imagesUsed: 0)
- [ ] Subscription cache updated
- [ ] User retains access

**Verification:**
- Check Stripe Dashboard → Invoices → Invoice paid
- Check database: New `usageQuota` record created
- Check database: Usage counters reset
- Check Redis: Cache updated

---

### ✅ Payment Failed (First Attempt)

**Scenario:** Payment method fails on first attempt

**Test Steps:**
1. User has active subscription
2. Billing period ends
3. Payment method fails (insufficient funds, expired card, etc.)

**Expected Results:**
- [ ] `invoice.payment_failed` webhook received
- [ ] Subscription status changes to `past_due`
- [ ] Database subscription status updated
- [ ] User retains access (grace period)
- [ ] Email notification sent (if implemented)
- [ ] Warning logged

**Verification:**
- Check Stripe Dashboard → Subscription status is `past_due`
- Check database: Status updated
- Check logs: Payment failed event logged

---

### ✅ Payment Retry Success

**Scenario:** Stripe retries failed payment and succeeds

**Test Steps:**
1. User has `past_due` subscription
2. User updates payment method
3. Stripe retries payment automatically
4. Payment succeeds

**Expected Results:**
- [ ] `invoice.payment_succeeded` webhook received
- [ ] Subscription status changes back to `active`
- [ ] Database subscription status updated
- [ ] User retains access
- [ ] Usage quota created for new period

**Verification:**
- Check Stripe Dashboard → Subscription status is `active`
- Check database: Status updated
- Check logs: Payment succeeded event logged

---

### ✅ Payment Retry Failed (Final)

**Scenario:** All payment retry attempts fail

**Test Steps:**
1. User has `past_due` subscription
2. Stripe exhausts all retry attempts
3. Payment still fails

**Expected Results:**
- [ ] Subscription status changes to `unpaid` or `canceled`
- [ ] `customer.subscription.deleted` webhook received (if canceled)
- [ ] Database subscription status updated
- [ ] User loses access
- [ ] All caches cleared
- [ ] Email notification sent (if implemented)

**Verification:**
- Check Stripe Dashboard → Subscription status
- Check database: Status updated
- Check Redis: Caches cleared
- Check UI: User sees "Subscription expired" message

---

### ✅ Payment Method Update

**Scenario:** User updates payment method

**Test Steps:**
1. User has active subscription
2. User navigates to billing settings
3. User clicks "Update Payment Method"
4. User enters new card via Stripe Billing Portal
5. User saves new payment method

**Expected Results:**
- [ ] New payment method saved in Stripe
- [ ] `customer.updated` webhook received
- [ ] Subscription cache invalidated
- [ ] Future payments use new payment method
- [ ] User sees updated card info in UI

**Verification:**
- Check Stripe Dashboard → Customer → Payment methods updated
- Check Redis: Cache invalidated
- Check UI: New card displayed

---

## Webhook Events

### ✅ Customer Created

**Scenario:** New Stripe customer created

**Test Steps:**
1. User signs up
2. Better Auth creates Stripe customer

**Expected Results:**
- [ ] `customer.created` webhook received
- [ ] User-customer mapping stored in Redis
- [ ] Customer metadata includes `userId`
- [ ] Mapping cached bidirectionally

**Verification:**
- Check Redis: `stripe:user:{userId}` and `stripe:customer-to-user:{customerId}` exist
- Check Stripe Dashboard → Customer metadata

---

### ✅ Customer Updated

**Scenario:** Customer information updated in Stripe

**Test Steps:**
1. User updates email or other info
2. Stripe customer record updated

**Expected Results:**
- [ ] `customer.updated` webhook received
- [ ] Customer cache invalidated
- [ ] Subscription cache invalidated (if needed)

**Verification:**
- Check Redis: Customer cache cleared
- Check logs: Cache invalidation logged

---

### ✅ Subscription Created

**Scenario:** New subscription created in Stripe

**Test Steps:**
1. User completes checkout
2. Stripe creates subscription

**Expected Results:**
- [ ] `customer.subscription.created` webhook received
- [ ] Database subscription record updated (status, plan, periods)
- [ ] Trial record created if status is `trialing`
- [ ] Subscription cache synced
- [ ] User cache cleared

**Verification:**
- Check database: Subscription record updated
- Check database: Trial record created (if trialing)
- Check Redis: Subscription cache synced

---

### ✅ Subscription Updated

**Scenario:** Subscription modified (plan change, cancellation, etc.)

**Test Steps:**
1. User upgrades/downgrades/cancels
2. Stripe updates subscription

**Expected Results:**
- [ ] `customer.subscription.updated` webhook received
- [ ] Database subscription record updated
- [ ] Subscription cache synced
- [ ] User cache cleared
- [ ] Trial status updated if applicable

**Verification:**
- Check database: Subscription record updated
- Check Redis: Cache synced
- Check logs: Update event processed

---

### ✅ Subscription Deleted

**Scenario:** Subscription cancelled/deleted

**Test Steps:**
1. User cancels subscription
2. Stripe deletes subscription

**Expected Results:**
- [ ] `customer.subscription.deleted` webhook received
- [ ] Database subscription status updated
- [ ] All caches cleared (subscription, limits, usage)
- [ ] User loses access

**Verification:**
- Check database: Status updated
- Check Redis: All caches cleared
- Check logs: Deletion event processed

---

### ✅ Invoice Payment Succeeded

**Scenario:** Invoice payment successful

**Test Steps:**
1. Billing period ends
2. Stripe charges payment method
3. Payment succeeds

**Expected Results:**
- [ ] `invoice.payment_succeeded` webhook received
- [ ] Usage quota record created for new period
- [ ] Usage counters reset
- [ ] Subscription cache synced
- [ ] Invoice cached (if implemented)

**Verification:**
- Check database: New `usageQuota` record
- Check database: Usage counters reset
- Check Redis: Cache updated

---

### ✅ Invoice Payment Failed

**Scenario:** Invoice payment fails

**Test Steps:**
1. Billing period ends
2. Stripe attempts to charge
3. Payment fails

**Expected Results:**
- [ ] `invoice.payment_failed` webhook received
- [ ] Subscription status updated to `past_due`
- [ ] Warning logged
- [ ] Email notification sent (if implemented)

**Verification:**
- Check database: Status updated
- Check logs: Payment failed event logged

---

### ✅ Trial Will End

**Scenario:** Trial ending in 3 days

**Test Steps:**
1. User has active trial
2. Trial end date approaches (3 days remaining)

**Expected Results:**
- [ ] `customer.subscription.trial_will_end` webhook received
- [ ] Email notification sent (if implemented)
- [ ] Warning logged

**Verification:**
- Check logs: Trial ending event logged
- Check email: Notification sent (if implemented)

---

### ✅ Dispute Created

**Scenario:** Customer disputes a charge

**Test Steps:**
1. User disputes a charge via bank
2. Stripe receives dispute

**Expected Results:**
- [ ] `charge.dispute.created` webhook received
- [ ] Dispute logged with details (ID, amount, reason)
- [ ] Warning logged
- [ ] Admin alert sent (if implemented)

**Verification:**
- Check logs: Dispute event logged
- Check Stripe Dashboard → Disputes

---

## Edge Cases & Error Handling

### ✅ Multiple Subscriptions (Prevent)

**Scenario:** User tries to have multiple active subscriptions

**Test Steps:**
1. User has active subscription
2. User tries to subscribe to another plan

**Expected Results:**
- [ ] Better Auth prevents duplicate subscriptions
- [ ] OR: Old subscription cancelled, new one created
- [ ] Only one active subscription exists
- [ ] Database has only one active subscription record

**Verification:**
- Check Stripe Dashboard → Only one active subscription
- Check database: Only one active subscription

---

### ✅ Expired Card During Active Subscription

**Scenario:** Payment method expires while subscription is active

**Test Steps:**
1. User has active subscription
2. Payment method expires
3. Next billing period arrives

**Expected Results:**
- [ ] Payment fails on next billing attempt
- [ ] `invoice.payment_failed` webhook received
- [ ] Subscription status changes to `past_due`
- [ ] User notified to update payment method
- [ ] User retains access during grace period

**Verification:**
- Check Stripe Dashboard → Subscription status
- Check database: Status updated
- Check UI: User sees payment update prompt

---

### ✅ Webhook Delivery Failure

**Scenario:** Webhook fails to deliver or process

**Test Steps:**
1. Stripe sends webhook
2. Webhook endpoint is down or returns error
3. Stripe retries webhook

**Expected Results:**
- [ ] Webhook retries handled correctly
- [ ] Idempotency prevents duplicate processing
- [ ] Error logged for monitoring
- [ ] Manual retry possible via Stripe Dashboard

**Verification:**
- Check Stripe Dashboard → Webhooks → Delivery logs
- Check logs: Webhook errors logged
- Check database: No duplicate records

---

### ✅ Concurrent Webhook Processing

**Scenario:** Multiple webhooks arrive simultaneously

**Test Steps:**
1. User upgrades subscription
2. Payment succeeds
3. Multiple webhooks fire simultaneously

**Expected Results:**
- [ ] Webhooks processed correctly (no race conditions)
- [ ] Database updates are atomic
- [ ] Cache updates are consistent
- [ ] No duplicate records created

**Verification:**
- Check database: No duplicate records
- Check Redis: Cache is consistent
- Check logs: All webhooks processed

---

### ✅ Stripe API Failure

**Scenario:** Stripe API is temporarily unavailable

**Test Steps:**
1. User tries to upgrade subscription
2. Stripe API returns 500 error

**Expected Results:**
- [ ] Error handled gracefully
- [ ] User sees friendly error message
- [ ] Retry mechanism implemented (if applicable)
- [ ] Error logged for monitoring

**Verification:**
- Check UI: Error message displayed
- Check logs: API error logged

---

### ✅ Database Connection Failure During Webhook

**Scenario:** Database is down when webhook arrives

**Test Steps:**
1. Webhook received
2. Database connection fails

**Expected Results:**
- [ ] Webhook returns 500 (so Stripe retries)
- [ ] Error logged
- [ ] Webhook retried when database recovers
- [ ] No data loss

**Verification:**
- Check Stripe Dashboard → Webhook retries
- Check logs: Database errors logged

---

### ✅ Redis Connection Failure

**Scenario:** Redis is unavailable

**Test Steps:**
1. User performs action requiring cache
2. Redis connection fails

**Expected Results:**
- [ ] System falls back to database queries
- [ ] No user-facing errors
- [ ] Performance may degrade but functionality works
- [ ] Error logged

**Verification:**
- Check logs: Redis errors logged
- Check functionality: System still works
- Check performance: May be slower

---

## Cache & Data Sync

### ✅ Subscription Cache Sync

**Scenario:** Subscription data synced to Redis

**Test Steps:**
1. Subscription created/updated
2. Cache sync function called

**Expected Results:**
- [ ] Subscription data cached in Redis (`stripe:subscription:{customerId}`)
- [ ] Cache has no TTL (webhook-driven updates)
- [ ] Cache includes: status, plan, periods, payment method
- [ ] Cache is JSON-serialized correctly

**Verification:**
- Check Redis: Cache key exists
- Check Redis: Data structure is correct
- Check Redis: No TTL set

---

### ✅ Cache Invalidation

**Scenario:** Subscription changes require cache invalidation

**Test Steps:**
1. Subscription updated
2. Cache invalidation triggered

**Expected Results:**
- [ ] Subscription cache cleared
- [ ] User limits cache cleared
- [ ] Usage cache cleared (if applicable)
- [ ] Fresh data fetched on next request

**Verification:**
- Check Redis: Cache keys deleted
- Check logs: Invalidation logged
- Check functionality: Fresh data loaded

---

### ✅ User-Customer Mapping

**Scenario:** Bidirectional mapping stored correctly

**Test Steps:**
1. Customer created
2. Mapping stored

**Expected Results:**
- [ ] `stripe:user:{userId}` → `customerId` stored
- [ ] `stripe:customer-to-user:{customerId}` → `userId` stored
- [ ] Both mappings exist and are consistent
- [ ] Fast lookups work in both directions

**Verification:**
- Check Redis: Both mapping keys exist
- Check functionality: Lookups work both ways

---

### ✅ Cache Miss Fallback

**Scenario:** Cache miss occurs

**Test Steps:**
1. Cache key doesn't exist
2. Data requested

**Expected Results:**
- [ ] System falls back to Stripe API
- [ ] Data fetched and cached
- [ ] No user-facing errors
- [ ] Performance acceptable

**Verification:**
- Check functionality: Data loaded correctly
- Check Redis: Cache populated after fetch
- Check performance: Acceptable latency

---

## Authorization & Security

### ✅ Subscription Authorization (User)

**Scenario:** User tries to manage subscription

**Test Steps:**
1. User logged in
2. User tries to upgrade/cancel subscription

**Expected Results:**
- [ ] `authorizeReference` hook checks user permissions
- [ ] User can manage their own subscription
- [ ] User cannot manage others' subscriptions
- [ ] Authorization check passes

**Verification:**
- Check functionality: User can manage own subscription
- Check security: User cannot access others' subscriptions

---

### ✅ Subscription Authorization (Organization)

**Scenario:** Organization member tries to manage subscription

**Test Steps:**
1. User is member of organization
2. User tries to upgrade/cancel organization subscription

**Expected Results:**
- [ ] Only `owner` or `admin` can manage subscription
- [ ] Regular members cannot manage subscription
- [ ] Authorization check enforces role requirements

**Verification:**
- Check functionality: Owner/admin can manage
- Check security: Regular members cannot manage

---

### ✅ Webhook Signature Verification

**Scenario:** Webhook received from Stripe

**Test Steps:**
1. Webhook arrives at endpoint
2. Signature verification performed

**Expected Results:**
- [ ] Webhook signature verified using `STRIPE_WEBHOOK_SECRET`
- [ ] Invalid signatures rejected
- [ ] Only verified webhooks processed
- [ ] Security maintained

**Verification:**
- Check logs: Signature verification logged
- Check security: Invalid webhooks rejected

---

### ✅ API Key Security

**Scenario:** Stripe API keys used securely

**Test Steps:**
1. Check environment variables
2. Verify API key usage

**Expected Results:**
- [ ] Secret key only used server-side
- [ ] Publishable key only used client-side
- [ ] Keys stored in environment variables
- [ ] No keys committed to git

**Verification:**
- Check code: No hardcoded keys
- Check env: Keys in environment variables
- Check git: No keys in repository

---

## Usage Tracking & Limits

### ✅ Usage Limit Enforcement

**Scenario:** User reaches usage limit

**Test Steps:**
1. User has active subscription or trial
2. User generates templates/images
3. User reaches limit

**Expected Results:**
- [ ] Usage tracked in Redis (real-time)
- [ ] Usage synced to database (async)
- [ ] Limit enforced at API level
- [ ] User sees "Limit reached" message
- [ ] Upgrade prompt shown

**Verification:**
- Check Redis: Usage counter accurate
- Check database: Usage synced
- Check API: Limit enforced
- Check UI: Upgrade prompt shown

---

### ✅ Usage Reset (New Billing Period)

**Scenario:** New billing period starts

**Test Steps:**
1. User has active subscription
2. Billing period ends
3. New period starts

**Expected Results:**
- [ ] `invoice.payment_succeeded` webhook received
- [ ] New `usageQuota` record created
- [ ] Usage counters reset to 0
- [ ] Old usage quota archived
- [ ] User can generate again

**Verification:**
- Check database: New usage quota record
- Check database: Counters reset
- Check functionality: User can generate

---

### ✅ Trial Usage Limits

**Scenario:** User on trial reaches trial limits

**Test Steps:**
1. User has active trial (5 templates, 5 images)
2. User generates 5 templates
3. User tries to generate 6th template

**Expected Results:**
- [ ] Trial limit enforced (5 templates)
- [ ] User cannot generate 6th template
- [ ] Upgrade prompt shown
- [ ] Trial status remains `active`

**Verification:**
- Check API: Limit enforced
- Check UI: Upgrade prompt shown
- Check database: Trial status unchanged

---

### ✅ Plan Limit Differences

**Scenario:** Different plans have different limits

**Test Steps:**
1. Test Starter plan (75 templates, 20 images)
2. Test Pro plan (200 templates, 100 images)
3. Test Scale plan (500 templates, 300 images)

**Expected Results:**
- [ ] Starter limits: 75 templates, 20 images
- [ ] Pro limits: 200 templates, 100 images
- [ ] Scale limits: 500 templates, 300 images
- [ ] Limits enforced correctly per plan

**Verification:**
- Check database: Limits match plan
- Check Redis: Limits cached correctly
- Check API: Limits enforced correctly

---

## Billing Portal & Invoices

### ✅ Billing Portal Access

**Scenario:** User accesses Stripe Billing Portal

**Test Steps:**
1. User navigates to billing settings
2. User clicks "Manage Billing"
3. Billing portal session created

**Expected Results:**
- [ ] Portal session created successfully
- [ ] User redirected to Stripe Billing Portal
- [ ] User can update payment method
- [ ] User can view invoices
- [ ] User can cancel subscription
- [ ] Return URL works correctly

**Verification:**
- Check functionality: Portal opens
- Check Stripe: Session created
- Check return: User returns to app

---

### ✅ Invoice Listing

**Scenario:** User views invoice history

**Test Steps:**
1. User navigates to billing settings
2. User views "Billing History" section

**Expected Results:**
- [ ] Invoices fetched from Stripe API
- [ ] Invoices cached (15 min TTL)
- [ ] Invoice list displayed correctly
- [ ] Invoice details accurate (amount, date, status)
- [ ] PDF download links work

**Verification:**
- Check UI: Invoices displayed
- Check data: Invoice details accurate
- Check functionality: PDF links work

---

### ✅ Invoice PDF Download

**Scenario:** User downloads invoice PDF

**Test Steps:**
1. User views invoice list
2. User clicks "Download PDF"

**Expected Results:**
- [ ] PDF URL from Stripe works
- [ ] PDF downloads successfully
- [ ] PDF contains correct invoice data

**Verification:**
- Check functionality: PDF downloads
- Check content: Invoice data correct

---

## Performance & Reliability

### ✅ Webhook Processing Speed

**Scenario:** Webhook processing performance

**Test Steps:**
1. Webhook received
2. Processing time measured

**Expected Results:**
- [ ] Webhook processed in < 2 seconds
- [ ] Database updates complete quickly
- [ ] Cache updates complete quickly
- [ ] No timeouts

**Verification:**
- Check logs: Processing time logged
- Check performance: < 2 seconds average

---

### ✅ Cache Hit Rate

**Scenario:** Cache performance

**Test Steps:**
1. Monitor cache hits vs misses
2. Measure cache performance

**Expected Results:**
- [ ] Cache hit rate > 95%
- [ ] Cache reads < 10ms
- [ ] Cache writes < 50ms
- [ ] Redis connection stable

**Verification:**
- Check monitoring: Cache hit rate
- Check performance: Read/write times
- Check stability: Connection uptime

---

### ✅ Database Query Performance

**Scenario:** Database query performance

**Test Steps:**
1. Monitor database queries
2. Measure query performance

**Expected Results:**
- [ ] Subscription queries < 100ms
- [ ] Usage queries < 50ms
- [ ] Indexes used correctly
- [ ] No N+1 queries

**Verification:**
- Check performance: Query times
- Check indexes: Properly used
- Check queries: No N+1 issues

---

### ✅ API Response Times

**Scenario:** API endpoint performance

**Test Steps:**
1. Test subscription endpoints
2. Measure response times

**Expected Results:**
- [ ] `getCurrent` endpoint < 200ms
- [ ] `getInvoices` endpoint < 300ms
- [ ] `createPortalSession` endpoint < 500ms
- [ ] Overall API performance acceptable

**Verification:**
- Check performance: Response times
- Check monitoring: API metrics

---

## Production Readiness Checklist

### Pre-Launch Verification

- [ ] All test scenarios above completed
- [ ] Stripe webhook endpoint configured in production
- [ ] Webhook secret set in production environment
- [ ] Stripe API keys (live) configured
- [ ] Price IDs (live) configured for all plans
- [ ] Redis configured and accessible
- [ ] Database migrations applied
- [ ] Error logging configured (Sentry, etc.)
- [ ] Monitoring configured (metrics, alerts)
- [ ] Backup strategy in place
- [ ] Documentation updated

### Monitoring Setup

- [ ] Webhook delivery monitoring
- [ ] Payment failure alerts
- [ ] Subscription cancellation alerts
- [ ] API error rate monitoring
- [ ] Cache performance monitoring
- [ ] Database performance monitoring

### Security Checklist

- [ ] Webhook signature verification enabled
- [ ] API keys secured (environment variables)
- [ ] HTTPS enforced
- [ ] Rate limiting configured
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified

### Documentation

- [ ] API documentation updated
- [ ] Webhook documentation updated
- [ ] Error handling documented
- [ ] Troubleshooting guide created
- [ ] Runbook for common issues

---

## Test Data & Tools

### Stripe Test Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient Funds: 4000 0000 0000 9995
Expired Card: 4000 0000 0000 0069
```

### Stripe CLI Commands

```bash
# Forward webhooks to local server
stripe listen --forward-to localhost:3001/api/webhooks/stripe

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
```

### Database Queries (for verification)

```sql
-- Check active subscriptions
SELECT * FROM subscription WHERE status = 'active';

-- Check trials
SELECT * FROM trial WHERE status = 'active';

-- Check usage quotas
SELECT * FROM usage_quota ORDER BY period_start DESC LIMIT 10;
```

---

## Notes

- **Test Environment:** Use Stripe test mode for all scenarios
- **Production Testing:** Use small test transactions before full launch
- **Monitoring:** Set up alerts for webhook failures and payment issues
- **Documentation:** Keep this document updated as system evolves

---

**Last Updated:** December 2025  
**Next Review:** Before production launch


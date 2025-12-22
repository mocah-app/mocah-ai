# Week 4: Payment System Implementation Plan

**Milestone:** Stripe Integration, Subscription Management, Usage Tracking & Feature Gating

**Duration:** Days 16-20 (5 days)

**Deliverable:** Production-ready payment system with tier-based feature gating

---

## Current State Assessment

### ✅ Already Implemented

1. **Better Auth Stripe Plugin** (`packages/auth/src/index.ts`)
   - Stripe client configured
   - Webhook secret configured
   - `createCustomerOnSignUp: true`
   - Authorization middleware for owner/admin roles
   - Subscription plans exist; update them to **Starter ($29, 75 templates, 20 images), Pro ($69, 200 templates, 100 images), Scale ($129, 500 templates, 300 images)** with unlimited workspaces and a **7-day card-required trial capped at 5 templates + 5 images (Qwen-only)**

2. **Database Schema**
   - `Subscription` model (managed by Better Auth)
   - `Plan` model with feature flags and limits
   - `UsageQuota` model for tracking usage
   - Proper indexing on key fields

3. **Subscription Plans** (`packages/auth/src/subscription-plans.ts`)
   - Target structure: Starter (75 templates, 20 images), Pro (200 templates, 100 images), Scale (500 templates, 300 images)
   - All plans: unlimited brands/workspaces, all export formats, full editor
   - Trial: 7 days, card required, 5 template + 5 image cap, Qwen-only, no template deletion, no Nano Banana Pro access

4. **Infrastructure**
   - Redis for caching and rate limiting
   - Image rate limiting already implemented (`packages/api/src/lib/rate-limit.ts`)

### 🚧 Needs Implementation

1. Subscription management tRPC router
2. Usage tracking system (check, increment, reset)
3. Feature gating middleware for all generation endpoints
4. Billing/subscription UI components
5. Pricing page with plan comparison
6. Usage dashboard and meters
7. Upgrade/downgrade flows
8. Cancellation flow with feedback
9. Payment history and invoice display
10. Failed payment recovery flow

---

## Implementation Breakdown

## Day 16: Core Usage Tracking System

### Task 16.1: Usage Service (Backend)

**File:** `packages/api/src/lib/usage-tracking.ts`

Create comprehensive usage tracking service:

```typescript
interface UsageService {
  // Check if user has quota remaining
  checkUsageLimit(
    organizationId: string,
    type: 'templateGeneration' | 'imageGeneration',
    amount?: number
  ): Promise<{ allowed: boolean; remaining: number; limit: number }>;

  // Increment usage counter
  incrementUsage(
    organizationId: string,
    type: 'templateGeneration' | 'imageGeneration',
    amount?: number
  ): Promise<void>;

  // Get current usage stats
  getUsageStats(
    organizationId: string,
    period: 'monthly' | 'daily'
  ): Promise<UsageStats>;

  // Reset usage for new period (called by cron)
  resetMonthlyUsage(organizationId: string): Promise<void>;

  // Get plan limits for organization
  getPlanLimits(organizationId: string): Promise<PlanLimits>;
}
```

**Implementation Requirements:**

1. **Query subscription from Better Auth:**
   - Fetch active subscription by `referenceId` (organizationId)
   - Determine current plan and limits: Starter (75 templates, 20 images), Pro (200 templates, 100 images), Scale (500 templates, 300 images)
   - Trial: 7 days, card required, 5 template + 5 image cap (Qwen-only), no template deletion, no Nano Banana Pro

2. **Query/Create usage quota:**
   - Find or create current month's `UsageQuota` record
   - Use `periodStart` and `periodEnd` for monthly tracking
   - Auto-create if first usage of the month
   - Cache trial usage in Redis (`trial:${userId}`) with 8-day TTL and sync to DB

3. **Check limits:**
   - Compare current usage vs plan limits (no unlimited tiers)
   - Enforce trial limits (5 templates, 5 images) before plan limits
   - Return clear error messages when limit exceeded (include upgrade link)

4. **Increment usage:**
   - Atomic increment of usage counters
   - Transaction safety for concurrent requests
   - Log usage events for analytics

5. **Caching:**
   - Cache plan limits in Redis (5 min TTL)
   - Cache current usage (1 min TTL)
   - Invalidate on plan changes

6. **Trial abuse prevention:**
   - One trial per Stripe customer/card (90-day cooldown for retries)
   - Require email verification before trial start
   - Block template deletion during trial to preserve counts

**Key Functions:**

```typescript
// Get subscription and plan info
async function getOrganizationPlan(orgId: string): Promise<{
  plan: 'trial' | 'starter' | 'pro' | 'scale';
  limits: PlanLimits;
  subscription?: Subscription;
}>

// Get or create current period quota
async function getCurrentQuota(orgId: string): Promise<UsageQuota>

// Check if action is allowed
async function canGenerateTemplate(orgId: string): Promise<boolean>
async function canGenerateImage(orgId: string, count?: number): Promise<boolean>
async function canCreateWorkspace(orgId: string): Promise<boolean>
```

**Error Handling:**

```typescript
class UsageLimitError extends Error {
  code: 'QUOTA_EXCEEDED' | 'PLAN_LIMIT_REACHED';
  remaining: number;
  limit: number;
  resetDate: Date;
  upgradeUrl: string;
}
```

---

### Task 16.2: Feature Gating Middleware

**File:** `packages/api/src/middleware.ts` (extend existing)

Add usage-aware middleware:

```typescript
// Require template generation quota
export const requireTemplateGenerationQuota = middleware(async ({ ctx, next }) => {
  const { activeOrganization } = ctx;

  const usage = await usageService.checkUsageLimit(
    activeOrganization.id,
    'templateGeneration'
  );

  if (!usage.allowed) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Generation limit reached. ${usage.remaining}/${usage.limit} remaining this month.`,
      cause: {
        upgradeRequired: true,
        currentPlan: ctx.subscription?.plan || 'trial',
        resetDate: usage.resetDate,
      },
    });
  }

  return next({
    ctx: {
      ...ctx,
      usage,
    },
  });
});

// Similar for image generation
export const requireImageGenerationQuota = middleware(/* ... */);
export const requireWorkspaceQuota = middleware(/* ... */);
```

**Apply to Procedures:**

```typescript
// In template router
generateTemplate: protectedProcedure
  .use(requireTextGenerationQuota) // 👈 Add middleware
  .input(/* ... */)
  .mutation(async ({ ctx, input }) => {
    // Generate template...

    // Increment usage on success
    await usageService.incrementUsage(
      ctx.activeOrganization.id,
      'textGeneration'
    );

    return template;
  });
```

---

### Task 16.3: Subscription tRPC Router

**File:** `packages/api/src/routers/subscription.ts`

Create subscription management endpoints:

```typescript
export const subscriptionRouter = router({
  // Get current subscription and usage
  getCurrent: organizationProcedure
    .query(async ({ ctx }) => {
      const subscription = await getOrganizationSubscription(ctx.activeOrganization.id);
      const usage = await usageService.getUsageStats(ctx.activeOrganization.id, 'monthly');
      const plans = await getAvailablePlans();

      return { subscription, usage, plans };
    }),

  // Get available plans
  getPlans: publicProcedure
    .query(async () => {
      return await prisma.plan.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
    }),

  // Create Stripe checkout session
  createCheckoutSession: organizationProcedure
    .use(adminProcedure) // Only owner/admin can manage billing
    .input(z.object({
      planName: z.enum(['starter', 'pro', 'scale']),
      interval: z.enum(['month', 'year']).default('month'),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Create Stripe checkout session
      // Return session URL for redirect
    }),

  // Create customer portal session
  createPortalSession: organizationProcedure
    .use(adminProcedure)
    .input(z.object({
      returnUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get Stripe customer ID from subscription
      const subscription = await getOrganizationSubscription(ctx.activeOrganization.id);

      if (!subscription?.stripeCustomerId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No active subscription found',
        });
      }

      // Create Stripe portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: input.returnUrl,
      });

      return { url: session.url };
    }),

  // Get usage history
  getUsageHistory: organizationProcedure
    .input(z.object({
      months: z.number().min(1).max(12).default(6),
    }))
    .query(async ({ ctx, input }) => {
      const history = await prisma.usageQuota.findMany({
        where: {
          organizationId: ctx.activeOrganization.id,
          periodStart: {
            gte: new Date(Date.now() - input.months * 30 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { periodStart: 'desc' },
      });

      return history;
    }),

  // Get invoices from Stripe
  getInvoices: organizationProcedure
    .use(adminProcedure)
    .query(async ({ ctx }) => {
      const subscription = await getOrganizationSubscription(ctx.activeOrganization.id);

      if (!subscription?.stripeCustomerId) {
        return [];
      }

      const invoices = await stripe.invoices.list({
        customer: subscription.stripeCustomerId,
        limit: 12,
      });

      return invoices.data.map(invoice => ({
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        amountPaid: invoice.amount_paid / 100,
        currency: invoice.currency,
        created: new Date(invoice.created * 1000),
        invoicePdf: invoice.invoice_pdf,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
      }));
    }),

  // Cancel subscription with feedback
  cancelSubscription: organizationProcedure
    .use(adminProcedure)
    .input(z.object({
      reason: z.string().optional(),
      feedback: z.string().optional(),
      cancelImmediately: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const subscription = await getOrganizationSubscription(ctx.activeOrganization.id);

      if (!subscription?.stripeSubscriptionId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No active subscription to cancel',
        });
      }

      // Log cancellation feedback for analytics
      await prisma.cancellationFeedback.create({
        data: {
          organizationId: ctx.activeOrganization.id,
          subscriptionId: subscription.id,
          reason: input.reason,
          feedback: input.feedback,
          canceledBy: ctx.session.user.id,
        },
      });

      // Cancel in Stripe
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: !input.cancelImmediately,
      });

      if (input.cancelImmediately) {
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      }

      return { success: true };
    }),
});
```

**Register in main router:**

```typescript
// packages/api/src/routers/index.ts
import { subscriptionRouter } from './subscription';

export const appRouter = router({
  // ... existing routers
  subscription: subscriptionRouter,
});
```

---

## Day 17: Frontend Billing UI

### Task 17.1: Pricing Page

**File:** `apps/web/src/app/(public)/pricing/page.tsx`

Build comprehensive pricing page:

**Components:**

1. **PricingHero**
   - Main headline: "Choose Your Plan"
   - Subheadline: "7-day free trial with card verification"
   - Monthly/Annual toggle (show 20% savings for annual)

2. **PricingCards** (grid of 3 plans)
   - Starter, Pro (Popular badge), Scale
   - Price display with period
   - "Current Plan" badge if logged in
   - Feature list with checkmarks
   - CTA button ("Start Trial" / "Upgrade" / "Current Plan")

3. **PricingFeatureComparison** (table below cards)
   - Detailed feature comparison
   - All plans side-by-side
   - Expandable sections

4. **PricingFAQ**
   - Common billing questions
   - Trial period info
   - Cancellation policy
   - Refund policy

**Plan Feature Lists:**

```typescript
const plans = [
  {
    name: 'Starter',
    price: 29,
    interval: 'month',
    annualPrice: 24, // ~20% discount
    description: 'For freelancers and small teams',
    features: [
      '75 complete templates/month',
      '20 AI images/month (Qwen)',
      'Unlimited brands/workspaces',
      'All 40+ templates',
      'All export formats (HTML, Mailchimp, Klaviyo, HubSpot)',
      'Full editor + brand kits',
      'Email support (24-48hr)',
      'Version history (last 10 versions)',
      'Spam score checker',
    ],
    cta: 'Start 7-day Trial',
    popular: false,
  },
  {
    name: 'Pro',
    price: 69,
    interval: 'month',
    annualPrice: 55,
    description: 'For growing agencies and teams',
    features: [
      '200 complete templates/month',
      '100 AI images/month (Qwen + Nano Banana Pro)',
      'Unlimited brands/workspaces',
      'Premium image generation (Nano Banana Pro)',
      'Priority processing queue',
      'Early access to new features',
      'All export formats',
      'Full editor + brand kits',
      'Version history (last 10 versions)',
    ],
    cta: 'Start 7-day Trial',
    popular: true,
  },
  {
    name: 'Scale',
    price: 129,
    interval: 'month',
    annualPrice: 103,
    description: 'For established agencies and enterprise teams',
    features: [
      '500 complete templates/month',
      '300 AI images/month (Qwen + Nano Banana Pro)',
      'Unlimited brands/workspaces',
      'Dedicated account manager',
      'Custom integration support',
      'SLA guarantee (99.9% uptime)',
      'Bulk operations',
      'Custom onboarding session (30 min)',
      'API access (phase 2)',
    ],
    cta: 'Start 7-day Trial',
    popular: false,
  },
];
```

**Interactions:**

- If not logged in: CTA → Sign up flow
- If logged in: CTA → Checkout or portal
- Monthly/Annual toggle updates prices
- Smooth animations on hover/toggle

---

### Task 17.2: Billing Dashboard

**File:** `apps/web/src/app/app/settings/billing/page.tsx`

Create billing management dashboard:

**Sections:**

1. **Current Plan Card**
   - Plan name and price
   - Billing period (monthly/annual)
   - Next billing date
   - "Change Plan" button
   - "Cancel Subscription" button (if paid plan)

2. **Usage Meter**
   - Progress bars for:
     - Template generations (X / Y used this month)
     - Image generations (X / Y used this month)
     - Workspaces (X / Y active)
   - Reset date: "Resets on [date]"
   - Visual indicators:
     - Green: < 70%
     - Yellow: 70-90%
     - Red: > 90%
   - "Upgrade" prompt when approaching limit

3. **Payment Method**
   - "Manage plan" button → Stripe portal


4. **Billing History**
   - Table of invoices:
     - Date
     - Amount
     - Status (Paid/Failed)
     - Invoice number
     - Download PDF button
   - Pagination (show last 12)

5. **Danger Zone**

**Usage Meter Component:**

```typescript
function UsageMeter({
  label,
  current,
  limit,
  unit
}: UsageMeterProps) {
  const percentage = limit === -1 ? 0 : (current / limit) * 100;
  const isUnlimited = limit === -1;

  return (
    <div>
      <div className="flex justify-between mb-2">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {isUnlimited
            ? `${current} ${unit} (Unlimited)`
            : `${current} / ${limit} ${unit}`
          }
        </span>
      </div>
      {!isUnlimited && (
        <Progress
          value={percentage}
          className={cn(
            percentage > 90 && "bg-red-500",
            percentage > 70 && percentage <= 90 && "bg-yellow-500",
            percentage <= 70 && "bg-green-500"
          )}
        />
      )}
      {percentage > 90 && !isUnlimited && (
        <p className="text-sm text-red-600 mt-1">
          Approaching limit. <Link href="/pricing">Upgrade now</Link>
        </p>
      )}
    </div>
  );
}
```

---

### Task 17.3: Upgrade Flow Components

**File:** `apps/web/src/components/billing/UpgradeModal.tsx`

Modal shown when user hits quota limit:

```typescript
function UpgradeModal({
  open,
  onClose,
  limitType,
  currentPlan
}: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upgrade Your Plan</DialogTitle>
          <DialogDescription>
            You've reached your {limitType} limit. Upgrade to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {upgradePlans.map(plan => (
            <PlanCard
              key={plan.name}
              plan={plan}
              recommended={plan.name === 'pro'}
              onSelect={() => handleUpgrade(plan.name)}
            />
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Trigger Locations:**

1. Template generation button
2. Image generation button
3. Create workspace button
4. Anywhere quota is checked

**Hook for Upgrade Modal:**

```typescript
function useUpgradeModal() {
  const [open, setOpen] = useState(false);
  const [limitType, setLimitType] = useState<'text' | 'image' | 'workspace'>();

  const triggerUpgrade = (type: typeof limitType) => {
    setLimitType(type);
    setOpen(true);
  };

  return { open, limitType, triggerUpgrade, setOpen };
}
```

---

### Task 17.4: Checkout Flow

**File:** `apps/web/src/app/app/settings/billing/checkout/page.tsx`

Stripe Checkout integration:

```typescript
async function handleCheckout(planName: string, interval: 'month' | 'year') {
  try {
    const { url } = await trpc.subscription.createCheckoutSession.mutate({
      planName,
      interval,
      successUrl: `${window.location.origin}/app/settings/billing?success=true`,
      cancelUrl: `${window.location.origin}/pricing`,
    });

    // Redirect to Stripe Checkout
    window.location.href = url;
  } catch (error) {
    toast.error('Failed to start checkout');
  }
}
```

**Success Page:**

Query param handler at `/app/settings/billing?success=true`:
- Show success toast
- Confetti animation (optional)
- Refresh subscription data
- Show "Welcome to [Plan]" message

---

## Day 18: Feature Gating & Usage Enforcement

### Task 18.1: Apply Feature Gates to All Generation Endpoints

**Files to Update:**

1. **Template Router** (`packages/api/src/routers/template.ts`)

```typescript
// Add usage middleware to generation endpoints
generateTemplate: protectedProcedure
  .use(organizationProcedure)
  .use(requireTemplateGenerationQuota) // 👈 Add
  .input(/* ... */)
  .mutation(async ({ ctx, input }) => {
    // ... existing code ...

    // Increment usage on success
    await usageService.incrementUsage(
      ctx.activeOrganization.id,
      'templateGeneration'
    );

    return result;
  }),

regenerateElement: protectedProcedure
  .use(organizationProcedure)
  .use(requireTemplateGenerationQuota) // 👈 Add
  .input(/* ... */)
  .mutation(async ({ ctx, input }) => {
    // ... existing code ...

    await usageService.incrementUsage(
      ctx.activeOrganization.id,
      'templateGeneration'
    );

    return result;
  }),
```

2. **Image Asset Router** (`packages/api/src/routers/image-asset.ts`)

```typescript
generateImage: protectedProcedure
  .use(organizationProcedure)
  .use(requireImageGenerationQuota) // 👈 Add
  .input(/* ... */)
  .mutation(async ({ ctx, input }) => {
    // ... existing code ...

    await usageService.incrementUsage(
      ctx.activeOrganization.id,
      'imageGeneration',
      1 // Count each image
    );

    return result;
  }),
```

3. **Organization Router** (`packages/api/src/routers/organization.ts`)

```typescript
create: protectedProcedure
  .use(requireWorkspaceQuota) // 👈 Add
  .input(/* ... */)
  .mutation(async ({ ctx, input }) => {
    // ... existing code ...

    // Workspace count checked in middleware

    return organization;
  }),
```

---

### Task 18.2: Export Formats

**All paid plans and trials include every export format (HTML, Mailchimp, Klaviyo, HubSpot).** No gating required; ensure existing export endpoints remain accessible, guarded only by authentication and ownership checks.

---

### Task 18.3: Usage Tracking on Frontend

**File:** `apps/web/src/hooks/useUsageTracking.ts`

React hook for usage awareness:

```typescript
export function useUsageTracking() {
  const { data: subscription } = trpc.subscription.getCurrent.useQuery(
    undefined,
    { refetchInterval: 60000 } // Refresh every minute
  );

  const checkQuota = (type: 'text' | 'image') => {
    if (!subscription) return false;

    const { usage, limits } = subscription;

    if (type === 'text') {
      if (limits.textGenerations === -1) return true; // Unlimited
      return usage.textGenerations < limits.textGenerations;
    }

    if (type === 'image') {
      if (limits.imageGenerations === -1) return true;
      return usage.imageGenerations < limits.imageGenerations;
    }

    return false;
  };

  const getUsagePercentage = (type: 'text' | 'image') => {
    if (!subscription) return 0;

    const { usage, limits } = subscription;

    if (type === 'text') {
      if (limits.textGenerations === -1) return 0;
      return (usage.textGenerations / limits.textGenerations) * 100;
    }

    if (type === 'image') {
      if (limits.imageGenerations === -1) return 0;
      return (usage.imageGenerations / limits.imageGenerations) * 100;
    }

    return 0;
  };

  return {
    subscription,
    usage: subscription?.usage,
    limits: subscription?.limits,
    checkQuota,
    getUsagePercentage,
    isUnlimited: (type: 'text' | 'image') =>
      subscription?.limits[`${type}Generations`] === -1,
  };
}
```

**Usage in Components:**

```typescript
function TemplateGenerator() {
  const { checkQuota, getUsagePercentage } = useUsageTracking();
  const { triggerUpgrade } = useUpgradeModal();

  const handleGenerate = async () => {
    if (!checkQuota('text')) {
      triggerUpgrade('text');
      return;
    }

    // Proceed with generation
    await generateTemplate();
  };

  const textUsagePercent = getUsagePercentage('text');

  return (
    <div>
      <Button onClick={handleGenerate}>
        Generate Template
      </Button>

      {textUsagePercent > 80 && (
        <Alert>
          <AlertDescription>
            You're approaching your generation limit ({textUsagePercent}% used)
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

---

### Task 18.4: Trial Restrictions

- Block template deletion during trial to preserve the 5-template cap.
- Enforce Qwen-only image generation during trial (no Nano Banana Pro access).
- One trial per card/Stripe customer (90-day cooldown).

```typescript
async function deleteTemplate(userId: string, templateId: string) {
  const trial = await getActiveTrial(userId);

  if (trial?.status === 'active') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message:
        'Templates cannot be deleted during trial. Upgrade to manage templates freely.',
      cause: { upgradeRequired: true },
    });
  }

  return prisma.template.delete({ where: { id: templateId } });
}
```

---

## Day 19: Testing & Bug Fixes

### Task 19.1: End-to-End Testing Checklist

**Stripe Checkout / Trial Flow:**

- [ ] Card-required 7-day trial starts from pricing page for Starter/Pro/Scale
- [ ] Redirects to Stripe Checkout with correct plan & price IDs
- [ ] Trial auto-converts on day 8; immediate upgrade flow works during trial
- [ ] Webhook updates subscription status in database (trial → active)
- [ ] Usage counters reflect new limits after conversion (carry over trial usage)

**Usage Tracking:**

- [ ] Template generation increments counter
- [ ] Image generation increments counter
- [ ] Counters persist across sessions
- [ ] Trial limits enforced at 5 templates / 5 images (Qwen-only)
- [ ] Plan limits enforced: Starter 75/20, Pro 200/100, Scale 500/300
- [ ] Reaching limit shows upgrade modal
- [ ] Error messages are user-friendly
- [ ] Reset at end of billing period works

**Billing Dashboard:**

- [ ] Current plan displays correctly
- [ ] Usage meters show accurate data
- [ ] Invoice history loads from Stripe
- [ ] Download PDF button works
- [ ] "Manage Payment" opens Stripe portal
- [ ] Cancel flow works correctly

**Feature Gating:**

- [ ] Trial users blocked from Nano Banana Pro images
- [ ] Trial users blocked after 5 templates / 5 images (no deletion bypass)
- [ ] Paid users can generate according to limits
- [ ] Workspace creation respects limits

**Edge Cases:**

- [ ] Trial end auto-converts to selected plan or cancels if user opts out
- [ ] Failed payment handling
- [ ] Subscription canceled but still in grace period
- [ ] Multiple concurrent generations don't bypass limits
- [ ] Annual vs monthly billing works
- [ ] Proration on upgrades/downgrades

---

### Task 19.2: Webhook Testing

**File:** Test Stripe webhooks locally - prefer to use Ngrok, already setup

**Setup Stripe CLI:**

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/api/auth/stripe/webhook
```

**Test Events:**

```bash
# Test subscription created
stripe trigger customer.subscription.created

# Test successful payment
stripe trigger invoice.payment_succeeded

# Test failed payment
stripe trigger invoice.payment_failed

# Test subscription canceled
stripe trigger customer.subscription.deleted
```

**Verify:**

- Database updates correctly
- Usage limits reset on new period
- Email notifications sent (if configured)
- Edge cases handled gracefully

---

### Task 19.3: Error Handling & User Messages

**Update Error Messages:**

1. **Quota Exceeded:**
   ```typescript
   {
     title: "Generation Limit Reached",
     description: "You've used all 5 trial generations (templates/images). Upgrade to continue.",
     action: "View Plans",
   }
   ```

2. **Payment Failed:**
   ```typescript
   {
     title: "Payment Failed",
     description: "Your subscription payment failed. Please update your payment method.",
     action: "Update Payment Method",
   }
   ```

3. **Trial Expired:**
   ```typescript
   {
     title: "Trial Ended",
     description: "Your 7-day trial has ended. Subscribe to keep generating templates and images.",
     action: "Subscribe Now",
   }
   ```

**Add to Toast Notifications:**

- Clear call-to-action buttons
- Link to relevant pages
- Helpful next steps

---

## Day 20: Polish & Performance

### Task 20.1: Performance Optimizations

**Caching Strategy:**

```typescript
// Cache plan limits (rarely change)
const planLimits = await cache.get(
  `plan:${orgId}:limits`,
  () => getPlanLimits(orgId),
  { ttl: 5 * 60 } // 5 minutes
);

// Cache usage (changes frequently, shorter TTL)
const usage = await cache.get(
  `usage:${orgId}:${month}`,
  () => getCurrentUsage(orgId),
  { ttl: 60 } // 1 minute
);
```

**Database Indexes:**

Verify indexes exist:

```sql
CREATE INDEX idx_subscription_reference ON subscription(referenceId);
CREATE INDEX idx_usage_quota_org_period ON usage_quota(organizationId, periodStart, periodEnd);
CREATE INDEX idx_subscription_status ON subscription(status);
```

**Reduce API Calls:**

- Batch usage checks when possible
- Use React Query caching effectively
- Prefetch subscription data on login

---

### Task 20.2: UI Polish

**Animations:**

- Smooth transitions on upgrade modal
- Progress bar animations
- Success confetti (optional)
- Loading states during checkout

**Responsive Design:**

- Test pricing page on mobile
- Billing dashboard mobile-friendly
- Usage meters stack on small screens
- Touch-friendly buttons

**Accessibility:**

- ARIA labels on usage meters
- Keyboard navigation in upgrade modal
- Screen reader announcements for quota status
- Focus management in modals

---

### Task 20.3: Documentation

**User Documentation:**

Create guide at `apps/web/src/app/(public)/help/billing/page.tsx`:

- How to upgrade/downgrade
- How to cancel subscription
- Billing FAQ
- Usage tracking explained
- Refund policy

**Developer Documentation:**

Update `dev-docs/billing-system.md`:

- Architecture overview
- Usage tracking flow diagram
- Webhook handling process
- Testing procedures
- Common issues and solutions

---

## Environment Variables Checklist

Ensure these are set in production:

```bash
# Stripe (from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs (from Stripe Products)
STRIPE_PRICE_ID_STARTER=price_...       # $29/mo
STRIPE_PRICE_ID_STARTER_ANNUAL=price_...# ~$24/mo effective
STRIPE_PRICE_ID_PRO=price_...           # $69/mo
STRIPE_PRICE_ID_PRO_ANNUAL=price_...    # ~$55/mo effective
STRIPE_PRICE_ID_SCALE=price_...         # $129/mo
STRIPE_PRICE_ID_SCALE_ANNUAL=price_...  # ~$103/mo effective

# Public keys (for frontend)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## Deployment Checklist

Before marking Week 4 complete:

### Backend:

- [ ] All tRPC routes tested
- [ ] Middleware applied to protected routes
- [ ] Webhook endpoint deployed and verified
- [ ] Usage tracking working in production
- [ ] Database migrations run
- [ ] Redis cache working
- [ ] Error logging configured

### Frontend:

- [ ] Pricing page deployed
- [ ] Billing dashboard accessible
- [ ] Upgrade flows working
- [ ] Mobile responsive
- [ ] Error messages user-friendly
- [ ] Loading states present

### Stripe Configuration:

- [ ] Products created in Stripe
- [ ] Price IDs configured
- [ ] Webhook endpoint added to Stripe dashboard
- [ ] Test mode transactions successful
- [ ] Live mode enabled
- [ ] Tax settings configured (if applicable)

### Database:

- [ ] Plan table seeded with correct data
- [ ] Indexes created
- [ ] Backup strategy in place
- [ ] Usage quota cleanup cron job scheduled

### Monitoring:

- [ ] Stripe webhook delivery monitored
- [ ] Failed payment alerts configured
- [ ] Usage spike alerts set up
- [ ] Error tracking (Sentry/similar) enabled

---

## Success Criteria

Week 4 is complete when:

1. ✅ All three plans available with credit card–required trial
2. ✅ Trial limits: 5 templates, 5 images (enforced)
3. ✅ Template deletion blocked during trial
4. ✅ No Nano Banana Pro access during trial (Qwen-only)
5. ✅ One trial per credit card enforced (Stripe customer ID)
6. ✅ Immediate upgrade flow functional during trial
7. ✅ Redis caching performant (<10ms reads)
8. ✅ Account-level usage tracking accurate (plan limits: 75/20, 200/100, 500/300)
9. ✅ Unlimited workspaces on all plans
10. ✅ No watermarks on any plan
11. ✅ Pricing page clear and compelling (with annual savings)
12. ✅ Stripe webhooks updating DB correctly

---

## Post-Week 4 Enhancements (Optional)

Consider for future iterations:

- Usage analytics dashboard for admins
- Custom enterprise pricing
- Bulk discount for agencies
- Referral program integration
- Usage alerts via email
- Annual billing discount automation
- Team member seat management
- Invoice customization (logo, branding)

---

## Resources

**Stripe Documentation:**
- [Checkout Session](https://stripe.com/docs/api/checkout/sessions)
- [Customer Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)
- [Webhooks](https://stripe.com/docs/webhooks)
- [Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)

**Better Auth Stripe Plugin:**
- [Better Auth Stripe Docs](https://better-auth.com/docs/plugins/stripe)

**Testing:**
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)

---

## Questions for Client

Before starting implementation:

1. **Pricing Confirmation:** Are the plan prices ($29/$69/$129) final?
2. **Trial Period:** Confirm 7-day free trial with credit card required and 5 template + 5 image cap?
3. **Annual Discount:** Confirm annual pricing ($24/$55/$103) and display messaging?
4. **Refund Policy:** What's the refund policy (if any)?
5. **Tax Handling:** Should Stripe Tax be enabled?
6. **Invoice Branding:** Should invoices show custom branding?
7. **Grace Period:** How long after failed payment before downgrade?
8. **Cancellation:** Cancel immediately or at period end by default?

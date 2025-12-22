# Simplified Pricing Strategy & Trial System

## Executive Summary

**Strategic Focus:** Simple, sustainable pricing with unified trial experience. Quality AI models for all. Usage-based abuse prevention. Account-level tracking with Redis caching for performance.

---

## Final Pricing Structure

### Starter - $29/month
**Target:** Freelancers, solo marketers, small business owners

**Limits:**
- **75 complete templates/month**
- **20 AI images/month** (Qwen Image only)
- **Unlimited brands/workspaces**

**Features:**
- All 40+ pre-designed templates
- Full brand kit system per workspace
- All export formats (HTML, Mailchimp, Klaviyo, HubSpot)
- Quality AI template generation (Gemini 2.5 Flash-Lite)
- Full template editor (AI + manual)
- Mobile responsive templates
- Version history (last 10 versions)
- Email support (24-48hr response)
- Spam score checker

**Monthly Cost:**
- Templates: 75 × $0.007 = $0.53
- Images: 20 × $0.02 = $0.40
- **Total:** $0.93/month
- **Margin:** 96.8% ($28.07)

---

### Pro - $69/month ⭐ MOST POPULAR
**Target:** Marketing agencies, growing teams, multi-brand businesses

**Limits:**
- **200 complete templates/month**
- **100 AI images/month** (Qwen + Nano Banana Pro access)
- **Unlimited brands/workspaces**

**Features:**
- Everything in Starter, plus:
- **Premium image generation** (Nano Banana Pro at $0.15/image)
- Priority processing queue
- Early access to new features

**Monthly Cost:**
- Templates: 200 × $0.007 = $1.40
- Images (mixed): (50 × $0.02) + (50 × $0.15) = $8.50
- **Total:** $9.90/month (assuming 50/50 split)
- **Margin:** 85.7% ($59.10)

---

### Scale - $129/month
**Target:** Established agencies, enterprise marketing teams

**Limits:**
- **500 complete templates/month**
- **300 AI images/month** (Qwen + Nano Banana Pro access)
- **Unlimited brands/workspaces**

**Features:**
- Everything in Pro, plus:
- Dedicated account manager
- Custom integration support
- SLA guarantee (99.9% uptime)
- Bulk operations (duplicate 10+ templates)
- Custom onboarding session (30 min)
- API access (coming Phase 2)

**Monthly Cost:**
- Templates: 500 × $0.007 = $3.50
- Images (mixed): (150 × $0.02) + (150 × $0.15) = $25.50
- **Total:** $29.00/month (assuming 50/50 split)
- **Margin:** 77.5% ($100.00)

---

## Unified Trial System

### 7-Day Free Trial (All Plans)

**Credit Card Requirement:**
- **REQUIRED** for all plans
- Enables immediate upgrade during trial
- Prevents trial abuse through payment validation
- $0 authorization hold (validates card without charging)

**Trial Limits (Same for All Plans):**
- **5 complete templates maximum**
- **5 AI images maximum** (Qwen Image only, no Nano Banana Pro)
- Unlimited brands/workspaces
- Full editor access
- Full export access
- All features except premium image generation

**Trial Restrictions:**
- Templates **cannot be deleted** during trial (preserves count)
- No access to Nano Banana Pro ($0.15 images)
- Only Qwen Image available ($0.02/image)

**Auto-Conversion:**
- Trial automatically converts to selected plan after 7 days
- User is charged on day 8
- Can cancel anytime during trial (no charge)

**Immediate Upgrade Option:**
- User can click "Upgrade Now" during trial
- Stripe processes immediate subscription start
- Remaining trial days credited/forfeited
- Full plan limits activate immediately

---

## Trial Cost Analysis

**Per Trial User Cost:**
- 5 templates: 5 × $0.007 = $0.035
- 5 images: 5 × $0.02 = $0.10
- **Total per trial:** $0.135

**With 15% Conversion Rate:**
- 100 trials = $13.50 cost
- 15 convert to Starter ($29) = $435 revenue
- CAC per converted user: $0.90
- **Highly sustainable** ✅

---

## Trial Abuse Prevention (Simplified)

### Redis-Based Usage Tracking

**Strategy:** Track usage in Redis for real-time performance, sync to database periodically.

**Implementation Flow:**

```
User starts trial
  ↓
Create trial record in database
  ↓
Load trial data into Redis
  Key: `trial:${userId}`
  Value: {
    templatesUsed: 0,
    imagesUsed: 0,
    startedAt: timestamp,
    expiresAt: timestamp,
    plan: 'starter' | 'pro' | 'scale'
  }
  TTL: 8 days (7-day trial + 1 day buffer)
  ↓
On each generation:
  1. Check Redis counter
  2. If under limit → increment Redis
  3. Async sync to database every 5 generations or 5 minutes
  4. If limit reached → block with upgrade prompt
  ↓
On trial end/conversion:
  1. Final sync Redis → Database
  2. Delete Redis key
  3. Create subscription record
```

**Abuse Prevention Mechanisms:**

1. **Credit Card Validation**
   - $0 authorization hold
   - Validates real payment method
   - Most effective fraud prevention

2. **Usage Limits**
   - 5 templates max (cannot delete to reset)
   - 5 images max
   - Hard cap enforced in Redis

3. **One Trial Per Credit Card**
   - Track by Stripe customer ID
   - Block if card already used for trial
   - Exception: Allow retry after 90 days

4. **Email Verification**
   - Must verify email before trial starts
   - Prevents disposable email abuse

**Database Schema:**

```typescript
Trial {
  id: string
  userId: string
  email: string
  plan: 'starter' | 'pro' | 'scale'
  stripeCustomerId: string // For card tracking
  startedAt: DateTime
  expiresAt: DateTime
  templatesUsed: number
  imagesUsed: number
  converted: boolean
  convertedAt: DateTime?
  canceledAt: DateTime?
}
```

**Redis Structure:**

```typescript
// Key: trial:${userId}
{
  templatesUsed: number,
  imagesUsed: number,
  templatesLimit: 5,
  imagesLimit: 5,
  startedAt: timestamp,
  expiresAt: timestamp,
  plan: string,
  stripeCustomerId: string
}

// TTL: 8 days (auto-cleanup)
```

---

## Account-Level Usage Tracking (Post-Trial)

### Production Usage Tracking

**Redis + Database Hybrid:**

```typescript
// Redis Key: usage:${userId}:${month}
{
  templatesUsed: number,
  templatesLimit: number, // 75, 200, or 500
  imagesUsed: number,
  imagesLimit: number, // 20, 100, or 300
  periodStart: timestamp,
  periodEnd: timestamp,
  lastSyncedAt: timestamp
}

// TTL: 35 days (month + buffer)
```

**Sync Strategy:**

1. **On Generation:**
   - Increment Redis counter
   - Async sync to DB every 10 generations or every 10 minutes
   - Ensures Redis and DB stay consistent

2. **On Cache Miss:**
   - Load from database
   - Populate Redis
   - Continue with cached data

3. **On Period Reset:**
   - Delete Redis key
   - Create new database record for new period
   - Lazy load on first generation

**Database Schema:**

```typescript
UsageQuota {
  id: string
  userId: string // Account-level tracking
  plan: 'starter' | 'pro' | 'scale'
  periodStart: DateTime
  periodEnd: DateTime
  templatesUsed: number
  templatesLimit: number
  imagesUsed: number
  imagesLimit: number
  updatedAt: DateTime
}
```

---

## Immediate Upgrade During Trial

### Stripe Implementation

**Yes, immediate upgrade is possible with Stripe:**

```typescript
// User clicks "Upgrade Now" during trial

async function upgradeImmediately(userId: string, plan: string) {
  // 1. Get trial info
  const trial = await getTrialInfo(userId);
  
  // 2. Cancel trial timer (don't auto-convert)
  await cancelTrialTimer(userId);
  
  // 3. Create Stripe subscription immediately
  const subscription = await stripe.subscriptions.create({
    customer: trial.stripeCustomerId,
    items: [{ price: PLAN_PRICE_IDS[plan] }],
    // No trial period - charge immediately
    trial_end: 'now',
  });
  
  // 4. Update database
  await prisma.trial.update({
    where: { userId },
    data: {
      converted: true,
      convertedAt: new Date(),
    },
  });
  
  await prisma.subscription.create({
    data: {
      userId,
      plan,
      status: 'active',
      stripeSubscriptionId: subscription.id,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });
  
  // 5. Update Redis with new limits
  await redis.set(`usage:${userId}:${currentMonth}`, {
    templatesUsed: trial.templatesUsed, // Carry over trial usage
    templatesLimit: PLAN_LIMITS[plan].templates,
    imagesUsed: trial.imagesUsed,
    imagesLimit: PLAN_LIMITS[plan].images,
    periodStart: Date.now(),
    periodEnd: endOfMonth(),
  });
  
  // 6. Delete trial Redis key
  await redis.del(`trial:${userId}`);
  
  return { success: true, subscription };
}
```

**User Experience:**

```
Trial Dashboard:
━━━━━━━━━━━━━━━━━━━━━━━━━━
Templates: 3 / 5 used
Images: 2 / 5 used

⚠️ 2 templates remaining in trial

[Upgrade Now] ← Click to start plan immediately
[Continue Trial] ← Finish trial, auto-upgrade on day 8
```

**Benefits of Immediate Upgrade:**
- Captures high-intent users
- Removes friction when user hits limit
- Immediate revenue recognition
- User gets full limits right away

---

## Pricing Page Comparison

| Feature | Starter | Pro | Scale |
|---------|---------|-----|-------|
| **Price** | $29/mo | $69/mo | $129/mo |
| **Annual Price** | $24/mo | $55/mo | $103/mo |
| **Save Annually** | $60/year | $168/year | $312/year |
| | | | |
| **Templates/month** | 75 | 200 | 500 |
| **AI Images/month** | 20 | 100 | 300 |
| **Image Quality** | Standard (Qwen) | Standard + Premium (Nano Banana Pro) | Standard + Premium |
| **Brands/Workspaces** | Unlimited | Unlimited | Unlimited |
| | | | |
| **Core Features** | | | |
| All 40+ templates | ✓ | ✓ | ✓ |
| Full brand kit system | ✓ | ✓ | ✓ |
| All export formats | ✓ | ✓ | ✓ |
| Quality AI generation | ✓ | ✓ | ✓ |
| Full editor access | ✓ | ✓ | ✓ |
| Version history (10) | ✓ | ✓ | ✓ |
| Spam score checker | ✓ | ✓ | ✓ |
| Mobile responsive | ✓ | ✓ | ✓ |
| | | | |
| **Premium Features** | | | |
| Premium images (Nano Banana Pro) | ✗ | ✓ | ✓ |
| Priority processing | ✗ | ✓ | ✓ |
| Early feature access | ✗ | ✓ | ✓ |
| | | | |
| **Scale Features** | | | |
| Dedicated account manager | ✗ | ✗ | ✓ |
| Custom integrations | ✗ | ✗ | ✓ |
| SLA guarantee (99.9%) | ✗ | ✗ | ✓ |
| Bulk operations | ✗ | ✗ | ✓ |
| Onboarding call (30min) | ✗ | ✗ | ✓ |
| API access (Phase 2) | ✗ | ✗ | ✓ |
| | | | |
| **Support** | Email (24-48hr) | Email (24-48hr) | Priority (12-24hr) + Manager |
| | | | |
| **Free Trial** | 7 days | 7 days | 7 days |
| **Trial Limits** | 5 templates, 5 images | 5 templates, 5 images | 5 templates, 5 images |

---

## Key Differentiators by Plan

### Starter - "Start Creating"
✓ Unlimited brands  
✓ 75 templates per month  
✓ Standard image quality (Qwen)  
✓ All core features included  

**Best for:** Freelancers, small businesses, solopreneurs

---

### Pro - "Premium Quality" ⭐
✓ Everything in Starter  
✓ 200 templates per month  
✓ **Premium AI images** (Nano Banana Pro)  
✓ Priority processing  
✓ 100 images per month  

**Best for:** Agencies, multi-brand businesses, power users

**Key Upgrade Reason:** Access to Nano Banana Pro ($0.15/image) for:
- Better text rendering in images
- Advanced AI reasoning for image context
- Higher quality, more refined outputs

---

### Scale - "Enterprise Excellence"
✓ Everything in Pro  
✓ 500 templates per month  
✓ 300 premium images  
✓ **Dedicated account manager**  
✓ **Custom integrations**  
✓ 99.9% SLA guarantee  
✓ Bulk operations  
✓ 30-min onboarding  

**Best for:** Established agencies, enterprise teams, high-volume users

---

## Usage Enforcement

### During Trial

**Template Generation Check:**

```typescript
async function canGenerateTemplateTrial(userId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  message?: string;
}> {
  // Check Redis first
  const trial = await redis.get(`trial:${userId}`);
  
  if (!trial) {
    // Fallback to database
    const dbTrial = await prisma.trial.findUnique({ where: { userId } });
    if (!dbTrial) {
      return { allowed: false, used: 0, limit: 0, message: 'No active trial' };
    }
    
    // Repopulate Redis
    await redis.setex(`trial:${userId}`, 691200, { // 8 days TTL
      templatesUsed: dbTrial.templatesUsed,
      imagesUsed: dbTrial.imagesUsed,
      templatesLimit: 5,
      imagesLimit: 5,
      // ... other fields
    });
    
    trial = dbTrial;
  }
  
  if (trial.templatesUsed >= 5) {
    return {
      allowed: false,
      used: 5,
      limit: 5,
      message: 'Trial limit reached. Upgrade to continue creating.'
    };
  }
  
  return { allowed: true, used: trial.templatesUsed, limit: 5 };
}

async function incrementTrialUsage(
  userId: string, 
  type: 'template' | 'image'
): Promise<void> {
  const field = type === 'template' ? 'templatesUsed' : 'imagesUsed';
  
  // Increment in Redis
  await redis.hincrby(`trial:${userId}`, field, 1);
  
  // Async sync to database (don't wait)
  syncTrialToDatabase(userId).catch(err => 
    console.error('Trial sync error:', err)
  );
}
```

**Image Generation Check:**

```typescript
async function canGenerateImageTrial(userId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  canUseNanoBanana: false; // Always false in trial
}> {
  const trial = await redis.get(`trial:${userId}`);
  
  if (!trial || trial.imagesUsed >= 5) {
    return {
      allowed: false,
      used: trial?.imagesUsed || 5,
      limit: 5,
      canUseNanoBanana: false
    };
  }
  
  return {
    allowed: true,
    used: trial.imagesUsed,
    limit: 5,
    canUseNanoBanana: false // No premium during trial
  };
}
```

---

### Post-Trial (Paid Plans)

**Template Generation Check:**

```typescript
async function canGenerateTemplate(userId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
}> {
  const month = getCurrentMonth();
  const cacheKey = `usage:${userId}:${month}`;
  
  // Try Redis first
  let usage = await redis.get(cacheKey);
  
  if (!usage) {
    // Cache miss - load from database
    usage = await prisma.usageQuota.findFirst({
      where: {
        userId,
        periodStart: { lte: new Date() },
        periodEnd: { gte: new Date() },
      },
    });
    
    if (!usage) {
      // Create new period
      const subscription = await getSubscription(userId);
      usage = await prisma.usageQuota.create({
        data: {
          userId,
          plan: subscription.plan,
          periodStart: startOfMonth(),
          periodEnd: endOfMonth(),
          templatesUsed: 0,
          templatesLimit: PLAN_LIMITS[subscription.plan].templates,
          imagesUsed: 0,
          imagesLimit: PLAN_LIMITS[subscription.plan].images,
        },
      });
    }
    
    // Populate Redis
    await redis.setex(cacheKey, 2592000, usage); // 30-day TTL
  }
  
  return {
    allowed: usage.templatesUsed < usage.templatesLimit,
    used: usage.templatesUsed,
    limit: usage.templatesLimit,
  };
}
```

**Image Model Selection:**

```typescript
async function selectImageModel(userId: string): Promise<{
  model: 'qwen' | 'nano-banana-pro';
  cost: number;
}> {
  const subscription = await getSubscription(userId);
  
  // Only Pro and Scale have access to Nano Banana Pro
  if (subscription.plan === 'pro' || subscription.plan === 'scale') {
    return {
      model: 'nano-banana-pro',
      cost: 0.15
    };
  }
  
  return {
    model: 'qwen',
    cost: 0.02
  };
}
```

---

## Template Deletion Rules

### During Trial

**Templates CANNOT be deleted:**

```typescript
async function deleteTemplate(userId: string, templateId: string) {
  const trial = await getTrial(userId);
  
  if (trial && trial.status === 'active') {
    throw new Error(
      'Templates cannot be deleted during trial. ' +
      'This preserves your trial generation count. ' +
      'Upgrade to manage templates freely.'
    );
  }
  
  // Proceed with deletion for paid users
  await prisma.template.delete({ where: { id: templateId } });
}
```

**User Message:**

```
⚠️ Templates cannot be deleted during trial

This prevents gaming the system by deleting and 
regenerating to bypass the 5-template limit.

Once you upgrade, you can manage templates freely.

[Upgrade Now]
```

---

### Post-Trial (Paid Plans)

**No deletion restrictions:**

Users can freely:
- Delete templates
- Duplicate templates
- Archive templates
- Bulk delete

---

## Revenue Projections (Updated)

### Conservative Estimates (100 Paid Users)

**User Distribution:**
- 50 Starter: 50 × $29 = $1,450/month
- 35 Pro: 35 × $69 = $2,415/month
- 15 Scale: 15 × $129 = $1,935/month

**Monthly Revenue:** $5,800

**Monthly Costs:**
- Starter API: 50 × $0.93 = $46.50
- Pro API: 35 × $9.90 = $346.50 (with Nano Banana Pro usage)
- Scale API: 15 × $29.00 = $435.00
- Infrastructure: $200
- **Total:** $1,028

**Net Profit:** $4,772/month (82.3% margin)

**Trial Costs (300 trials/month @ 15% conversion):**
- 300 × $0.135 = $40.50
- Converts to 45 paid users
- CAC per converted user: $0.90

**Annual Projections:**
- Revenue: $69,600
- Profit: $57,264 (82.3% margin)

---

### Growth Scenario (1,000 Paid Users)

**User Distribution:**
- 500 Starter: $14,500/month
- 350 Pro: $24,150/month
- 150 Scale: $19,350/month

**Monthly Revenue:** $58,000

**Monthly Costs:**
- Starter API: 500 × $0.93 = $465
- Pro API: 350 × $9.90 = $3,465
- Scale API: 150 × $29 = $4,350
- Infrastructure: $1,000
- Support: $2,000
- **Total:** $11,280

**Net Profit:** $46,720/month (80.6% margin)

**Annual Revenue:** $696,000  
**Annual Profit:** $560,640

---

## Implementation Checklist

### Week 4 Priority Tasks

**Day 16-17: Trial System**
- [ ] Redis trial tracking implementation
- [ ] Credit card requirement for all trials
- [ ] 5 template + 5 image limits
- [ ] Block template deletion during trial
- [ ] Block Nano Banana Pro during trial
- [ ] One trial per credit card enforcement
- [ ] Immediate upgrade flow (Stripe subscription start)

**Day 18: Usage Tracking**
- [ ] Account-level Redis + DB hybrid
- [ ] Template generation checks
- [ ] Image generation checks
- [ ] Model selection based on plan (Qwen vs Nano Banana Pro)
- [ ] Sync strategy (Redis → DB every 10 gen or 10 min)

**Day 19: UI & Flows**
- [ ] Unified trial signup (same limits for all plans)
- [ ] Trial dashboard showing 5/5 limits
- [ ] Upgrade modal when limit reached
- [ ] "Upgrade Now" button for immediate conversion
- [ ] Billing dashboard
- [ ] Pricing page (simplified comparison)

**Day 20: Testing**
- [ ] Trial limits enforcement
- [ ] Template deletion blocked during trial
- [ ] Immediate upgrade flow
- [ ] Redis cache performance
- [ ] Stripe webhook handling
- [ ] Usage counter accuracy

---

## Success Criteria

Week 4 complete when:

1. ✅ All three plans available with credit card trial
2. ✅ Trial limits: 5 templates, 5 images (enforced)
3. ✅ Template deletion blocked during trial
4. ✅ No Nano Banana Pro access during trial
5. ✅ One trial per credit card working
6. ✅ Immediate upgrade flow functional
7. ✅ Redis caching performant (<10ms reads)
8. ✅ Account-level usage tracking accurate
9. ✅ Unlimited workspaces on all plans
10. ✅ No watermarks on any plan
11. ✅ Pricing page clear and compelling
12. ✅ Stripe webhooks updating DB correctly

---

## Post-Launch Monitoring

### Key Metrics to Track

**Trial Performance:**
- Trial start rate
- Trial completion rate (used 5/5 templates)
- Trial-to-paid conversion (target: 15-20%)
- Average trial usage (templates/images)

**Revenue Metrics:**
- MRR growth
- Churn rate (target: <5%)
- ARPU per plan
- Plan distribution (Starter vs Pro vs Scale)

**Usage Patterns:**
- Average templates per user per month
- Average images per user per month
- Nano Banana Pro usage (Pro/Scale plans)
- Underutilizers (<20% usage)
- Power users (>80% usage)

**Technical Health:**
- Redis cache hit rate (target: >95%)
- Redis → DB sync lag
- API cost per user
- Support ticket volume

---

## Final Recommendation

**This simplified model is:**
- ✅ Easy to implement (unified trial, account-level tracking)
- ✅ High performance (Redis caching, minimal DB queries)
- ✅ Financially sustainable (80-96% margins)
- ✅ Abuse-resistant (credit card validation, usage limits)
- ✅ User-friendly (unlimited workspaces, clear limits)
- ✅ Competitive (premium positioning, quality focus)

**Proceed with this streamlined approach. It balances simplicity, performance, and profitability.**

---

*Simplified Pricing Strategy v3.0*  
*Updated: December 2025*
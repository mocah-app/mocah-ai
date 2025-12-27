# Payment System Documentation Hub

> **Quick Start:** Begin with [week4-implementation-phases.md](./week4-implementation-phases.md) for the step-by-step implementation guide.

---

## 📚 Documentation Overview

This directory contains comprehensive documentation for implementing the Mocah payment system with Stripe, usage tracking, and subscription management.

### Primary Documents

1. **[week4-implementation-phases.md](./week4-implementation-phases.md)** ⭐ **START HERE**
   - **Purpose:** Day-by-day implementation guide with detailed checklists
   - **Use Case:** Your primary roadmap during implementation
   - **Format:** Phase-by-phase tasks with checkboxes
   - **Audience:** Developers implementing the system

2. **[week4-payment-new-plan.md](./week4-payment-new-plan.md)**
   - **Purpose:** Simplified pricing strategy and business model
   - **Key Content:**
     - Final pricing structure (Starter $29, Pro $69, Scale $129)
     - Unified 7-day trial system (card required, 5 templates + 5 images)
     - Usage tracking strategy (Redis + Database hybrid)
     - Trial abuse prevention mechanisms
     - Revenue projections and cost analysis
   - **Use Case:** Understanding the "why" behind technical decisions
   - **Audience:** Product, business, and technical stakeholders

3. **[week4-payment-implementation-plan.md](./week4-payment-implementation-plan.md)**
   - **Purpose:** Technical implementation specifications
   - **Key Content:**
     - Detailed code examples and interfaces
     - Database schema requirements
     - API endpoint specifications
     - Frontend component requirements
     - Testing procedures
   - **Use Case:** Reference during coding for specific implementations
   - **Audience:** Developers writing code

---

## 🎯 How to Use These Docs

### If You're Starting Implementation

1. Read [week4-payment-new-plan.md](./week4-payment-new-plan.md) first (30 min)
   - Understand the pricing structure
   - Learn the trial system rules
   - Review abuse prevention strategy

2. Open [week4-implementation-phases.md](./week4-implementation-phases.md)
   - Start with Pre-Implementation Checklist
   - Work through phases sequentially
   - Check off tasks as you complete them

3. Reference [week4-payment-implementation-plan.md](./week4-payment-implementation-plan.md) as needed
   - Copy code examples
   - Verify technical specifications
   - Review testing procedures

### If You're Planning/Reviewing

1. Start with [week4-payment-new-plan.md](./week4-payment-new-plan.md)
   - Understand business model
   - Review pricing rationale
   - Check revenue projections

2. Review [week4-implementation-phases.md](./week4-implementation-phases.md)
   - Assess timeline (5 days)
   - Review scope and deliverables
   - Identify dependencies

3. Dive into [week4-payment-implementation-plan.md](./week4-payment-implementation-plan.md)
   - Technical architecture review
   - Infrastructure requirements
   - Integration points

---

## 🗓️ Implementation Timeline

```
Day 16: Backend Foundation
├─ Database schema updates
├─ Usage tracking service
├─ Feature gating middleware
└─ Subscription router (Part 1)

Day 17 Morning: Stripe Integration
├─ Checkout session creation
├─ Trial system implementation
├─ Webhook configuration
└─ Immediate upgrade flow

Day 17 Afternoon: Feature Gates
├─ Template router updates
├─ Image router updates
└─ Trial restrictions

Day 18: Frontend UI
├─ Pricing page
├─ Billing dashboard
├─ Upgrade modals
└─ Usage tracking hooks

Day 19-20: Testing & Polish
├─ End-to-end testing
├─ Performance optimization
├─ Security audit
├─ Mobile & accessibility testing
└─ Deployment
```

---

## 🎨 Pricing Structure (Quick Reference)

### Starter - $29/month
- 75 complete templates/month
- 20 AI images/month (Qwen only)
- Unlimited brands/workspaces
- All export formats

### Pro - $69/month ⭐ MOST POPULAR
- 200 complete templates/month
- 100 AI images/month (Qwen + Nano Banana Pro)
- Unlimited brands/workspaces
- Premium image generation
- Priority processing

### Scale - $129/month
- 500 complete templates/month
- 300 AI images/month (Qwen + Nano Banana Pro)
- Unlimited brands/workspaces
- Dedicated account manager
- Custom integrations
- SLA guarantee

### Trial System (All Plans)
- **Duration:** 7 days
- **Credit Card:** Required (validates with $0 hold)
- **Limits:** 5 templates + 5 images maximum
- **Images:** Qwen only (no Nano Banana Pro)
- **Restrictions:** Cannot delete templates during trial
- **Conversion:** Auto-converts on day 8 or immediate upgrade available

---

## 🔧 Technical Architecture

### Core Components

1. **Usage Tracking Service** (`packages/api/src/lib/usage-tracking.ts`)
   - Redis-backed real-time tracking
   - Async sync to PostgreSQL
   - Trial and plan-based limits

2. **Subscription Router** (`packages/api/src/routers/subscription.ts`)
   - Stripe checkout session creation
   - Trial management
   - Subscription lifecycle
   - Usage queries

3. **Feature Gating Middleware** (`packages/api/src/middleware.ts`)
   - Template generation quotas
   - Image generation quotas
   - Trial restrictions

4. **Frontend Components**
   - Pricing page with 3 plans
   - Billing dashboard with usage meters
   - Upgrade modals
   - Trial status indicators

### Data Flow

```
User generates template/image
         ↓
Middleware checks usage limit
    ↓ (Redis)
Allowed? → Proceed
         ↓
Generate content
         ↓
Increment usage counter (Redis)
         ↓
Async sync to database (every 10 gen or 10 min)
```

---

## ✅ Success Criteria

Implementation is complete when:

- [ ] All three plans available with credit card trial
- [ ] Trial limits (5 templates, 5 images) enforced
- [ ] Template deletion blocked during trial
- [ ] Qwen-only images during trial
- [ ] One trial per credit card enforced
- [ ] Immediate upgrade flow functional
- [ ] Redis caching < 10ms reads
- [ ] Account-level usage tracking accurate
- [ ] Unlimited workspaces on all plans
- [ ] No watermarks on any plan
- [ ] Pricing page responsive and accessible
- [ ] Stripe webhooks updating database correctly
- [ ] Mobile responsive across all screens
- [ ] WCAG AA accessibility compliance
- [ ] Production deployment successful

---

## 🚀 Quick Links

### External Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Better Auth Stripe Plugin](https://better-auth.com/docs/plugins/stripe)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)

### Internal Resources

- [Core Project Documentation](./core-project-doc.md)
- [Authentication Setup](./authentication-setup.md)
- [Better Auth Organization](./better-auth-organization.md)

---

## 📝 Environment Variables Required

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Price IDs
STRIPE_PRICE_ID_STARTER_MONTHLY=price_...
STRIPE_PRICE_ID_STARTER_ANNUAL=price_...
STRIPE_PRICE_ID_PRO_MONTHLY=price_...
STRIPE_PRICE_ID_PRO_ANNUAL=price_...
STRIPE_PRICE_ID_SCALE_MONTHLY=price_...
STRIPE_PRICE_ID_SCALE_ANNUAL=price_...

# Redis (for usage tracking cache)
REDIS_URL=redis://...
```

---

## 🆘 Getting Help

### Common Issues

1. **Webhook not receiving events**
   - See troubleshooting section in [week4-implementation-phases.md](./week4-implementation-phases.md#common-issues--solutions)

2. **Usage counter not updating**
   - Check Redis connection
   - Verify sync logic
   - Review logs for errors

3. **Trial limits not enforcing**
   - Verify middleware applied
   - Check Redis cache
   - Review trial creation logic

### Support Contacts

- **Technical Questions:** Refer to code comments and inline documentation
- **Business Questions:** Refer to [week4-payment-new-plan.md](./week4-payment-new-plan.md)
- **Stripe Issues:** Stripe Dashboard → Support

---

## 📊 Monitoring & Metrics

### Key Metrics to Track

- Trial sign-ups per day
- Trial → Paid conversion rate (target: 15-20%)
- Churn rate (target: < 5%)
- MRR (Monthly Recurring Revenue)
- Average usage per plan
- Redis cache hit rate (target: > 95%)
- API response times
- Webhook delivery rate (target: > 99%)

### Tools

- Stripe Dashboard (payments, subscriptions)
- Redis CLI (cache monitoring)
- Application monitoring (Sentry/Vercel Analytics)
- Database monitoring (Prisma Studio)

---

## 🔄 Maintenance

### Monthly Tasks

- Review usage patterns
- Analyze conversion rates
- Check for API cost optimization opportunities
- Review and respond to user feedback
- Update pricing if needed

### Quarterly Tasks

- Security audit
- Performance optimization review
- Documentation updates
- Feature enhancement planning

---

## 📄 Document Versions

| Document | Version | Last Updated |
|----------|---------|--------------|
| week4-implementation-phases.md | 1.0 | December 2025 |
| week4-payment-new-plan.md | 3.0 | December 2025 |
| week4-payment-implementation-plan.md | 2.0 | December 2025 |
| PAYMENT-SYSTEM-README.md | 1.0 | December 2025 |

---

**Ready to start?** → Open [week4-implementation-phases.md](./week4-implementation-phases.md) and begin with Phase 1! 🚀


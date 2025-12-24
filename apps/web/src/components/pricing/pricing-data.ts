// ============================================================================
// Pricing Plan Configuration
// ============================================================================

export interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  popular?: boolean;
  templatesLimit: number;
  imagesLimit: number;
  features: PlanFeature[];
  cta: string;
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for freelancers and solo creators",
    monthlyPrice: 29,
    annualPrice: 24,
    templatesLimit: 75,
    imagesLimit: 20,
    features: [
      { text: "Unlimited brands & workspaces", included: true },
      { text: "Pre-designed templates", included: true },
      { text: "Brand kit system", included: true },
      { text: "All export formats", included: true },
      { text: "AI template generation", included: true },
    ],
    cta: "Start Free Trial",
  },
  {
    id: "pro",
    name: "Pro",
    description: "For agencies and growing teams",
    monthlyPrice: 69,
    annualPrice: 55,
    popular: true,
    templatesLimit: 200,
    imagesLimit: 100,
    features: [
      { text: "Unlimited brands & workspaces", included: true },
      { text: "Pre-designed templates", included: true },
      { text: "Brand kit system", included: true },
      { text: "All export formats", included: true },
      { text: "AI template generation", included: true },
      { text: "Premium image models", included: true },
    ],
    cta: "Start Free Trial",
  },
  {
    id: "scale",
    name: "Scale",
    description: "For established agencies and enterprises",
    monthlyPrice: 129,
    annualPrice: 103,
    templatesLimit: 500,
    imagesLimit: 300,
    features: [
      { text: "Unlimited brands & workspaces", included: true },
      { text: "Pre-designed templates", included: true },
      { text: "Brand kit system", included: true },
      { text: "All export formats", included: true },
      { text: "AI template generation", included: true },
      { text: "Premium image models", included: true },
      { text: "Priority support", included: true },
    ],
    cta: "Start Free Trial",
  },
];

// ============================================================================
// FAQ Data
// ============================================================================

export interface FAQItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "How does the 7-day free trial work?",
    answer:
      "Start your trial with any plan. You'll have 7 days to explore with 5 templates and 5 images included. We require a card for verification, but you won't be charged until day 8. Cancel anytime during the trial.",
  },
  {
    question: "Can I change plans later?",
    answer:
      "Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll get immediate access to higher limits. When downgrading, changes take effect at the start of your next billing cycle.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit and debit cards including Visa, Mastercard, American Express, and Discover. All payments are processed securely through Stripe.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Absolutely. You can cancel your subscription at any time from your billing settings. You'll retain access until the end of your current billing period. No hidden fees or penalties.",
  },
  {
    question: "What happens to my templates if I cancel?",
    answer:
      "Your templates remain accessible for 30 days after cancellation. During this time, you can export them. After 30 days, they're archived but can be restored if you resubscribe within 90 days.",
  },
  {
    question: "What's the difference between standard and premium images?",
    answer:
      "Standard images use our efficient Qwen model, great for most use cases. Premium images (Pro & Scale) use advanced models like Nano Banana Pro for higher quality, better text rendering, and more refined outputs.",
  },
  {
    question: "Do unused generations roll over?",
    answer:
      "No, generation limits reset each billing cycle. This keeps our pricing sustainable and ensures fair resource allocation for all users.",
  },
  {
    question: "Is there a discount for annual billing?",
    answer:
      "Yes! You save 20% when you choose annual billing. That's like getting over 2 months free compared to monthly billing.",
  },
];

// ============================================================================
// Feature Comparison Table Data
// ============================================================================

export interface ComparisonRow {
  feature: string;
  starter: string | boolean;
  pro: string | boolean;
  scale: string | boolean;
  category?: string;
}

export const COMPARISON_DATA: ComparisonRow[] = [
  // Limits
  { feature: "Templates per month", starter: "75", pro: "200", scale: "500", category: "Limits" },
  { feature: "AI images per month", starter: "20", pro: "100", scale: "300", category: "Limits" },
  { feature: "Brands & workspaces", starter: "Unlimited", pro: "Unlimited", scale: "Unlimited", category: "Limits" },
  
  // Core Features
  { feature: "Pre-designed templates", starter: "40+", pro: "40+", scale: "40+", category: "Core Features" },
  { feature: "Brand kit system", starter: true, pro: true, scale: true, category: "Core Features" },
  { feature: "All export formats", starter: true, pro: true, scale: true, category: "Core Features" },
  { feature: "AI template generation", starter: true, pro: true, scale: true, category: "Core Features" },
  { feature: "Full template editor", starter: true, pro: true, scale: true, category: "Core Features" },
  { feature: "Version history", starter: "10 versions", pro: "10 versions", scale: "10 versions", category: "Core Features" },
  { feature: "Spam score checker", starter: true, pro: true, scale: true, category: "Core Features" },
  
  // Image Generation
  { feature: "Standard images (Qwen)", starter: true, pro: true, scale: true, category: "Image Generation" },
  { feature: "Premium images (Nano Banana Pro)", starter: false, pro: true, scale: true, category: "Image Generation" },
  
  // Premium Features
  { feature: "Priority processing", starter: false, pro: true, scale: true, category: "Premium Features" },
  { feature: "Early feature access", starter: false, pro: true, scale: true, category: "Premium Features" },
  
  // Support
  { feature: "Email support", starter: "24-48hr", pro: "24-48hr", scale: "24-48hr", category: "Support" },
];


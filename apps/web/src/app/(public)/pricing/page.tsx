"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useOptionalAuth } from "@/lib/use-auth";
import { ArrowRight } from "lucide-react";

import { PricingCard } from "@/components/pricing/pricing-card";
import { PricingToggle } from "@/components/pricing/pricing-toggle";
import { PricingFAQ } from "@/components/pricing/pricing-faq";
import { FeatureComparison } from "@/components/pricing/feature-comparison";
import { PLANS } from "@/components/pricing/pricing-data";

// ============================================================================
// Page Component
// ============================================================================

export default function PricingPage() {
  const router = useRouter();
  const { session, isLoading: isAuthLoading } = useOptionalAuth();
  const [isAnnual, setIsAnnual] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Get current subscription if logged in
  const { data: subscriptionData } = trpc.subscription.getCurrent.useQuery(
    undefined,
    {
      enabled: !!session?.user,
      refetchOnWindowFocus: false,
    }
  );

  // Handle plan selection using Better Auth's subscription.upgrade()
  const handleSelectPlan = async (planId: string) => {
    // If not logged in, redirect to login
    // The subscription check will happen automatically in /app after login
    if (!session?.user) {
      router.push("/login");
      return;
    }

    // If logged in, use Better Auth subscription.upgrade()
    setLoadingPlan(planId);
    
    try {
      // If user has an existing subscription, pass subscriptionId to upgrade instead of creating new one
      const existingSubscription = subscriptionData?.subscription;
      const upgradeParams: Parameters<typeof authClient.subscription.upgrade>[0] = {
        plan: planId,
        annual: isAnnual,
        successUrl: `${window.location.origin}/app?checkout=success`,
        cancelUrl: `${window.location.origin}/pricing`,
      };

      // Include subscriptionId if user has an active/trialing subscription to avoid duplicate creation
      if (existingSubscription?.stripeSubscriptionId && 
          (existingSubscription.status === "active" || existingSubscription.status === "trialing")) {
        upgradeParams.subscriptionId = existingSubscription.stripeSubscriptionId;
      }

      const result = await authClient.subscription.upgrade(upgradeParams);

      if (result.error) {
        toast.error(`Failed to start checkout: ${result.error.message}`);
        setLoadingPlan(null);
      }
      // If successful, Better Auth redirects to Stripe Checkout automatically
    } catch (error) {
      toast.error(`Failed to start checkout: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLoadingPlan(null);
    }
  };

  // Determine current plan and if user has an existing subscription
  const currentPlanId = subscriptionData?.subscription?.plan;
  const hasExistingPlan = !!subscriptionData?.subscription && 
    (subscriptionData.subscription.status === "active" || 
     subscriptionData.subscription.status === "trialing");

  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-muted/30">
      {/* Hero Section */}
      <section className="pt-16 pb-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight mb-4">
            {hasExistingPlan ? "Upgrade Your Plan" : "Simple, Transparent Pricing"}
          </h1>

          <p className="text-lg text-balance text-muted-foreground max-w-2xl mx-auto mb-8">
            {hasExistingPlan 
              ? "Upgrade to unlock more templates and images"
              : "Create beautiful, on-brand email templates in minutes. Start free, upgrade when you're ready."}
          </p>

          {/* Billing Toggle */}
          <PricingToggle isAnnual={isAnnual} onToggle={setIsAnnual} />
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {PLANS.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                isAnnual={isAnnual}
                isCurrentPlan={currentPlanId === plan.id}
                hasExistingPlan={hasExistingPlan}
                isLoading={loadingPlan === plan.id}
                onSelect={handleSelectPlan}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-16 px-4 border-t">
        <FeatureComparison />
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-muted/30 border-t">
        <PricingFAQ />
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 border-t">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to create stunning emails?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of marketers using Mocah to create beautiful,
            on-brand email templates.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => handleSelectPlan("pro")}
              disabled={loadingPlan === "pro"}
            >
              {hasExistingPlan ? "Upgrade to Pro" : "Start Your Free Trial"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push("/help")}
            >
              Talk to Sales
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

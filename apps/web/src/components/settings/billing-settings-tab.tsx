"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

import { CurrentPlanCard, NoPlanCard } from "@/components/billing/current-plan-card";
import { TrialBanner } from "@/components/billing/trial-banner";
import { UsageMeter } from "@/components/billing/usage-meter";
import { InvoiceTable } from "@/components/billing/invoice-table";
import { PlanSelectionModal } from "@/components/pricing/plan-selection-modal";


// ============================================================================
// Types
// ============================================================================

interface BillingSettingsTabProps {
  onClose?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function BillingSettingsTab({ onClose }: BillingSettingsTabProps) {
  const utils = trpc.useUtils();
  
  // State
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Queries
  const { data: subscriptionData, isLoading: isLoadingSubscription } = 
    trpc.subscription.getCurrent.useQuery(undefined, {
      refetchOnWindowFocus: false,
    });

  const { data: invoicesData, isLoading: isLoadingInvoices } = 
    trpc.subscription.getInvoices.useQuery(undefined, {
      refetchOnWindowFocus: false,
    });

  // Mutations
  const createPortalSessionMutation = trpc.subscription.createPortalSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast.error(`Failed to open billing portal: ${error.message}`);
    },
  });

  // Handlers
  const handleManagePayment = () => {
    createPortalSessionMutation.mutate({
      returnUrl: window.location.href,
    });
  };

  const handleUpgradeNow = () => {
    setShowPlanModal(true);
  };

  // Derived state
  const subscription = subscriptionData?.subscription;
  const trial = subscriptionData?.trial;
  const usage = subscriptionData?.usage;
  const limits = subscriptionData?.limits;
  const isTrialUser = !!trial && trial.status === "active";
  const hasActiveSubscription = subscription?.status === "active" || subscription?.status === "trialing";

  // Calculate trial days remaining
  const trialDaysRemaining = trial?.expiresAt 
    ? Math.max(0, Math.ceil((new Date(trial.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Calculate reset date (end of current billing period or end of month)
  const resetDate = subscription?.periodEnd 
    ? new Date(subscription.periodEnd)
    : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

  // Get current plan price based on plan name
  const currentPlanPrice: number = (() => {
    const planName = limits?.plan?.toLowerCase();
    // Default prices from our pricing data
    if (planName === 'starter') return 29;
    if (planName === 'pro') return 69;
    if (planName === 'scale') return 129;
    return 0;
  })();

  // Format invoices for the table
  const invoices = (invoicesData || []).map((inv) => ({
    id: inv.id,
    number: inv.number || inv.id,
    date: new Date(inv.created),
    amount: inv.amount,
    currency: inv.currency,
    status: inv.status as "paid" | "open" | "uncollectible" | "void" | "draft",
    pdfUrl: inv.invoicePdf,
    hostedUrl: inv.hostedInvoiceUrl,
  }));

  return (
    <div className="space-y-6">
      {/* Trial Banner */}
      {isTrialUser && trial && (
        <TrialBanner
          daysRemaining={trialDaysRemaining}
          templatesUsed={trial.templatesUsed}
          templatesLimit={trial.templatesLimit}
          imagesUsed={trial.imagesUsed}
          imagesLimit={trial.imagesLimit}
          expiresAt={new Date(trial.expiresAt)}
          onUpgradeNow={handleUpgradeNow}
        />
      )}

      {/* Current Plan */}
      <Card className="rounded-none border-none">
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            Manage your subscription and billing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-0">
          <div className="px-6">
            {isLoadingSubscription ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : hasActiveSubscription && subscription && limits ? (
              <CurrentPlanCard
                planName={limits.plan.charAt(0).toUpperCase() + limits.plan.slice(1)}
                planPrice={currentPlanPrice}
                billingInterval="month"
                nextBillingDate={subscription.periodEnd ? new Date(subscription.periodEnd) : undefined}
                cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
                paymentMethod={null} // Would need to fetch from Stripe
                onManagePayment={handleManagePayment}
              />
            ) : (
              <NoPlanCard onViewPlans={handleUpgradeNow} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      {(hasActiveSubscription || isTrialUser) && usage && limits && (
        <Card className="rounded-none border-none">
          <CardHeader>
            <CardTitle>Usage This Period</CardTitle>
            <CardDescription>
              Track your template and image generation usage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-0">
            <div className="px-6 space-y-6">
              <UsageMeter
                label="Templates Generated"
                used={usage.templates.used}
                limit={limits.templatesLimit}
                resetDate={resetDate}
                onUpgradeClick={handleUpgradeNow}
              />
              <UsageMeter
                label="Images Generated"
                used={usage.images.used}
                limit={limits.imagesLimit}
                resetDate={resetDate}
                onUpgradeClick={handleUpgradeNow}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing History */}
      {hasActiveSubscription && (
        <Card className="rounded-none border-none">
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>
              View and download your past invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <div className="px-6">
              <InvoiceTable
                invoices={invoices}
                isLoading={isLoadingInvoices}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Selection Modal */}
      <PlanSelectionModal
        open={showPlanModal}
        onOpenChange={setShowPlanModal}
      />
    </div>
  );
}


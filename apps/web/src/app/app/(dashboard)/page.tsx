"use client";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Dashboard from "./dashboard";
import MocahLoadingIcon from "@/components/mocah-brand/MocahLoadingIcon";
import dynamic from "next/dynamic";
import { trpc } from "@/utils/trpc";
import { NoSubscriptionBanner } from "@/components/billing/usage-warning-banner";
import { logger } from "@mocah/shared";

const PlanSelectionModal = dynamic(() =>
  import("@/components/pricing/plan-selection-modal").then(
    (mod) => mod.PlanSelectionModal
  )
);

function DashboardPageContent() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Check subscription status
  const { data: subscriptionData, isLoading: isLoadingSubscription } = trpc.subscription.getCurrent.useQuery(
    undefined,
    {
      enabled: !!session?.user,
      refetchOnWindowFocus: false,
    }
  );

  // Only allow active or trialing subscriptions
  // Stripe statuses: active, trialing, incomplete, incomplete_expired, past_due, canceled, unpaid
  const hasActiveSubscription = 
    subscriptionData?.subscription?.status === "active" || 
    subscriptionData?.subscription?.status === "trialing";
  
  const hasNoSubscription = !hasActiveSubscription;

  // Debug log
  useEffect(() => {
    if (subscriptionData) {
      logger.debug("Subscription Status", {
        exists: !!subscriptionData.subscription,
        status: subscriptionData.subscription?.status,
        isActive: hasActiveSubscription,
        shouldShowModal: hasNoSubscription,
      });
    }
  }, [subscriptionData, hasActiveSubscription, hasNoSubscription]);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/login");
    }
  }, [session, isPending, router]);

  // Auto-show plan selection modal for users without subscription
  useEffect(() => {
    if (!isPending && !isLoadingSubscription && session?.user && hasNoSubscription) {
      setShowPlanModal(true);
    }
  }, [isPending, isLoadingSubscription, session, hasNoSubscription]);

  if (isPending || isLoadingSubscription) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-full h-full">
        <MocahLoadingIcon isLoading={true} size="sm" />
      </div>
    );
  }

  return (
    <>
      <div className="p-1 w-full">
        <div className="py-4 border border-border">
          {/* Show banner if no subscription */}
          {hasNoSubscription && (
            <div className="px-4 pb-4">
              <NoSubscriptionBanner
                type="template"
                variant="alert"
              />
            </div>
          )}
          <Dashboard />
        </div>
      </div>

      {/* Auto-show Plan Selection Modal for users without subscription */}
      <PlanSelectionModal
        open={showPlanModal}
        onOpenChange={setShowPlanModal}
      />
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center min-h-full h-full">
          <MocahLoadingIcon isLoading={true} size="sm" />
        </div>
      }
    >
      <DashboardPageContent />
    </Suspense>
  );
}

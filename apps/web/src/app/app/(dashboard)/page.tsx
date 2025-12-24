"use client";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Dashboard from "./dashboard";
import MocahLoadingIcon from "@/components/mocah-brand/MocahLoadingIcon";
import dynamic from "next/dynamic";


const PlanSelectionModal = dynamic(() =>
  import("@/components/pricing/plan-selection-modal").then(
    (mod) => mod.PlanSelectionModal
  )
);
const CheckoutLoadingModal = dynamic(() =>
  import("@/components/pricing/checkout-loading-modal").then(
    (mod) => mod.CheckoutLoadingModal
  )
);

function DashboardPageContent() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if this is a new user from onboarding or existing user from login
  const isNewUser = searchParams.get("new-user") === "true";
  const isExistingUser = searchParams.get("existing-user") === "true";
  const planFromParams = searchParams.get("plan");
  const intervalFromParams = searchParams.get("interval");

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/login");
    }
  }, [session, isPending, router]);

  // Show plan selection modal for new users from pricing flow
  useEffect(() => {
    if (
      !isPending &&
      session?.user &&
      isNewUser &&
      planFromParams &&
      intervalFromParams
    ) {
      setShowPlanModal(true);
    }
  }, [isPending, session, isNewUser, planFromParams, intervalFromParams]);

  // Show checkout loading modal for existing users from pricing flow
  useEffect(() => {
    if (
      !isPending &&
      session?.user &&
      isExistingUser &&
      planFromParams &&
      intervalFromParams
    ) {
      setShowCheckoutModal(true);
    }
  }, [isPending, session, isExistingUser, planFromParams, intervalFromParams]);

  // Handle modal close - remove params from URL
  const handleModalClose = (open: boolean) => {
    setShowPlanModal(open);
    if (!open) {
      // Clean up URL params
      const params = new URLSearchParams(searchParams.toString());
      params.delete("new-user");
      params.delete("plan");
      params.delete("interval");
      router.replace(`/app?${params.toString()}`, { scroll: false });
    }
  };

  if (isPending) {
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
          <Dashboard />
        </div>
      </div>

      {/* Plan Selection Modal for New Users */}
      <PlanSelectionModal
        open={showPlanModal}
        onOpenChange={handleModalClose}
        defaultPlan={planFromParams || undefined}
        defaultInterval={(intervalFromParams as "month" | "year") || "year"}
      />

      {/* Checkout Loading Modal for Existing Users */}
      <CheckoutLoadingModal
        open={showCheckoutModal}
        plan={planFromParams || ""}
        interval={(intervalFromParams as "month" | "year") || "year"}
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

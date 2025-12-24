"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { PricingCard } from "./pricing-card";
import { PricingToggle } from "./pricing-toggle";
import { PLANS } from "./pricing-data";
import * as motion from "motion/react-client";

// ============================================================================
// Types
// ============================================================================

interface PlanSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPlan?: string;
  defaultInterval?: "month" | "year";
}

// ============================================================================
// Component
// ============================================================================

export function PlanSelectionModal({
  open,
  onOpenChange,
  defaultPlan,
  defaultInterval = "year",
}: PlanSelectionModalProps) {
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(defaultInterval === "year");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Handle plan selection using Better Auth's subscription.upgrade()
  const handleSelectPlan = async (planId: string) => {
    setLoadingPlan(planId);
    
    try {
      const result = await authClient.subscription.upgrade({
        plan: planId,
        annual: isAnnual,
        successUrl: `${window.location.origin}/app?checkout=success`,
        cancelUrl: `${window.location.origin}/app`,
      });

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-full h-full p-0 gap-0 overflow-hidden rounded-none flex flex-col"
        // showCloseButton={false}
      >
        <DialogHeader className="px-6 py-4 shrink-0">
          <DialogTitle>Plan</DialogTitle>
          <DialogDescription className="sr-only">
            {" "}
            Choose a subscription with any plan{" "}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col flex-1 min-h-0">
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            {/* Main Content */}
            <div className="w-full flex flex-col items-center justify-center mb-8">
              <h2 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
                Choose a Subscription Plan
              </h2>
              <p className="text-sm lg:text-base text-muted-foreground mt-1">
                Start your 7-day free trial with any plan
              </p>
            </div>
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Toggle */}
              <div className="flex justify-center">
                <PricingToggle isAnnual={isAnnual} onToggle={setIsAnnual} />
              </div>

              {/* Pricing Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid md:grid-cols-3 gap-6"
              >
                {PLANS.map((plan) => (
                  <PricingCard
                    key={plan.id}
                    plan={plan}
                    isAnnual={isAnnual}
                    isLoading={loadingPlan === plan.id}
                    onSelect={handleSelectPlan}
                  />
                ))}
              </motion.div>

              {/* Skip Option */}
              <div className="text-center pb-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    onOpenChange(false);
                    router.push("/app");
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Skip for now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

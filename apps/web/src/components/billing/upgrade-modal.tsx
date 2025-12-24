"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { 
  AlertTriangle, 
  ArrowRight, 
  Check, 
  Crown, 
  Rocket, 
  Sparkles, 
  Zap 
} from "lucide-react";
import { PLANS } from "@/components/pricing/pricing-data";
import type { UsageType } from "@/hooks/use-usage-tracking";

// ============================================================================
// Types
// ============================================================================

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  limitType: UsageType;
  isTrialUser?: boolean;
  currentPlan?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getPlanIcon(planId: string) {
  switch (planId) {
    case "scale":
      return Rocket;
    case "pro":
      return Crown;
    default:
      return Zap;
  }
}

function getPlanColor(planId: string): string {
  switch (planId) {
    case "scale":
      return "text-violet-500";
    case "pro":
      return "text-amber-500";
    default:
      return "text-emerald-500";
  }
}

// ============================================================================
// Component
// ============================================================================

export function UpgradeModal({
  open,
  onOpenChange,
  limitType,
  isTrialUser = false,
  currentPlan = "starter",
}: UpgradeModalProps) {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Filter to show upgrade options only
  const upgradePlans = PLANS.filter((plan) => {
    const planIndex = PLANS.findIndex((p) => p.id === plan.id);
    const currentIndex = PLANS.findIndex((p) => p.id === currentPlan.toLowerCase());
    return planIndex > currentIndex;
  });

  // Handle plan selection using Better Auth's subscription.upgrade()
  const handleSelectPlan = async (planId: string) => {
    setLoadingPlan(planId);
    
    try {
      const result = await authClient.subscription.upgrade({
        plan: planId,
        annual: false, // Default to monthly for upgrade modal
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

  // Handle view all plans
  const handleViewAllPlans = () => {
    onOpenChange(false);
    router.push("/pricing");
  };

  // Get limit-specific messaging
  const limitMessage = limitType === "template"
    ? isTrialUser
      ? "You've used all 5 template generations in your trial."
      : "You've reached your monthly template generation limit."
    : isTrialUser
      ? "You've used all 5 image generations in your trial."
      : "You've reached your monthly image generation limit.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <DialogTitle>
              {isTrialUser ? "Trial Limit Reached" : "Upgrade Your Plan"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {limitMessage} Upgrade to unlock more {limitType}s.
          </DialogDescription>
        </DialogHeader>

        {/* Upgrade Options */}
        <div className="space-y-3 py-4">
          {upgradePlans.length > 0 ? (
            upgradePlans.map((plan) => {
              const Icon = getPlanIcon(plan.id);
              const highlight = plan.popular;
              
              return (
                <button
                  key={plan.id}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loadingPlan !== null}
                  className={cn(
                    "w-full p-4 rounded-lg border text-left transition-all",
                    "hover:border-primary/50 hover:bg-primary/5",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20",
                    highlight && "border-amber-500/50 bg-amber-500/5"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Icon className={cn("h-5 w-5 mt-0.5", getPlanColor(plan.id))} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{plan.name}</span>
                          {highlight && (
                            <Badge
                              variant="secondary"
                              className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 text-xs"
                            >
                              <Sparkles className="mr-1 h-3 w-3" />
                              Popular
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {plan.templatesLimit} templates • {plan.imagesLimit} images/mo
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">${plan.monthlyPrice}</span>
                      <span className="text-muted-foreground text-sm">/mo</span>
                    </div>
                  </div>

                  {/* Key benefits */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {plan.features
                      .filter((f) => f.highlight && f.included)
                      .slice(0, 2)
                      .map((feature, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center text-xs text-muted-foreground"
                        >
                          <Check className="mr-1 h-3 w-3 text-emerald-500" />
                          {feature.text}
                        </span>
                      ))}
                  </div>

                  {loadingPlan === plan.id && (
                    <div className="mt-2 text-sm text-primary">
                      Redirecting to checkout...
                    </div>
                  )}
                </button>
              );
            })
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p>You're on our highest plan!</p>
              <p className="text-sm mt-1">
                Contact us if you need custom limits.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Maybe Later
          </Button>
          <Button
            variant="ghost"
            onClick={handleViewAllPlans}
            className="flex-1"
          >
            View All Plans
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

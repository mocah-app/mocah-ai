"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, X, Sparkles, Crown, Rocket, Zap } from "lucide-react";
import * as motion from "motion/react-client";
import type { Plan } from "./pricing-data";

// ============================================================================
// Types
// ============================================================================

interface PricingCardProps {
  plan: Plan;
  isAnnual: boolean;
  isCurrentPlan?: boolean;
  hasExistingPlan?: boolean;
  isLoading?: boolean;
  onSelect: (planId: string) => void;
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

function getPlanGradient(planId: string, isPopular: boolean): string {
  if (isPopular) {
    return "from-primary/5 via-primary/5 to-primary/5";
  }
  return "from-accent/5 via-accent/5 to-accent/5";
}

// ============================================================================
// Component
// ============================================================================

export function PricingCard({
  plan,
  isAnnual,
  isCurrentPlan,
  hasExistingPlan,
  isLoading,
  onSelect,
}: PricingCardProps) {
  const Icon = getPlanIcon(plan.id);
  const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
  const annualTotal = plan.annualPrice * 12;
  const monthlyTotal = plan.monthlyPrice * 12;
  const savings = monthlyTotal - annualTotal;

  // Determine CTA text
  const getCtaText = () => {
    if (isCurrentPlan) return "Current Plan";
    if (isLoading) return "Processing...";
    if (hasExistingPlan) return `Upgrade to ${plan.name}`;
    return plan.cta;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "relative rounded-2xl border bg-linear-to-b p-6 flex flex-col",
        plan.popular
          ? "border-primary/50 shadow-lg shadow-primary/10"
          : "border-border",
        getPlanGradient(plan.id, !!plan.popular)
      )}
    >
      {/* Popular Badge */}
      {plan.popular && (
        <Badge
          className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground border-0 shadow-md"
        >
          <Sparkles className="mr-1 h-3 w-3" />
          Most Popular
        </Badge>
      )}

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-bold">{plan.name}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{plan.description}</p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold tracking-tight">${price}</span>
          <span className="text-muted-foreground">/month</span>
        </div>
        {isAnnual && (
          <p className="text-sm text-primary mt-1">
            Save ${savings}/year
          </p>
        )}
        {!isAnnual && (
          <p className="text-sm text-muted-foreground mt-1">
            Billed monthly
          </p>
        )}
      </div>

      {/* Limits Highlight */}
      <div className="mb-6 p-3 rounded-lg bg-background/50 border border-border/50">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="font-semibold">{plan.templatesLimit}</span>
            <span className="text-muted-foreground ml-1">templates/mo</span>
          </div>
          <div>
            <span className="font-semibold">{plan.imagesLimit}</span>
            <span className="text-muted-foreground ml-1">images/mo</span>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="flex-1 mb-6">
        <ul className="space-y-2.5">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              {feature.included ? (
                <Check className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
              ) : (
                <X className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground/50" />
              )}
              <span
                className={cn(
                  feature.included
                    ? "text-foreground"
                    : "text-muted-foreground/70 line-through"
                )}
              >
                {feature.text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <Button
        onClick={() => onSelect(plan.id)}
        disabled={isLoading || isCurrentPlan}
        variant={plan.popular ? "default" : "outline"}
        className="w-full"
      >
        {getCtaText()}
      </Button>
    </motion.div>
  );
}


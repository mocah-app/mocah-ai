"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Crown,
  Zap,
  Rocket,
  CreditCard,
  ExternalLink,
  Calendar,
} from "lucide-react";
import Link from "next/link";

// ============================================================================
// Types
// ============================================================================

interface CurrentPlanCardProps {
  planName: string;
  planPrice: number;
  billingInterval: "month" | "year";
  nextBillingDate?: Date;
  cancelAtPeriodEnd?: boolean;
  paymentMethod?: {
    brand: string | null;
    last4: string | null;
  } | null;
  onManagePayment?: () => void;
  onCancelSubscription?: () => void;
  isLoading?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getPlanIcon(planName: string) {
  const name = planName.toLowerCase();
  if (name === "scale") return Rocket;
  if (name === "pro") return Crown;
  return Zap;
}

function getPlanColor(planName: string): string {
  const name = planName.toLowerCase();
  if (name === "scale") return "text-violet-500";
  if (name === "pro") return "text-amber-500";
  return "text-emerald-500";
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatCardBrand(brand: string | null): string {
  if (!brand) return "Card";
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

// ============================================================================
// Component
// ============================================================================

export function CurrentPlanCard({
  planName,
  planPrice,
  billingInterval,
  nextBillingDate,
  cancelAtPeriodEnd,
  paymentMethod,
  onManagePayment,
  onCancelSubscription,
  isLoading,
}: CurrentPlanCardProps) {
  const PlanIcon = getPlanIcon(planName);
  const planColor = getPlanColor(planName);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-12 bg-muted animate-pulse rounded" />
          <div className="h-8 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlanIcon className={cn("h-5 w-5", planColor)} />
            <CardTitle className="text-lg">{planName} Plan</CardTitle>
          </div>
          {cancelAtPeriodEnd && (
            <Badge variant="destructive" className="text-xs">
              Cancels at period end
            </Badge>
          )}
        </div>
        <CardDescription>
          ${planPrice}/{billingInterval === "year" ? "year" : "month"}
          {billingInterval === "year" && (
            <span className="ml-1 text-emerald-600 dark:text-emerald-500">
              (Save 20%)
            </span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Next Billing Date */}
        {nextBillingDate && !cancelAtPeriodEnd && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Next billing: {formatDate(nextBillingDate)}
            </span>
          </div>
        )}

        {cancelAtPeriodEnd && nextBillingDate && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <Calendar className="h-4 w-4" />
            <span>
              Access ends: {formatDate(nextBillingDate)}
            </span>
          </div>
        )}

        {/* Payment Method */}
        {paymentMethod?.last4 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            <span>
              {formatCardBrand(paymentMethod.brand)} ending in {paymentMethod.last4}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/pricing">
              Change Plan
              <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </Button>
          
          {onManagePayment && (
            <Button
              variant="outline"
              size="sm"
              onClick={onManagePayment}
            >
              Manage Payment
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// No Plan Card (Free/No Subscription)
// ============================================================================

interface NoPlanCardProps {
  onViewPlans?: () => void;
}

export function NoPlanCard({ onViewPlans }: NoPlanCardProps) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-lg">No Active Plan</CardTitle>
        <CardDescription>
          Start a free trial to unlock all features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button onClick={onViewPlans}>
            View Plans
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


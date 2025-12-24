"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, Sparkles, AlertTriangle, TrendingUp } from "lucide-react";
import { CompactUsageMeter } from "./usage-meter";

// ============================================================================
// Types
// ============================================================================

interface TrialBannerProps {
  daysRemaining: number;
  templatesUsed: number;
  templatesLimit: number;
  imagesUsed: number;
  imagesLimit: number;
  expiresAt: Date;
  onUpgradeNow?: () => void;
  isUpgrading?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getTrialStatus(daysRemaining: number): {
  color: string;
  bgColor: string;
  borderColor: string;
  urgency: "normal" | "warning" | "urgent";
} {
  if (daysRemaining <= 1) {
    return {
      color: "text-destructive",
      bgColor: "bg-destructive/5",
      borderColor: "border-destructive/20",
      urgency: "urgent",
    };
  }
  if (daysRemaining <= 3) {
    return {
      color: "text-amber-600 dark:text-amber-500",
      bgColor: "bg-amber-500/5",
      borderColor: "border-amber-500/20",
      urgency: "warning",
    };
  }
  return {
    color: "text-primary",
    bgColor: "bg-primary/5",
    borderColor: "border-primary/20",
    urgency: "normal",
  };
}

function formatExpiryDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

// ============================================================================
// Component
// ============================================================================

export function TrialBanner({
  daysRemaining,
  templatesUsed,
  templatesLimit,
  imagesUsed,
  imagesLimit,
  expiresAt,
  onUpgradeNow,
  isUpgrading,
}: TrialBannerProps) {
  const { color, bgColor, borderColor, urgency } = getTrialStatus(daysRemaining);
  const isLimitReached = templatesUsed >= templatesLimit || imagesUsed >= imagesLimit;

  return (
    <div
      className={cn(
        "rounded-lg border p-4 space-y-4",
        bgColor,
        borderColor
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className={cn("h-5 w-5", color)} />
          <div>
            <h3 className="font-semibold">Free Trial</h3>
            <p className="text-sm text-muted-foreground">
              {daysRemaining > 0 ? (
                <>
                  {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining
                </>
              ) : (
                "Expires today"
              )}
            </p>
          </div>
        </div>
        
        <Badge
          variant={urgency === "urgent" ? "destructive" : urgency === "warning" ? "outline" : "secondary"}
          className="shrink-0"
        >
          <Clock className="mr-1 h-3 w-3" />
          Ends {formatExpiryDate(expiresAt)}
        </Badge>
      </div>

      {/* Usage Meters */}
      <div className="grid gap-2 sm:grid-cols-2">
        <CompactUsageMeter
          label="Templates"
          used={templatesUsed}
          limit={templatesLimit}
        />
        <CompactUsageMeter
          label="Images"
          used={imagesUsed}
          limit={imagesLimit}
        />
      </div>

      {/* Warning Messages */}
      {isLimitReached && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            You&apos;ve reached your trial limit. Upgrade to continue creating.
          </span>
        </div>
      )}

      {urgency === "urgent" && !isLimitReached && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Your trial ends today. Upgrade now to keep access.
          </span>
        </div>
      )}

      {/* Upgrade CTA */}
      <Button
        onClick={onUpgradeNow}
        disabled={isUpgrading}
        className={cn(
          "w-full",
          urgency === "urgent" && "bg-destructive hover:bg-destructive/90"
        )}
      >
        {isUpgrading ? (
          "Processing..."
        ) : (
          <>
            <TrendingUp className="mr-2 h-4 w-4" />
            Upgrade Now
          </>
        )}
      </Button>

      {/* Footer Info */}
      <p className="text-xs text-muted-foreground text-center">
        Your subscription will start immediately. Cancel anytime.
      </p>
    </div>
  );
}

// ============================================================================
// Compact Trial Badge (for header/sidebar)
// ============================================================================

interface TrialBadgeProps {
  daysRemaining: number;
  onClick?: () => void;
  className?: string;
}

export function TrialBadge({ daysRemaining, onClick, className }: TrialBadgeProps) {
  const { urgency } = getTrialStatus(daysRemaining);

  return (
    <Badge
      variant={urgency === "urgent" ? "destructive" : urgency === "warning" ? "outline" : "secondary"}
      className={cn("cursor-pointer transition-colors hover:opacity-80", className)}
      onClick={onClick}
    >
      <Sparkles className="mr-1 h-3 w-3" />
      Trial: {daysRemaining}d left
    </Badge>
  );
}


"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import type { UsageType } from "@/hooks/use-usage-tracking";

// ============================================================================
// Types
// ============================================================================

interface UsageWarningBannerProps {
  type: UsageType;
  percentage: number;
  remaining?: number;
  variant?: "alert" | "compact";
  onUpgradeClick?: () => void;
  upgradeHref?: string;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function UsageWarningBanner({
  type,
  percentage,
  remaining,
  variant = "alert",
  onUpgradeClick,
  upgradeHref = "/pricing",
  className,
}: UsageWarningBannerProps) {
  // Only show if percentage is >= 80%
  if (percentage < 80) return null;

  const isCritical = percentage >= 95;
  const typeLabel = type === "template" ? "template" : "image";

  // Alert variant (matches current implementation)
  if (variant === "alert") {
    return (
      <Alert
        variant="default"
        className={cn(
          "border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20",
          isCritical && "border-red-500/50 bg-red-50 dark:bg-red-950/20",
          className
        )}
      >
        <AlertTriangle
          className={cn(
            "h-4 w-4",
            isCritical ? "text-red-600" : "text-yellow-600"
          )}
        />
        <AlertDescription
          className={cn(
            isCritical
              ? "text-red-800 dark:text-red-200"
              : "text-yellow-800 dark:text-yellow-200"
          )}
        >
          You&apos;ve used {Math.round(percentage)}% of your {typeLabel} quota
          this month.{" "}
          {onUpgradeClick ? (
            <button
              onClick={onUpgradeClick}
              className="font-medium underline underline-offset-4 hover:opacity-80"
            >
              Upgrade your plan
            </button>
          ) : (
            <Link
              href={upgradeHref as Route}
              className="font-medium underline underline-offset-4 hover:opacity-80"
            >
              Upgrade your plan
            </Link>
          )}{" "}
          for more {typeLabel}s.
        </AlertDescription>
      </Alert>
    );
  }

  // Compact variant (matches existing UsageWarningBanner)
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 px-4 py-2 rounded-lg text-sm",
        isCritical
          ? "bg-destructive/10 text-destructive"
          : "bg-amber-500/10 text-amber-700 dark:text-amber-400",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>
          {remaining !== undefined && remaining === 0
            ? `You've used all ${typeLabel}s this month.`
            : remaining !== undefined
              ? `Only ${remaining} ${typeLabel}${remaining === 1 ? "" : "s"} remaining.`
              : `You've used ${Math.round(percentage)}% of your ${typeLabel} quota.`}
        </span>
      </div>
      {(onUpgradeClick || upgradeHref) &&
        (onUpgradeClick ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onUpgradeClick}
            className={cn(
              "shrink-0 h-7 px-2",
              isCritical
                ? "text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                : "text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-500/10"
            )}
          >
            <TrendingUp className="mr-1 h-3 w-3" />
            Upgrade
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className={cn(
              "shrink-0 h-7 px-2",
              isCritical
                ? "text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                : "text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-500/10"
            )}
          >
            <Link href={upgradeHref as Route}>
              <TrendingUp className="mr-1 h-3 w-3" />
              Upgrade
            </Link>
          </Button>
        ))}
    </div>
  );
}

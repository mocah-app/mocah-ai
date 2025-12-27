"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import type { UsageType } from "@/hooks/use-usage-tracking";
import { PlanSelectionModal } from "@/components/pricing/plan-selection-modal";

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

interface NoSubscriptionBannerProps {
  type?: UsageType;
  variant?: "alert" | "compact";
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * NoSubscriptionBanner
 * Shows when user has no subscription at all (not even trial)
 * Blocks user from generating templates/images until they subscribe
 */
export function NoSubscriptionBanner({
  type = "template",
  variant = "alert",
  className,
}: NoSubscriptionBannerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const typeLabel = type === "template" ? "template" : "image";

  // Alert variant - prominent blocking banner
  if (variant === "alert") {
    return (
      <>
        <div
          className={cn(
            "relative rounded-lg border p-5 shadow-lg transition-all",
            "bg-linear-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/30 dark:to-blue-900/20",
            "border-blue-200/60 dark:border-blue-800/40",
            className
          )}
        >
          {/* Decorative gradient overlay */}
          <div
            className={cn(
              "absolute inset-0 rounded-lg opacity-5",
              "bg-linear-to-br from-blue-600 to-blue-700"
            )}
          />

          <div className="relative flex items-start gap-4">
            {/* Icon */}
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                "bg-blue-200 dark:bg-blue-800/40"
              )}
            >
              <AlertTriangle className="h-5 w-5 text-blue-700 dark:text-blue-300" />
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col md:flex-row justify-between w-full gap-4 space-y-3">
              <div>
                <h3 className="font-semibold text-sm text-blue-950 dark:text-blue-50">
                  Subscription Required
                </h3>
                <p className="text-sm mt-1 text-blue-900/95 dark:text-blue-100/95">
                  Start your 7-day free trial to create {typeLabel}s. No credit card required.
                </p>
              </div>

              {/* CTA Button */}
              <Button
                onClick={() => setIsModalOpen(true)}
                size="sm"
                className="mt-2 bg-blue-700 hover:bg-blue-800 text-white dark:bg-blue-800 dark:hover:bg-blue-900 shadow-md"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>

        {/* Plan Selection Modal */}
        <PlanSelectionModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />
      </>
    );
  }

  // Compact variant
  return (
    <>
      <div
        className={cn(
          "flex items-center justify-between gap-2 px-4 py-2 rounded-lg text-sm",
          "bg-blue-500/10 text-blue-700 dark:text-blue-400",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Start your free trial to create {typeLabel}s</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="shrink-0 h-7 px-2 text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-500/10"
        >
          <TrendingUp className="mr-1 h-3 w-3" />
          Start Trial
        </Button>
      </div>

      {/* Plan Selection Modal */}
      <PlanSelectionModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}

export function UsageWarningBanner({
  type,
  percentage,
  remaining,
  variant = "alert",
  onUpgradeClick,
  upgradeHref = "/pricing",
  className,
}: UsageWarningBannerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Only show if percentage is >= 80%
  if (percentage < 80) return null;

  const isExhausted = percentage >= 100;
  const isCritical = percentage >= 95 && percentage < 100;
  const typeLabel = type === "template" ? "template" : "image";

  const handleUpgradeClick = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      setIsModalOpen(true);
    }
  };

  // Alert variant (improved design)
  if (variant === "alert") {
    return (
      <>
        <div
          className={cn(
            "relative rounded-lg border p-5 shadow-sm transition-all",
            "bg-linear-to-br from-amber-50/50 to-amber-100/30 dark:from-amber-950/30 dark:to-amber-900/20",
            (isCritical || isExhausted) &&
              "from-red-50/50 to-red-100/30 dark:from-red-950/30 dark:to-red-900/20",
            isExhausted &&
              "from-red-100/50 to-red-200/30 dark:from-red-900/40 dark:to-red-950/30",
            "border-amber-200/60 dark:border-amber-800/40",
            (isCritical || isExhausted) && "border-red-200/60 dark:border-red-800/40",
            isExhausted && "border-red-300/80 dark:border-red-700/60",
            className
          )}
        >
          {/* Decorative gradient overlay */}
          <div
            className={cn(
              "absolute inset-0 rounded-lg opacity-5",
              isExhausted
                ? "bg-linear-to-br from-red-600 to-red-700"
                : isCritical
                ? "bg-linear-to-br from-red-500 to-red-600"
                : "bg-linear-to-br from-amber-500 to-amber-600"
            )}
          />

          <div className="relative flex items-start gap-4">
            {/* Icon */}
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                isExhausted
                  ? "bg-red-200 dark:bg-red-800/40"
                  : isCritical
                  ? "bg-red-100 dark:bg-red-900/30"
                  : "bg-amber-100 dark:bg-amber-900/30"
              )}
            >
              <AlertTriangle
                className={cn(
                  "h-5 w-5",
                  isExhausted
                    ? "text-red-700 dark:text-red-300"
                    : isCritical
                    ? "text-red-600 dark:text-red-400"
                    : "text-amber-600 dark:text-amber-400"
                )}
              />
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col md:flex-row justify-between w-full gap-4 space-y-3">
              <div>
                <h3
                  className={cn(
                    "font-semibold text-sm",
                    isExhausted
                      ? "text-red-950 dark:text-red-50"
                      : isCritical
                      ? "text-red-900 dark:text-red-100"
                      : "text-amber-900 dark:text-amber-100"
                  )}
                >
                  {isExhausted
                    ? "Quota Exhausted"
                    : isCritical
                    ? "Quota Almost Exhausted"
                    : "Quota Warning"}
                </h3>
                <p
                  className={cn(
                    "text-sm mt-1",
                    isExhausted
                      ? "text-red-900/95 dark:text-red-100/95"
                      : isCritical
                      ? "text-red-800/90 dark:text-red-200/90"
                      : "text-amber-800/90 dark:text-amber-200/90"
                  )}
                >
                  {isExhausted ? (
                    <>
                      You&apos;ve used <span className="font-semibold">all</span> of your {typeLabel} quota this month. Upgrade to continue creating.
                    </>
                  ) : (
                    <>
                      You&apos;ve used <span className="font-semibold">{Math.round(percentage)}%</span> of
                      your {typeLabel} quota this month.
                      {remaining !== undefined && remaining > 0 && (
                        <> Only <span className="font-semibold">{remaining}</span> {typeLabel}{remaining === 1 ? "" : "s"} remaining.</>
                      )}
                    </>
                  )}
                </p>
              </div>

              {/* CTA Button */}
              <Button
                onClick={handleUpgradeClick}
                size="sm"
                className={cn(
                  "mt-2",
                  isExhausted
                    ? "bg-red-700 hover:bg-red-800 text-white dark:bg-red-800 dark:hover:bg-red-900 shadow-md"
                    : isCritical
                    ? "bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800"
                    : "bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-700 dark:hover:bg-amber-800"
                )}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Upgrade Plan
              </Button>
            </div>
          </div>
        </div>

        {/* Plan Selection Modal */}
        {!onUpgradeClick && (
          <PlanSelectionModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
          />
        )}
      </>
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

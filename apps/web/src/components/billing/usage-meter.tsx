"use client";

import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, TrendingUp } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface UsageMeterProps {
  label: string;
  used: number;
  limit: number;
  unit?: string;
  resetDate?: Date;
  showUpgradePrompt?: boolean;
  onUpgradeClick?: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getUsageStatus(percentage: number): {
  color: string;
  bgColor: string;
  indicatorColor: string;
  status: "normal" | "warning" | "critical" | "exceeded";
} {
  if (percentage >= 100) {
    return {
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      indicatorColor: "bg-destructive",
      status: "exceeded",
    };
  }
  if (percentage >= 95) {
    return {
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      indicatorColor: "bg-destructive",
      status: "critical",
    };
  }
  if (percentage >= 80) {
    return {
      color: "text-amber-600 dark:text-amber-500",
      bgColor: "bg-amber-500/10",
      indicatorColor: "bg-amber-500",
      status: "warning",
    };
  }
  return {
    color: "text-emerald-600 dark:text-emerald-500",
    bgColor: "bg-emerald-500/10",
    indicatorColor: "bg-emerald-500",
    status: "normal",
  };
}

function formatResetDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

// ============================================================================
// Component
// ============================================================================

export function UsageMeter({
  label,
  used,
  limit,
  unit = "",
  resetDate,
  showUpgradePrompt = true,
  onUpgradeClick,
}: UsageMeterProps) {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const remaining = Math.max(0, limit - used);
  const { color, bgColor, indicatorColor, status } = getUsageStatus(percentage);

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className={cn("text-sm font-medium", color)}>
          {used.toLocaleString()} / {limit.toLocaleString()}
          {unit && ` ${unit}`}
        </span>
      </div>

      {/* Progress Bar */}
      <div className={cn("relative h-2 w-full overflow-hidden rounded-full", bgColor)}>
        <div
          className={cn(
            "h-full transition-all duration-300 ease-out rounded-full",
            indicatorColor
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          {status === "warning" && (
            <AlertTriangle className="h-3 w-3 text-amber-500" />
          )}
          {status === "critical" && (
            <AlertTriangle className="h-3 w-3 text-destructive" />
          )}
          {status === "exceeded" && (
            <AlertTriangle className="h-3 w-3 text-destructive" />
          )}
          <span>
            {status === "exceeded"
              ? "Limit reached"
              : `${remaining.toLocaleString()} remaining`}
          </span>
        </div>
        {resetDate && (
          <span>Resets {formatResetDate(resetDate)}</span>
        )}
      </div>

      {/* Upgrade Prompt */}
      {showUpgradePrompt && (status === "warning" || status === "critical" || status === "exceeded") && onUpgradeClick && (
        <button
          onClick={onUpgradeClick}
          className={cn(
            "flex items-center gap-1 text-xs font-medium transition-colors",
            status === "warning" 
              ? "text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400"
              : "text-destructive hover:text-destructive/80"
          )}
        >
          <TrendingUp className="h-3 w-3" />
          Upgrade for more
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Compact Variant
// ============================================================================

interface CompactUsageMeterProps {
  label: string;
  used: number;
  limit: number;
  className?: string;
}

export function CompactUsageMeter({
  label,
  used,
  limit,
  className,
}: CompactUsageMeterProps) {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const { indicatorColor, bgColor } = getUsageStatus(percentage);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {label}:
      </span>
      <div className={cn("flex-1 h-1.5 rounded-full min-w-[60px]", bgColor)}>
        <div
          className={cn("h-full rounded-full transition-all", indicatorColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium whitespace-nowrap">
        {used}/{limit}
      </span>
    </div>
  );
}


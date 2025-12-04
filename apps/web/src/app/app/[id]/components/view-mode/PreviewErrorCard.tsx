"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Sparkles, X } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface PreviewErrorCardProps {
  /** Main title for the error card */
  title: string;
  /** Brief description of what happened */
  description?: string;
  /** List of error messages (technical - sent to AI) */
  errors: string[];
  /** Optional list of warning messages */
  warnings?: string[];
  /** Callback when "Fix with AI" is clicked */
  onFixWithAI: () => void;
  /** Optional callback to dismiss the error */
  onDismiss?: () => void;
  /** Visual variant: 'error' (red) or 'warning' (amber) */
  variant?: "error" | "warning";
}

// ============================================================================
// Helpers - Friendly Message Conversion
// ============================================================================

/** Convert technical error to user-friendly message */
function getFriendlyError(technicalError: string): string {
  const lower = technicalError.toLowerCase();

  // Heading 'as' prop error
  if (lower.includes("'as' prop") && lower.includes("heading")) {
    return "A heading element has an unsupported property that needs to be removed.";
  }

  // Display property
  if (lower.includes("display") && lower.includes("property")) {
    return "Some layout styles aren't compatible with all email clients.";
  }

  // Fit-content/max-content/min-content
  if (lower.includes("fit-content") || lower.includes("max-content") || lower.includes("min-content")) {
    return "Some sizing values need to use specific pixels or percentages instead.";
  }

  // Overflow
  if (lower.includes("overflow")) {
    return "An overflow style needs adjustment for email compatibility.";
  }

  // Flexbox/Grid
  if (lower.includes("flex") || lower.includes("grid")) {
    return "Some modern layout styles need to be converted to email-safe alternatives.";
  }

  // Positioning
  if (lower.includes("position") && (lower.includes("absolute") || lower.includes("fixed"))) {
    return "Positioning styles need adjustment for email clients.";
  }

  // Transform
  if (lower.includes("transform")) {
    return "A transform effect isn't supported in email clients.";
  }

  // Animation
  if (lower.includes("animation") || lower.includes("transition")) {
    return "Animations aren't supported in most email clients.";
  }

  // Render/syntax errors
  if (lower.includes("syntax") || lower.includes("unexpected token")) {
    return "There's a code syntax issue that needs to be corrected.";
  }

  if (lower.includes("render") || lower.includes("failed to render")) {
    return "The template couldn't be displayed properly.";
  }

  if (lower.includes("component not found") || lower.includes("no valid component")) {
    return "The template structure needs to be fixed.";
  }

  if (lower.includes("timeout") || lower.includes("too long")) {
    return "The template is taking too long to process.";
  }

  // Generic fallback - truncate long messages
  if (technicalError.length > 80) {
    return "An email compatibility issue was detected that needs fixing.";
  }

  return technicalError;
}

/** Convert technical warning to user-friendly message */
function getFriendlyWarning(technicalWarning: string): string {
  const lower = technicalWarning.toLowerCase();

  if (lower.includes("display")) {
    return "Layout style may not work in all email clients";
  }

  if (lower.includes("fit-content") || lower.includes("max-content") || lower.includes("min-content")) {
    return "Some size values may not be supported everywhere";
  }

  if (lower.includes("overflow")) {
    return "Overflow style has limited email support";
  }

  // Generic fallback
  if (technicalWarning.length > 60) {
    return "Minor compatibility concern detected";
  }

  return technicalWarning;
}

// ============================================================================
// Component
// ============================================================================

export function PreviewErrorCard({
  title,
  description,
  errors,
  warnings = [],
  onFixWithAI,
  onDismiss,
  variant = "warning",
}: PreviewErrorCardProps) {
  const isError = variant === "error";
  const headerBg = isError ? "bg-destructive/10" : "bg-amber-500/10";
  const headerBorder = isError ? "border-destructive/20" : "border-amber-500/20";
  const iconBg = isError ? "bg-destructive/20" : "bg-amber-500/20";
  const iconColor = isError ? "text-destructive" : "text-amber-500";

  // Convert to friendly messages for display
  const friendlyErrors = errors.map(getFriendlyError);
  const friendlyWarnings = warnings.map(getFriendlyWarning);

  // Deduplicate friendly messages (multiple technical errors may map to same friendly message)
  const uniqueErrors = [...new Set(friendlyErrors)];
  const uniqueWarnings = [...new Set(friendlyWarnings)];

  return (
    <div className="flex h-full w-full items-center justify-center bg-muted/20 p-4">
      <div className="max-w-md w-full bg-card rounded-xl border border-border shadow-lg overflow-hidden">
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 ${headerBg} border-b ${headerBorder}`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${iconBg}`}>
              <AlertTriangle className={`size-4 ${iconColor}`} />
            </div>
            <div>
              <h3 className="font-medium text-sm text-foreground">{title}</h3>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={onDismiss}
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>

        {/* Error List */}
        <div className="px-4 py-3 max-h-48 overflow-y-auto">
          <div className="space-y-2">
            {uniqueErrors.map((err, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/5 border border-destructive/20"
              >
                <div className="mt-0.5 size-4 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-medium text-destructive">
                    {uniqueErrors.length > 1 ? index + 1 : "!"}
                  </span>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed">{err}</p>
              </div>
            ))}

            {uniqueWarnings.length > 0 && (
              <>
                <div className="pt-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Also noticed
                </div>
                {uniqueWarnings.map((warning, index) => (
                  <div
                    key={`warning-${index}`}
                    className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20"
                  >
                    <div className="mt-0.5 size-4 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-medium text-amber-600">~</span>
                    </div>
                    <p className="text-xs text-foreground/80 leading-relaxed">{warning}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 bg-muted/30 border-t border-border">
          <p className="text-xs text-muted-foreground mb-3">
            Don&apos;t worry! Our AI can automatically fix {errors.length === 1 ? "this" : "these"} for you.
          </p>
          <div className="flex items-center justify-end gap-2">
            {onDismiss && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={onDismiss}
              >
                Dismiss
              </Button>
            )}
            <Button
              variant="default"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={onFixWithAI}
            >
              <Sparkles className="size-3.5" />
              Fix with AI
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SaveDesignEditProps {
  isVisible: boolean;
  onSave: () => void;
  onReset: () => void;
  isSaving?: boolean;
}

export function SaveDesignEdit({
  isVisible,
  onSave,
  onReset,
  isSaving = false,
}: SaveDesignEditProps) {
  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        "transition-all duration-300 ease-out",
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-20 opacity-0 pointer-events-none"
      )}
    >
      <div className="flex items-center gap-3 bg-card border border-border rounded-full px-4 py-2 shadow-lg">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span className="font-medium">Unsaved Changes</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            disabled={isSaving}
            className="rounded-full px-4"
          >
            Reset
          </Button>
          <Button
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="rounded-full px-4 bg-primary hover:bg-primary/90"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

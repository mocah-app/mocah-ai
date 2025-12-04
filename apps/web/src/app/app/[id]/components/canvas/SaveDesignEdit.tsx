"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Loader from "@/components/loader";

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
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  // Focus save button when visible
  useEffect(() => {
    if (isVisible && !isSaving && saveButtonRef.current) {
      saveButtonRef.current.focus();
    }
  }, [isVisible, isSaving]);

  // Keyboard shortcuts handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isVisible || isSaving) return;

      // Save: Cmd+S (Mac) or Ctrl+S (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        onSave();
        return;
      }

      // Reset: Escape
      if (e.key === "Escape") {
        e.preventDefault();
        onReset();
        return;
      }
    },
    [isVisible, isSaving, onSave, onReset]
  );

  // Register keyboard shortcuts
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Detect Mac for shortcut display
  const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        "transition-all duration-300 ease-out",
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-20 opacity-0 pointer-events-none"
      )}
      role="status"
      aria-live="polite"
      aria-label="Design changes status"
    >
      <div className="flex items-center gap-3 bg-secondary backdrop-blur-sm border border-primary/20 rounded-full px-4 py-2 shadow-lg">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="font-medium">Unsaved Changes</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            disabled={isSaving}
            className="rounded-full px-4"
            title="Reset changes (Esc)"
          >
            Reset
            <kbd className="ml-1.5 text-[10px] font-mono text-muted-foreground bg-muted px-1 py-0.5 rounded">
              Esc
            </kbd>
          </Button>
          <Button
            ref={saveButtonRef}
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="rounded-full px-4 bg-primary hover:bg-primary/90"
            title={`Save changes (${isMac ? "⌘" : "Ctrl"}+S)`}
          >
            {isSaving ? (
              <Loader />
            ) : (
              <>
                Save
                <kbd className="ml-1.5 text-[10px] font-mono text-primary-foreground/70 bg-primary-foreground/20 px-1 py-0.5 rounded">
                  {isMac ? "⌘" : "⌃"}S
                </kbd>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

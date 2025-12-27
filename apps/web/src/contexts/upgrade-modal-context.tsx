"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { PlanSelectionModal } from "@/components/pricing/plan-selection-modal";

// ============================================================================
// Types
// ============================================================================

type LimitType = "template" | "image";

interface UpgradeModalContextValue {
  /**
   * Trigger the upgrade modal to open
   * @param limitType - The type of limit that was reached
   * @param currentPlan - Optional current plan name
   */
  triggerUpgrade: (limitType: LimitType, currentPlan?: string) => void;
  
  /**
   * Close the upgrade modal
   */
  closeUpgrade: () => void;
  
  /**
   * Whether the modal is currently open
   */
  isOpen: boolean;
}

// ============================================================================
// Context
// ============================================================================

const UpgradeModalContext = createContext<UpgradeModalContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface UpgradeModalProviderProps {
  children: React.ReactNode;
}

export function UpgradeModalProvider({ children }: UpgradeModalProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [limitType, setLimitType] = useState<LimitType>("template");
  const [currentPlan, setCurrentPlan] = useState<string | undefined>(undefined);

  const triggerUpgrade = useCallback((type: LimitType, plan?: string) => {
    setLimitType(type);
    setCurrentPlan(plan);
    setIsOpen(true);
  }, []);

  const closeUpgrade = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  return (
    <UpgradeModalContext.Provider
      value={{
        triggerUpgrade,
        closeUpgrade,
        isOpen,
      }}
    >
      {children}
      <PlanSelectionModal
        open={isOpen}
        onOpenChange={handleOpenChange}
        defaultPlan={currentPlan}
      />
    </UpgradeModalContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useUpgradeModal(): UpgradeModalContextValue {
  const context = useContext(UpgradeModalContext);
  
  if (!context) {
    throw new Error("useUpgradeModal must be used within an UpgradeModalProvider");
  }
  
  return context;
}

// ============================================================================
// Optional Hook (doesn't throw if outside provider)
// ============================================================================

export function useOptionalUpgradeModal(): UpgradeModalContextValue | null {
  return useContext(UpgradeModalContext);
}


"use client";

import { useMemo } from "react";
import { trpc } from "@/utils/trpc";

// ============================================================================
// Types
// ============================================================================

export type UsageType = "template" | "image";

export interface UsageStats {
  templatesUsed: number;
  templatesLimit: number;
  templatesRemaining: number;
  templatesPercentage: number;
  imagesUsed: number;
  imagesLimit: number;
  imagesRemaining: number;
  imagesPercentage: number;
}

export interface TrialInfo {
  isTrialUser: boolean;
  daysRemaining: number;
  expiresAt: Date | null;
  templatesUsed: number;
  templatesLimit: number;
  imagesUsed: number;
  imagesLimit: number;
  status: "active" | null;
}

export interface PlanInfo {
  name: string;
  hasPremiumImageModel: boolean;
  hasPriorityQueue: boolean;
}

export interface UseUsageTrackingResult {
  // Loading states
  isLoading: boolean;
  isError: boolean;

  // Data
  usage: UsageStats | null;
  trial: TrialInfo | null;
  plan: PlanInfo | null;

  // Helpers
  canGenerateTemplate: () => boolean;
  canGenerateImage: () => boolean;
  checkQuota: (type: UsageType) => boolean;
  getUsagePercentage: (type: UsageType) => number;
  isNearLimit: (type: UsageType, threshold?: number) => boolean;
  isAtLimit: (type: UsageType) => boolean;
  
  // Refetch
  refetch: () => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useUsageTracking(): UseUsageTrackingResult {
  const {
    data: subscriptionData,
    isLoading,
    isError,
    refetch,
  } = trpc.subscription.getCurrent.useQuery(undefined, {
    refetchInterval: 60000, // Refetch every 60 seconds
    refetchOnWindowFocus: true,
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  // Compute usage stats
  const usage = useMemo<UsageStats | null>(() => {
    if (!subscriptionData?.usage || !subscriptionData?.limits) return null;

    const { usage: u, limits: l } = subscriptionData;
    
    return {
      templatesUsed: u.templates.used,
      templatesLimit: l.templatesLimit,
      templatesRemaining: u.templates.remaining,
      templatesPercentage: u.templates.percentage,
      imagesUsed: u.images.used,
      imagesLimit: l.imagesLimit,
      imagesRemaining: u.images.remaining,
      imagesPercentage: u.images.percentage,
    };
  }, [subscriptionData?.usage, subscriptionData?.limits]);

  // Compute trial info
  const trial = useMemo<TrialInfo | null>(() => {
    const t = subscriptionData?.trial;
    if (!t) {
      return {
        isTrialUser: false,
        daysRemaining: 0,
        expiresAt: null,
        templatesUsed: 0,
        templatesLimit: 0,
        imagesUsed: 0,
        imagesLimit: 0,
        status: null,
      };
    }

    const expiresAt = new Date(t.expiresAt);
    const daysRemaining = Math.max(
      0,
      Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );

    return {
      isTrialUser: t.status === "active",
      daysRemaining,
      expiresAt,
      templatesUsed: t.templatesUsed,
      templatesLimit: t.templatesLimit,
      imagesUsed: t.imagesUsed,
      imagesLimit: t.imagesLimit,
      status: t.status as TrialInfo["status"],
    };
  }, [subscriptionData?.trial]);

  // Compute plan info
  const plan = useMemo<PlanInfo | null>(() => {
    if (!subscriptionData?.limits) return null;

    const l = subscriptionData.limits;
    return {
      name: l.plan.charAt(0).toUpperCase() + l.plan.slice(1),
      hasPremiumImageModel: l.hasPremiumImageModel,
      hasPriorityQueue: l.hasPriorityQueue,
    };
  }, [subscriptionData?.limits]);

  // Helper: Check if user can generate a template
  const canGenerateTemplate = (): boolean => {
    if (!usage) return false;
    return usage.templatesUsed < usage.templatesLimit;
  };

  // Helper: Check if user can generate an image
  const canGenerateImage = (): boolean => {
    if (!usage) return false;
    return usage.imagesUsed < usage.imagesLimit;
  };

  // Helper: Generic quota check
  const checkQuota = (type: UsageType): boolean => {
    return type === "template" ? canGenerateTemplate() : canGenerateImage();
  };

  // Helper: Get usage percentage
  const getUsagePercentage = (type: UsageType): number => {
    if (!usage) return 0;
    return type === "template" ? usage.templatesPercentage : usage.imagesPercentage;
  };

  // Helper: Check if near limit (default 80%)
  const isNearLimit = (type: UsageType, threshold = 80): boolean => {
    return getUsagePercentage(type) >= threshold;
  };

  // Helper: Check if at limit (100%)
  const isAtLimit = (type: UsageType): boolean => {
    return getUsagePercentage(type) >= 100;
  };

  return {
    isLoading,
    isError,
    usage,
    trial,
    plan,
    canGenerateTemplate,
    canGenerateImage,
    checkQuota,
    getUsagePercentage,
    isNearLimit,
    isAtLimit,
    refetch,
  };
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to check if the upgrade modal should be triggered
 */
export function useUpgradePrompt() {
  const { isNearLimit, isAtLimit, trial, plan, refetch } = useUsageTracking();

  const shouldShowWarning = (type: UsageType): boolean => {
    return isNearLimit(type, 80) && !isAtLimit(type);
  };

  const shouldShowUpgradeModal = (type: UsageType): boolean => {
    return isAtLimit(type);
  };

  const getUpgradeReason = (type: UsageType): string => {
    if (trial?.isTrialUser) {
      return `You've reached your trial limit for ${type}s. Upgrade to continue creating.`;
    }
    return `You've used all your ${type}s for this month. Upgrade for more.`;
  };

  return {
    shouldShowWarning,
    shouldShowUpgradeModal,
    getUpgradeReason,
    trial,
    plan,
    refetch,
  };
}


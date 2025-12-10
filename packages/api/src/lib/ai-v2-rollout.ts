/**
 * AI V2 Rollout & Feature Flag Logic
 * 
 * Manages gradual rollout of V2 template generation with automatic fallback
 */

import { serverEnv } from '@mocah/config/env';
import { logger } from '@mocah/shared/logger';
import prisma from '@mocah/db';

/**
 * Feature flags for AI V2 rollout
 */
export interface AI_V2_FeatureFlags {
  /** Master kill switch - if false, V2 is disabled globally */
  enabled: boolean;
  /** Percentage of organizations to enroll in V2 (0-100) */
  rolloutPercentage: number;
  /** Automatically fallback to V1 if V2 fails */
  fallbackOnError: boolean;
}

/**
 * Get AI V2 feature flags from environment
 */
export function getAI_V2_FeatureFlags(): AI_V2_FeatureFlags {
  return {
    enabled: serverEnv.AI_V2_ENABLED ?? false,
    rolloutPercentage: serverEnv.AI_V2_ROLLOUT_PERCENTAGE ?? 0,
    fallbackOnError: serverEnv.AI_V2_FALLBACK_ON_ERROR ?? true,
  };
}

/**
 * Determine if an organization should use V2 based on rollout settings
 * 
 * Uses consistent hashing to ensure the same org always gets the same result
 * for a given rollout percentage.
 * 
 * @param organizationId - The organization ID to check
 * @param flags - Feature flags (defaults to reading from env)
 * @returns 'v1' | 'v2'
 */
export async function getTemplateGenerationVersion(
  organizationId: string,
  flags?: AI_V2_FeatureFlags
): Promise<'v1' | 'v2'> {
  const featureFlags = flags ?? getAI_V2_FeatureFlags();

  // Master kill switch
  if (!featureFlags.enabled) {
    return 'v1';
  }

  // 0% rollout = all v1
  if (featureFlags.rolloutPercentage === 0) {
    return 'v1';
  }

  // 100% rollout = all v2
  if (featureFlags.rolloutPercentage === 100) {
    return 'v2';
  }

  // Check for per-organization override in database
  try {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { 
        metadata: true,
      },
    });

    // Check for explicit V2 opt-in/opt-out in organization metadata
    const metadata = org?.metadata as any;
    if (metadata?.ai?.forceV2 === true) {
      logger.info('[AI Rollout] Organization explicitly opted into V2', { organizationId });
      return 'v2';
    }
    if (metadata?.ai?.forceV1 === true) {
      logger.info('[AI Rollout] Organization explicitly opted out of V2', { organizationId });
      return 'v1';
    }
  } catch (error) {
    logger.error('[AI Rollout] Failed to check organization override', { 
      organizationId, 
      error: error instanceof Error ? error.message : String(error) 
    });
    // Continue with percentage-based rollout on database errors
  }

  // Percentage-based rollout using consistent hashing
  const hash = simpleHash(organizationId);
  const bucket = hash % 100; // 0-99

  const shouldUseV2 = bucket < featureFlags.rolloutPercentage;

  logger.debug('[AI Rollout] Percentage-based rollout decision', {
    organizationId,
    rolloutPercentage: featureFlags.rolloutPercentage,
    bucket,
    version: shouldUseV2 ? 'v2' : 'v1',
  });

  return shouldUseV2 ? 'v2' : 'v1';
}

/**
 * Simple hash function for consistent bucketing
 * Converts string to a number between 0 and Number.MAX_SAFE_INTEGER
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Metadata for tracking V1 vs V2 usage and performance
 */
export interface GenerationMetadata {
  version: 'v1' | 'v2';
  organizationId: string;
  templateId?: string;
  userId?: string;
  fallbackUsed?: boolean;
  toolCallCount?: number;
  reasoningTokens?: number;
  totalTokens?: number;
  durationMs?: number;
  error?: string;
}

/**
 * Log template generation metadata for metrics tracking
 */
export function logGenerationMetrics(metadata: GenerationMetadata): void {
  logger.info('[AI Metrics] Template generation completed', {
    ...metadata,
    timestamp: new Date().toISOString(),
  });
}

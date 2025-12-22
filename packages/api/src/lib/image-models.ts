/**
 * Image Model Configuration
 * Centralized configuration for image generation models
 * Update this file to add/remove/change premium models without touching the database
 * 
 * Models sourced from: apps/web/src/app/app/[id]/components/image-studio/types.ts
 */

export type ImageModelTier = "standard" | "premium";

export interface ImageModelConfig {
  id: string;
  name: string;
  label: string;
  tier: ImageModelTier;
  costPerImage: number; // USD
  description: string;
  isEditModel: boolean;
  isDefault?: boolean;
}

/**
 * Available image generation models (Fal AI)
 * 
 * Tier Access:
 * - Trial/Starter: Standard tier only (Qwen models)
 * - Pro/Scale: Standard + Premium tier (all models)
 */
export const IMAGE_MODELS: Record<string, ImageModelConfig> = {
  // ============================================================================
  // Standard Tier - Available to all plans (Trial, Starter, Pro, Scale)
  // ============================================================================
  
  "fal-ai/qwen-image": {
    id: "fal-ai/qwen-image",
    name: "Qwen Image",
    label: "Text Render",
    tier: "standard",
    costPerImage: 0.02,
    description: "Complex text rendering - best for images with text",
    isEditModel: false,
    isDefault: true,
  },

  "fal-ai/qwen-image/image-to-image": {
    id: "fal-ai/qwen-image/image-to-image",
    name: "Qwen Image Edit",
    label: "Text Render Edit",
    tier: "standard",
    costPerImage: 0.02,
    description: "Qwen Image with edit capabilities",
    isEditModel: true,
  },

  // ============================================================================
  // Premium Tier - Pro/Scale plans only
  // ============================================================================

  "fal-ai/nano-banana-pro": {
    id: "fal-ai/nano-banana-pro",
    name: "Nano Banana Pro",
    label: "Realistic",
    tier: "premium",
    costPerImage: 0.15,
    description: "High-quality realistic image generation",
    isEditModel: false,
    isDefault: true, // Default premium model
  },

  "fal-ai/nano-banana-pro/edit": {
    id: "fal-ai/nano-banana-pro/edit",
    name: "Nano Banana Pro Edit",
    label: "Realistic Edit",
    tier: "premium",
    costPerImage: 0.15,
    description: "Nano Banana Pro with edit capabilities",
    isEditModel: true,
  },

  "fal-ai/flux-2-flex": {
    id: "fal-ai/flux-2-flex",
    name: "Flux 2 Flex",
    label: "Stylistic",
    tier: "premium",
    costPerImage: 0.12,
    description: "Stylistic image generation",
    isEditModel: false,
  },

  "fal-ai/flux-2-flex/edit": {
    id: "fal-ai/flux-2-flex/edit",
    name: "Flux 2 Flex Edit",
    label: "Stylistic Edit",
    tier: "premium",
    costPerImage: 0.12,
    description: "Flux 2 Flex with edit capabilities",
    isEditModel: true,
  },
};

// Default models - guaranteed to exist
const DEFAULT_STANDARD_MODEL = IMAGE_MODELS["fal-ai/qwen-image"]!;
const DEFAULT_PREMIUM_MODEL = IMAGE_MODELS["fal-ai/nano-banana-pro"]!;

/**
 * Get all standard tier models
 */
export function getStandardModels(): ImageModelConfig[] {
  return Object.values(IMAGE_MODELS).filter((m) => m.tier === "standard");
}

/**
 * Get all premium tier models
 */
export function getPremiumModels(): ImageModelConfig[] {
  return Object.values(IMAGE_MODELS).filter((m) => m.tier === "premium");
}

/**
 * Get the default model for a tier
 */
export function getDefaultModel(tier: ImageModelTier): ImageModelConfig {
  const models = Object.values(IMAGE_MODELS).filter((m) => m.tier === tier);
  const defaultModel = models.find((m) => m.isDefault);
  if (defaultModel) return defaultModel;
  if (models.length > 0) return models[0]!;
  return tier === "premium" ? DEFAULT_PREMIUM_MODEL : DEFAULT_STANDARD_MODEL;
}

/**
 * Get model by ID
 */
export function getModelById(modelId: string): ImageModelConfig | undefined {
  return IMAGE_MODELS[modelId];
}

/**
 * Check if a model is premium tier
 */
export function isPremiumModel(modelId: string): boolean {
  return IMAGE_MODELS[modelId]?.tier === "premium";
}

/**
 * Check if a model is an edit model (requires reference images)
 */
export function isEditModel(modelId: string): boolean {
  return IMAGE_MODELS[modelId]?.isEditModel ?? false;
}

/**
 * Get available models for a user based on their plan
 */
export function getAvailableModels(hasPremiumAccess: boolean): ImageModelConfig[] {
  if (hasPremiumAccess) {
    return Object.values(IMAGE_MODELS);
  }
  return getStandardModels();
}

/**
 * Get available model IDs for a user based on their plan
 */
export function getAvailableModelIds(hasPremiumAccess: boolean): string[] {
  return getAvailableModels(hasPremiumAccess).map((m) => m.id);
}

/**
 * Check if a user can use a specific model
 */
export function canUseModel(modelId: string, hasPremiumAccess: boolean): boolean {
  const model = IMAGE_MODELS[modelId];
  if (!model) return false;
  if (model.tier === "standard") return true;
  return hasPremiumAccess;
}

/**
 * Select the best available model for a user
 * Returns the requested model if allowed, otherwise falls back to default
 */
export function selectImageModel(
  hasPremiumAccess: boolean,
  preferredModelId?: string
): ImageModelConfig {
  // If user has a preference and can use it, return that
  if (preferredModelId) {
    const model = getModelById(preferredModelId);
    if (model && canUseModel(preferredModelId, hasPremiumAccess)) {
      return model;
    }
  }

  // Default: return appropriate tier's default model
  if (hasPremiumAccess) {
    return getDefaultModel("premium");
  }
  return getDefaultModel("standard");
}

/**
 * Get the cost for generating an image with a specific model
 */
export function getModelCost(modelId: string): number {
  return IMAGE_MODELS[modelId]?.costPerImage ?? 0.02;
}

// ============================================================================
// Constants for easy reference
// ============================================================================

export const CURRENT_STANDARD_MODEL_ID = "fal-ai/qwen-image";
export const CURRENT_PREMIUM_MODEL_ID = "fal-ai/nano-banana-pro";

/** Model ID for "auto" selection - resolved server-side based on plan */
export const MODEL_AUTO = "auto";

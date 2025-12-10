import { z } from "zod";

// ============================================================================
// Image Asset Types (shared between API and client)
// ============================================================================

/**
 * Core image asset type from database
 */
export interface ImageAsset {
  id: string;
  url: string;
  storageKey: string;
  contentType: string | null;
  width: number | null;
  height: number | null;
  aspectRatio: string | null;
  prompt: string | null;
  model: string | null;
  blurDataUrl: string | null; // Base64 LQIP placeholder for next/image blur
  organizationId: string;
  userId: string;
  templateId: string | null;
  versionId: string | null;
  createdAt: Date | string;
}

/**
 * Generated image result (lighter type for generation responses)
 */
export interface GeneratedImage {
  id: string;
  url: string;
  width?: number;
  height?: number;
}

/**
 * Image asset for preview/display (subset of full asset)
 */
export interface PreviewImageAsset {
  id: string;
  url: string;
  prompt?: string | null;
  model?: string | null;
  width?: number | null;
  height?: number | null;
  aspectRatio?: string | null;
  contentType?: string | null;
  blurDataUrl?: string | null; // Base64 LQIP placeholder for next/image blur
  createdAt: Date | string;
}

// ============================================================================
// Upload Types
// ============================================================================

/**
 * Response from createUploadUrl procedure
 */
export interface PresignedUploadResponse {
  uploadUrl: string;
  publicUrl: string;
  storageKey: string;
  expiresAt: string;
}


// ============================================================================
// Constants
// ============================================================================

export const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/svg+xml",
  "image/webp",
] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_IMAGE_DIMENSION = 4096; // Max width/height for uploads

// ============================================================================
// Image format utilities
// ============================================================================

export const MODEL_AUTO = "__auto__";

/** Models that don't support webp output (only png/jpeg) */
export const isWebpUnsupported = (modelValue: string) =>
  modelValue.includes("flux-2-flex") || modelValue.includes("qwen-image");

/** Get the best output format for a model */
export function getOutputFormatForModel(
  model: string,
  preferred: string = "webp"
): "png" | "jpeg" | "webp" {
  if (isWebpUnsupported(model) && preferred === "webp") {
    return "png";
  }
  return preferred as "png" | "jpeg" | "webp";
}

/** Edit models include "/edit" or "/image-to-image" in their value */
export const isEditModel = (value: string) =>
  value === MODEL_AUTO ||
  value.includes("/edit") ||
  value.includes("/image-to-image");

/** Check if a model strictly requires reference images */
export const requiresReferenceImages = (value: string) =>
  value !== MODEL_AUTO &&
  (value.includes("/edit") || value.includes("/image-to-image"));

// ============================================================================
// Validation Schemas
// ============================================================================

export const uploadFileSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.type.startsWith("image/"), {
      message: "Please select an image file",
    })
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: "Image must be less than 5MB",
    }),
});

export const createUploadUrlSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  contentType: z.enum(ALLOWED_IMAGE_TYPES as unknown as [string, ...string[]]),
  fileSize: z.number().max(MAX_FILE_SIZE, "File too large. Maximum size is 5MB."),
  templateId: z.string().optional(),
  versionId: z.string().optional(),
  purpose: z.enum(["image", "logo", "template-reference"]).optional(),
});

export const confirmUploadSchema = z.object({
  storageKey: z.string().min(1, "Storage key is required"),
  contentType: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  templateId: z.string().optional(),
  versionId: z.string().optional(),
});

export type CreateUploadUrlInput = z.infer<typeof createUploadUrlSchema>;
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;

// ============================================================================
// Image Generation Schemas
// ============================================================================

const ASPECT_RATIOS_VALUES = [
  "auto",
  "21:9",
  "16:9",
  "3:2",
  "4:3",
  "5:4",
  "1:1",
  "4:5",
  "3:4",
  "2:3",
  "9:16",
] as const;

const OUTPUT_FORMAT_VALUES = ["png", "jpeg", "webp"] as const;
const RESOLUTION_VALUES = ["1K", "2K", "4K"] as const;

export const imageGenerationInputSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  organizationId: z.string(),
  templateId: z.string().optional(),
  versionId: z.string().optional(),
  imageUrls: z.array(z.string().url()).optional(),
  numImages: z.number().int().min(1).max(4).optional(),
  aspectRatio: z.enum(ASPECT_RATIOS_VALUES).optional(),
  outputFormat: z.enum(OUTPUT_FORMAT_VALUES).optional(),
  resolution: z.enum(RESOLUTION_VALUES).optional(),
  limitGenerations: z.boolean().optional(),
  enableWebSearch: z.boolean().optional(),
  guidanceScale: z.number().min(1).max(20).optional(),
  strength: z.number().min(0).max(1).optional(),
  model: z.string().optional(),
  includeBrandGuide: z.boolean().optional(),
});

export type ImageGenerationInput = z.infer<typeof imageGenerationInputSchema>;

/**
 * Response from image generation
 */
export interface ImageGenerationResponse {
  requestId?: string;
  model: string;
  elapsedMs?: number;
  images: Array<{
    id: string;
    url: string;
    width?: number | null;
    height?: number | null;
    contentType?: string | null;
    aspectRatio?: string | null;
    nsfw?: boolean | null;
    requestId?: string | null;
  }>;
}

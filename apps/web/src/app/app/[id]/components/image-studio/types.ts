import { z } from "zod";

// ============================================================================
// Types
// ============================================================================

export interface GeneratedImage {
  id: string;
  url: string;
  width?: number;
  height?: number;
}

export type ImageNodeData = {
  url: string;
  alt: string;
  width?: number;
  height?: number;
  isLoading?: boolean;
};

// ============================================================================
// Constants
// ============================================================================

export const MODEL_AUTO = "__auto__"; // Special value for default/env model

export const ASPECT_RATIOS = [
  { value: "auto", label: "Auto" },
  { value: "1:1", label: "1:1 (Square)" },
  { value: "16:9", label: "16:9 (Wide)" },
  { value: "9:16", label: "9:16 (Portrait)" },
  { value: "4:3", label: "4:3" },
  { value: "3:4", label: "3:4" },
  { value: "21:9", label: "21:9 (Ultra Wide)" },
] as const;

export const OUTPUT_FORMATS = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPEG" },
  { value: "webp", label: "WebP" },
] as const;

export const AI_MODELS = [
  {
    id: 0,
    value: MODEL_AUTO,
    label: "Auto (Default)",
    description: "Uses system default model",
  },
  {
    id: 1,
    value: "fal-ai/flux-2-flex",
    label: "Stylistic",
    description: "Flux 2 Flex",
  },
  {
    id: 2,
    value: "fal-ai/flux-2-flex/edit",
    label: "Stylistic Edit",
    description: "Flux 2 Flex with Edit",
  },
  {
    id: 3,
    value: "fal-ai/nano-banana-pro",
    label: "Realistic",
    description: "Nano Banana Pro",
  },
  {
    id: 4,
    value: "fal-ai/nano-banana-pro/edit",
    label: "Realistic Edit",
    description: "Nano Banana Pro with Edit",
  },
  {
    id: 5,
    value: "fal-ai/qwen-image",
    label: "Text Render",
    description: "Qwen Image - Complex text rendering",
  },
  {
    id: 6,
    value: "fal-ai/qwen-image/image-to-image",
    label: "Text Render Edit",
    description: "Qwen Image with Edit",
  },
] as const;

export const PROMPT_TEMPLATES = [
  {
    label: "Product Shot",
    prompt:
      "Professional product photography, clean white background, soft studio lighting, high-end commercial quality",
  },
  {
    label: "Hero Image",
    prompt:
      "Stunning hero image for email marketing, vibrant colors, modern design, eye-catching composition",
  },
  {
    label: "Lifestyle",
    prompt:
      "Natural lifestyle photography, authentic setting, warm natural lighting, aspirational feel",
  },
  {
    label: "Abstract",
    prompt:
      "Abstract geometric design, modern minimalist style, bold colors, clean composition",
  },
] as const;

// ============================================================================
// Utilities
// ============================================================================

/** Models that don't support webp output (only png/jpeg) */
export const isWebpUnsupported = (modelValue: string) =>
  modelValue.includes("flux-2-flex") || modelValue.includes("qwen-image");

/** Edit models include "/edit" or "/image-to-image" in their value */
export const isEditModel = (value: string) =>
  value === MODEL_AUTO ||
  value.includes("/edit") ||
  value.includes("/image-to-image");

/** Check if a model strictly requires reference images (edit model but NOT auto) */
export const requiresReferenceImages = (value: string) =>
  value !== MODEL_AUTO &&
  (value.includes("/edit") || value.includes("/image-to-image"));

// ============================================================================
// Zod Schemas
// ============================================================================

/** URL validation - supports http/https URLs */
const urlSchema = z.url("Invalid URL format").or(z.literal(""));

/** Reference image URL line validation */
const referenceUrlLineSchema = z
  .string()
  .refine(
    (val) => {
      if (!val.trim()) return true; // Empty is OK
      return val.startsWith("http://") || val.startsWith("https://");
    },
    { message: "URL must start with http:// or https://" }
  );

/** Schema for generation form */
export const generateFormSchema = z
  .object({
    prompt: z
      .string()
      .min(1, "Please enter a prompt to generate an image")
      .max(2000, "Prompt must be less than 2000 characters"),
    model: z.string(),
    aspectRatio: z.string(),
    outputFormat: z.enum(["png", "jpeg", "webp"]),
    useReferenceImages: z.boolean(),
    referenceImageUrls: z.string(),
  })
  .refine(
    (data) => {
      // If reference images are enabled OR model requires reference images, we need at least one valid URL
      const modelRequiresRef = requiresReferenceImages(data.model);
      if (data.useReferenceImages || modelRequiresRef) {
        const urls = data.referenceImageUrls
          .split("\n")
          .map((line) => line.trim())
          .filter(
            (line) =>
              line.length > 0 &&
              (line.startsWith("http://") || line.startsWith("https://"))
          );
        return urls.length > 0;
      }
      return true;
    },
    {
      message: "Edit models require at least one reference image URL",
      path: ["referenceImageUrls"],
    }
  );

export type GenerateFormData = z.infer<typeof generateFormSchema>;

/** Schema for file upload */
export const uploadFileSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.type.startsWith("image/"), {
      message: "Please select an image file",
    })
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "Image must be less than 5MB",
    }),
});

export type UploadFileData = z.infer<typeof uploadFileSchema>;

// ============================================================================
// Form Error Types
// ============================================================================

export interface GenerateFormErrors {
  prompt?: string;
  referenceImageUrls?: string;
}

import { createFal, fal as defaultFal } from "@ai-sdk/fal";
import { serverEnv } from "@mocah/config/env";

// Configure provider with API key/base URL overrides.
// Falls back to the default provider when no overrides are present.
const imageProvider =
  serverEnv.FAL_API_KEY || serverEnv.FAL_BASE_URL
    ? createFal({
        apiKey: serverEnv.FAL_API_KEY,
        baseURL: serverEnv.FAL_BASE_URL,
      })
    : defaultFal;

// Default models for text-to-image and image-to-image editing
const DEFAULT_IMAGE_MODEL =
  serverEnv.FAL_IMAGE_MODEL || "fal-ai/nano-banana-pro";
const DEFAULT_IMAGE_EDIT_MODEL =
  serverEnv.FAL_IMAGE_EDIT_MODEL || "fal-ai/nano-banana-pro/edit";

/** Returns an image model instance for text-to-image generation. */
export function getImageModel(
  modelId?: string
): ReturnType<typeof imageProvider.image> {
  return imageProvider.image(modelId || DEFAULT_IMAGE_MODEL);
}

/** Returns an image model instance for image-to-image editing. */
export function getImageEditModel(
  modelId?: string
): ReturnType<typeof imageProvider.image> {
  return imageProvider.image(modelId || DEFAULT_IMAGE_EDIT_MODEL);
}

/** Returns the default model ID for text-to-image generation. */
export function getDefaultImageModelId(): string {
  return DEFAULT_IMAGE_MODEL;
}

/** Returns the default model ID for image-to-image editing. */
export function getDefaultImageEditModelId(): string {
  return DEFAULT_IMAGE_EDIT_MODEL;
}

/** Returns the configured image provider instance. */
export function getImageProvider(): typeof imageProvider {
  return imageProvider;
}

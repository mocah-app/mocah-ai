import { PutObjectCommand } from "@aws-sdk/client-s3";
import { experimental_generateImage as generateImage } from "ai";
import prisma from "@mocah/db";
import {
  getImageModel,
  getImageEditModel,
  getDefaultImageModelId,
  getDefaultImageEditModelId,
} from "@mocah/api/lib/fal";
import {
  TIGRIS_BUCKET,
  generateStoragePath,
  getPublicUrl,
  s3Client,
} from "@mocah/api/lib/s3";
import {
  processGeneratedImage,
  getContentType,
} from "@mocah/api/lib/image-processing";
import {
  logger,
  imageGenerationInputSchema,
  type ImageGenerationInput,
} from "@mocah/shared";
import { buildImageGenerationPrompt } from "@mocah/api/lib/prompts";

// JSONValue type for providerOptions
type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

// Models that use image_size parameter instead of aspectRatio
// These need snake_case since SDK doesn't auto-convert model-specific params
const IMAGE_SIZE_MODELS = ["fal-ai/qwen-image", "fal-ai/flux-2-flex"];

// Map aspect ratio to image_size for qwen-image model
// Supported enum values: square_hd, square, portrait_4_3, portrait_16_9, landscape_4_3, landscape_16_9
// For unsupported ratios, returns { width, height } object
function aspectRatioToImageSize(
  aspectRatio: string
): string | { width: number; height: number } {
  // Direct mappings to supported enum values
  const enumMapping: Record<string, string> = {
    "16:9": "landscape_16_9",
    "4:3": "landscape_4_3",
    "1:1": "square_hd",
    "3:4": "portrait_4_3",
    "9:16": "portrait_16_9",
  };

  if (enumMapping[aspectRatio]) {
    return enumMapping[aspectRatio];
  }

  // For unsupported ratios, calculate custom dimensions (base ~1024px on longer side)
  const customSizes: Record<string, { width: number; height: number }> = {
    "21:9": { width: 1536, height: 660 },
    "3:2": { width: 1024, height: 683 },
    "5:4": { width: 1024, height: 819 },
    "4:5": { width: 819, height: 1024 },
    "2:3": { width: 683, height: 1024 },
  };

  return customSizes[aspectRatio] || "landscape_4_3";
}

// Check if model uses image_size parameter
function usesImageSizeParam(modelId: string): boolean {
  return IMAGE_SIZE_MODELS.some(
    (m) => modelId === m || modelId.startsWith(m + "/")
  );
}

// Re-export from shared for backwards compatibility
export { imageGenerationInputSchema, type ImageGenerationInput };

interface GenerationContext {
  userId: string;
}

export async function runFalImageGeneration(
  input: ImageGenerationInput,
  ctx: GenerationContext
) {
  const started = Date.now();
  
  // Fetch brand kit data to enhance prompt with brand context (only if includeBrandGuide is true)
  const shouldIncludeBrandGuide = input.includeBrandGuide !== false; // Default to true for backward compatibility
  let brandKit = null;
  
  if (shouldIncludeBrandGuide) {
    try {
      const organization = await prisma.organization.findUnique({
        where: { id: input.organizationId },
        select: {
          brandKit: {
            select: {
              // Core colors
              primaryColor: true,
              accentColor: true,
              backgroundColor: true,
              textPrimaryColor: true,
              
              // Typography & Voice
              fontFamily: true,
              brandVoice: true,
              
              // Layout
              borderRadius: true,
              
              // Brand personality
              brandTone: true,
              brandEnergy: true,
              targetAudience: true,
              
              // Company information
              companyName: true,
              companyDescription: true,
              tagline: true,
              industry: true,
              productsServices: true,
              brandValues: true,
              contactEmail: true,
              foundingYear: true,
              
              // Website data
              websiteUrl: true,
              summary: true,
            },
          },
        },
      });
      
      if (organization?.brandKit) {
        const rawBrandKit = organization.brandKit;
        // Transform JSON fields to expected types
        brandKit = {
          ...rawBrandKit,
          productsServices: Array.isArray(rawBrandKit.productsServices) 
            ? (rawBrandKit.productsServices as string[]) 
            : null,
          brandValues: Array.isArray(rawBrandKit.brandValues) 
            ? (rawBrandKit.brandValues as string[]) 
            : null,
        };
      }
    } catch (error) {
      logger.warn("Failed to fetch brand kit for image generation", {
        organizationId: input.organizationId,
        error,
      });
      // Continue without brand context if fetch fails
    }
  }
  
  // Enhance prompt with brand context only if brand guide is enabled
  const enhancedPrompt = brandKit 
    ? buildImageGenerationPrompt(input.prompt, brandKit as any)
    : input.prompt;
    
  logger.info("🎨 Image generation prompt prepared", {
    originalPrompt: input.prompt.slice(0, 100),
    includeBrandGuide: shouldIncludeBrandGuide,
    hasBrandContext: !!brandKit,
    companyName: brandKit?.companyName,
  });
  
  // Use edit model when imageUrls are provided, otherwise use generation model
  const isEditMode = input.imageUrls && input.imageUrls.length > 0;
  const model = isEditMode
    ? getImageEditModel(input.model)
    : getImageModel(input.model);
  const modelId =
    input.model ||
    (isEditMode ? getDefaultImageEditModelId() : getDefaultImageModelId());

  // @ai-sdk/fal expects camelCase - SDK converts to snake_case internally
  // Different models use different size parameters:
  // - nano-banana-pro: aspectRatio ("9:16", "16:9", etc.)
  // - qwen-image: imageSize ("portrait_16_9", "landscape_16_9", or {width, height})
  const useImageSize = usesImageSizeParam(modelId);

  // Build providerOptions imperatively to ensure no undefined values
  const providerOptions: Record<string, JSONValue> = { syncMode: true };

  // Note: use snake_case - SDK doesn't auto-convert model-specific params
  // qwen-image/image-to-image expects image_url (singular), others expect image_urls (plural)
  if (input.imageUrls && input.imageUrls.length > 0) {
    if (modelId === "fal-ai/qwen-image/image-to-image") {
      providerOptions.image_url = input.imageUrls[0]!;
    } else {
      providerOptions.image_urls = input.imageUrls;
    }
  }
  if (input.numImages) providerOptions.numImages = input.numImages;
  if (input.outputFormat) providerOptions.outputFormat = input.outputFormat;
  if (!useImageSize && input.resolution) providerOptions.resolution = input.resolution;
  if (input.limitGenerations !== undefined) providerOptions.limitGenerations = input.limitGenerations;
  if (input.enableWebSearch !== undefined) providerOptions.enableWebSearch = input.enableWebSearch;
  if (input.guidanceScale) providerOptions.guidanceScale = input.guidanceScale;
  if (input.strength !== undefined) providerOptions.strength = input.strength;

  // Add size parameter based on model type
  // Note: image_size uses snake_case because SDK doesn't auto-convert model-specific params
  if (input.aspectRatio) {
    if (useImageSize) {
      const imageSize = aspectRatioToImageSize(input.aspectRatio);
      providerOptions.image_size = imageSize;
    } else {
      providerOptions.aspectRatio = input.aspectRatio;
    }
  }

  logger.info("🖼️ Starting Fal image generation", {
    model: modelId,
    isEditMode,
    aspectRatio: input.aspectRatio,
    providerOptions,
    prompt: input.prompt.slice(0, 100),
  });

  let result;
  try {
    result = await generateImage({
      model,
      prompt: enhancedPrompt,
      providerOptions: {
        fal: providerOptions,
      },
    });
  } catch (error: any) {
    // Parse Fal API errors for better error messages
    if (error?.name === "AI_APICallError" || error?.statusCode) {
      const statusCode = error.statusCode || 500;
      let message = error.message || "Fal API error";
      
      // Try to extract detail from responseBody
      if (error.responseBody) {
        try {
          const body = typeof error.responseBody === "string" 
            ? JSON.parse(error.responseBody) 
            : error.responseBody;
          if (body.detail) {
            if (Array.isArray(body.detail)) {
              message = body.detail.map((d: any) => 
                `${d.loc?.join(".")}: ${d.msg}`
              ).join("; ");
            } else {
              message = body.detail;
            }
          }
        } catch {
          // Keep original message if parsing fails
        }
      }
      
      logger.error("❌ Fal API error", {
        statusCode,
        message,
        url: error.url,
        requestId: error.responseHeaders?.["x-fal-request-id"],
        model: modelId,
      });
      
      const err = new Error(`Fal API error (${statusCode}): ${message}`);
      (err as any).statusCode = statusCode;
      throw err;
    }
    throw error;
  }

  const falMetadata = (result.providerMetadata as any)?.fal ?? {};
  const falImages: Array<{
    url?: string;
    content_type?: string;
    contentType?: string; // SDK may return camelCase
    width?: number;
    height?: number;
    nsfw?: boolean;
  }> = falMetadata.images || [];


  if (falImages.some((img) => img?.nsfw)) {
    logger.warn("🚫 NSFW image detected from Fal", {
      userId: ctx.userId,
      organizationId: input.organizationId,
      templateId: input.templateId,
      model: modelId,
    });
    throw new Error("NSFW content detected in generated images");
  }

  const requestId: string | undefined =
    falMetadata.requestId || falMetadata.request_id;

  // AI SDK (@ai-sdk/fal) returns:
  // - result.images[] with base64Data/uint8ArrayData for actual image bytes
  // - providerMetadata.fal.images[] with metadata (width, height, contentType, nsfw)
  // See: https://sdk.vercel.ai/providers/ai-sdk-providers/fal
  const resultImages = (result as any).images || [];
  
  const processedImages: Array<{
    url?: string;
    buffer?: Buffer;
    content_type: string;
    width?: number;
    height?: number;
    nsfw?: boolean;
  }> = [];

  for (let i = 0; i < Math.max(falImages.length, resultImages.length); i++) {
    const meta = falImages[i] || {};
    const img = resultImages[i];
    const metaContentType = meta.contentType || meta.content_type;
    
    if (img?.base64Data) {
      const mimeType = img.mediaType || metaContentType || "image/png";
      processedImages.push({
        buffer: Buffer.from(img.base64Data, "base64"),
        content_type: mimeType,
        width: meta.width,
        height: meta.height,
        nsfw: meta.nsfw || false,
      });
    } else if (img?.uint8ArrayData) {
      const mimeType = img.mediaType || metaContentType || "image/png";
      processedImages.push({
        buffer: Buffer.from(img.uint8ArrayData),
        content_type: mimeType,
        width: meta.width,
        height: meta.height,
        nsfw: meta.nsfw || false,
      });
    } else if (meta.url) {
      // Legacy: if URL is provided directly
      processedImages.push({
        url: meta.url,
        content_type: metaContentType || "image/png",
        width: meta.width,
        height: meta.height,
        nsfw: meta.nsfw || false,
      });
    }
  }

  if (processedImages.length === 0) {
    logger.error("❌ No images returned from Fal", {
      model: modelId,
      falImagesCount: falImages.length,
      resultImagesCount: resultImages.length,
    });
    throw new Error("Fal did not return any images");
  }

  const uploads = await Promise.all(
    processedImages.map(async (img, index) => {
      let originalBuffer: Buffer;

      if (img.buffer) {
        // Use buffer directly from base64/uint8Array data
        originalBuffer = img.buffer;
      } else if (img.url) {
        // Legacy: download from URL
        const response = await fetch(img.url);
        if (!response.ok) {
          throw new Error(`Failed to download image from Fal: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        originalBuffer = Buffer.from(arrayBuffer);
      } else {
        throw new Error("Image has neither buffer nor URL");
      }

      // Process the generated image (optimize + generate blur placeholder)
      const processed = await processGeneratedImage(originalBuffer, input.outputFormat);
      
      const extension = processed.format === "jpeg" ? "jpg" : processed.format;
      const filePath = generateStoragePath(
        `mocah-image-${Date.now()}-${index}.${extension}`,
        "images"
      );

      const finalContentType = getContentType(processed.format);

      await s3Client.send(
        new PutObjectCommand({
          Bucket: TIGRIS_BUCKET,
          Key: filePath,
          Body: processed.buffer,
          ContentType: finalContentType,
          Metadata: {
            "user-id": ctx.userId,
            "organization-id": input.organizationId,
            ...(input.templateId ? { "template-id": input.templateId } : {}),
            ...(input.versionId ? { "version-id": input.versionId } : {}),
            optimized: "true",
          },
          ServerSideEncryption: "AES256",
        })
      );

      const publicUrl = getPublicUrl(filePath);

      // Log compression stats
      const savings = ((1 - processed.size / originalBuffer.length) * 100).toFixed(1);
      logger.info("🖼️ Generated image optimized", {
        original: `${(originalBuffer.length / 1024).toFixed(1)}KB`,
        optimized: `${(processed.size / 1024).toFixed(1)}KB`,
        savings: `${savings}%`,
        dimensions: `${processed.width}x${processed.height}`,
      });

      const record = await prisma.imageAsset.create({
        data: {
          organizationId: input.organizationId,
          userId: ctx.userId,
          templateId: input.templateId,
          versionId: input.versionId,
          prompt: input.prompt,
          model: modelId,
          requestId,
          url: publicUrl,
          storageKey: filePath,
          contentType: finalContentType,
          aspectRatio: input.aspectRatio,
          width: processed.width,
          height: processed.height,
          blurDataUrl: processed.blurDataUrl,
          nsfw: img.nsfw || false,
          metadata: {
            provider: "fal",
            requestId,
            providerMetadata: falMetadata,
            originalSize: originalBuffer.length,
            optimizedSize: processed.size,
          },
        },
      });

      return {
        id: record.id,
        url: record.url,
        width: record.width,
        height: record.height,
        blurDataUrl: record.blurDataUrl,
        contentType: record.contentType,
        aspectRatio: record.aspectRatio,
        nsfw: record.nsfw,
        requestId: record.requestId,
      };
    })
  );

  const elapsedMs = Date.now() - started;

  logger.info("✅ Fal image generation complete", {
    organizationId: input.organizationId,
    templateId: input.templateId,
    versionId: input.versionId,
    userId: ctx.userId,
    promptPreview: input.prompt.slice(0, 100),
    model: modelId,
    count: uploads.length,
    elapsedMs,
  });

  return {
    requestId,
    model: modelId,
    elapsedMs,
    images: uploads,
  };
}

// ============================================================================
// External Image Re-upload to CDN
// ============================================================================

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Re-upload an external image URL to our CDN for reliability
 * Returns the CDN URL if successful, or the original URL on failure
 */
export async function reuploadExternalImageToCdn(
  url: string,
  options: {
    type?: "logo" | "image" | "favicon" | "og";
    userId?: string;
  } = {}
): Promise<{ url: string; wasReuploaded: boolean }> {
  const { type = "image", userId } = options;

  // Skip if already on our CDN
  if (url.includes("mocah.ai") || url.includes("storage.mocah.ai")) {
    return { url, wasReuploaded: false };
  }

  // Skip data URLs
  if (url.startsWith("data:")) {
    return { url, wasReuploaded: false };
  }

  try {
    // Download the external image
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mocah/1.0 (Brand Asset Fetcher)",
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      logger.warn(`[reuploadExternalImageToCdn] Failed to fetch: ${response.status}`, { url });
      return { url, wasReuploaded: false };
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate size
    if (buffer.length > MAX_IMAGE_SIZE) {
      logger.warn("[reuploadExternalImageToCdn] File too large", { url, size: buffer.length });
      return { url, wasReuploaded: false };
    }

    // Validate content type
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml", "image/gif", "image/x-icon", "image/vnd.microsoft.icon"];
    const normalizedType = (contentType.split(";")[0] || "").trim();
    if (!validTypes.includes(normalizedType)) {
      logger.warn(`[reuploadExternalImageToCdn] Invalid content type: ${contentType}`, { url });
      return { url, wasReuploaded: false };
    }

    // Extract filename from URL or generate one
    const urlPath = new URL(url).pathname;
    const originalName = urlPath.split("/").pop() || `${type}-${Date.now()}`;
    const ext = normalizedType.split("/")[1]?.replace("x-icon", "ico").replace("vnd.microsoft.icon", "ico") || "png";
    const filename = originalName.includes(".") ? originalName : `${originalName}.${ext}`;

    // Generate storage path based on type
    const prefixMap: Record<string, string> = {
      logo: "logos",
      favicon: "favicons",
      og: "og-images",
      image: "images",
    };
    const prefix = prefixMap[type] || "images";
    const filePath = generateStoragePath(filename, prefix);

    // Upload to our CDN
    const putCommand = new PutObjectCommand({
      Bucket: TIGRIS_BUCKET,
      Key: filePath,
      Body: buffer,
      ContentType: normalizedType,
      Metadata: {
        ...(userId && { "user-id": userId }),
        "source-url": encodeURIComponent(url.substring(0, 500)),
        "upload-timestamp": Date.now().toString(),
      },
      ServerSideEncryption: "AES256",
    });

    await s3Client.send(putCommand);

    const cdnUrl = getPublicUrl(filePath);
    logger.info(`[reuploadExternalImageToCdn] Success`, { from: url, to: cdnUrl });

    return { url: cdnUrl, wasReuploaded: true };
  } catch (error) {
    logger.error("[reuploadExternalImageToCdn] Error", { url, error });
    return { url, wasReuploaded: false };
  }
}

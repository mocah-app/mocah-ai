import { PutObjectCommand } from "@aws-sdk/client-s3";
import { experimental_generateImage as generateImage } from "ai";
import { z } from "zod";
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
import { logger } from "@mocah/shared";

const ASPECT_RATIOS = [
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

const OUTPUT_FORMATS = ["png", "jpeg", "webp"] as const;
const RESOLUTIONS = ["1K", "2K", "4K"] as const;

export const imageGenerationInputSchema = z.object({
  prompt: z.string().min(1),
  organizationId: z.string(),
  templateId: z.string().optional(),
  versionId: z.string().optional(),
  imageUrls: z.array(z.string().url()).optional(),
  numImages: z.number().int().min(1).max(4).optional(),
  aspectRatio: z.enum(ASPECT_RATIOS).optional(),
  outputFormat: z.enum(OUTPUT_FORMATS).optional(),
  resolution: z.enum(RESOLUTIONS).optional(),
  limitGenerations: z.boolean().optional(),
  enableWebSearch: z.boolean().optional(),
  guidanceScale: z.number().min(1).max(20).optional(),
  strength: z.number().min(0).max(1).optional(),
  model: z.string().optional(),
});

export type ImageGenerationInput = z.infer<typeof imageGenerationInputSchema>;

interface GenerationContext {
  userId: string;
}

export async function runFalImageGeneration(
  input: ImageGenerationInput,
  ctx: GenerationContext
) {
  const started = Date.now();
  
  // Use edit model when imageUrls are provided, otherwise use generation model
  const isEditMode = input.imageUrls && input.imageUrls.length > 0;
  const model = isEditMode
    ? getImageEditModel(input.model)
    : getImageModel(input.model);
  const modelId =
    input.model ||
    (isEditMode ? getDefaultImageEditModelId() : getDefaultImageModelId());

  logger.info("🖼️ Starting Fal image generation", {
    model: modelId,
    isEditMode,
    prompt: input.prompt.slice(0, 100),
    imageUrls: input.imageUrls?.length || 0,
  });

  const providerOptions = {
    ...(input.imageUrls ? { image_urls: input.imageUrls } : {}),
    ...(input.numImages ? { numImages: input.numImages } : {}),
    ...(input.aspectRatio ? { aspectRatio: input.aspectRatio } : {}),
    ...(input.outputFormat ? { outputFormat: input.outputFormat } : {}),
    ...(input.resolution ? { resolution: input.resolution } : {}),
    ...(input.limitGenerations !== undefined
      ? { limitGenerations: input.limitGenerations }
      : {}),
    ...(input.enableWebSearch !== undefined
      ? { enableWebSearch: input.enableWebSearch }
      : {}),
    ...(input.guidanceScale ? { guidanceScale: input.guidanceScale } : {}),
    ...(input.strength !== undefined ? { strength: input.strength } : {}),
    syncMode: true,
  } as Record<string, string | number | boolean | string[]>;

  let result;
  try {
    result = await generateImage({
      model,
      prompt: input.prompt,
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
    const meta = falImages[i] || {} as any;
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
      let buffer: Buffer;
      let contentType = img.content_type;

      if (img.buffer) {
        // Use buffer directly from base64/uint8Array data
        buffer = img.buffer;
      } else if (img.url) {
        // Legacy: download from URL
        const response = await fetch(img.url);
        if (!response.ok) {
          throw new Error(`Failed to download image from Fal: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
        contentType = img.content_type || response.headers.get("content-type") || "image/png";
      } else {
        throw new Error("Image has neither buffer nor URL");
      }

      const extension =
        input.outputFormat === "jpeg"
          ? "jpg"
          : input.outputFormat || inferExtension(contentType) || "png";

      const filePath = generateStoragePath(
        `fal-image-${Date.now()}-${index}.${extension}`,
        "images"
      );

      await s3Client.send(
        new PutObjectCommand({
          Bucket: TIGRIS_BUCKET,
          Key: filePath,
          Body: buffer,
          ContentType: contentType || "image/png",
          Metadata: {
            "user-id": ctx.userId,
            "organization-id": input.organizationId,
            ...(input.templateId ? { "template-id": input.templateId } : {}),
            ...(input.versionId ? { "version-id": input.versionId } : {}),
          },
          ServerSideEncryption: "AES256",
        })
      );

      const publicUrl = getPublicUrl(filePath);

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
          contentType: contentType || "image/png",
          aspectRatio: input.aspectRatio,
          width: img.width,
          height: img.height,
          nsfw: img.nsfw || false,
          metadata: {
            provider: "fal",
            requestId,
            providerMetadata: falMetadata,
          },
        },
      });

      return {
        id: record.id,
        url: record.url,
        width: record.width,
        height: record.height,
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

function inferExtension(contentType?: string | null) {
  if (!contentType) return null;
  if (contentType.includes("jpeg")) return "jpg";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  return null;
}

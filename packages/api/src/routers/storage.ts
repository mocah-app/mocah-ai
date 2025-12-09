import { z } from "zod";
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { protectedProcedure, router } from "../index";
import { organizationProcedure } from "../middleware";
import {
  s3Client,
  TIGRIS_BUCKET,
  validateImageFile,
  generateStoragePath,
  getPublicUrl,
  createPresignedUploadUrl,
  PRESIGNED_URL_EXPIRY,
  MAX_FILE_SIZE,
  STORAGE_PREFIX_TEMPLATE_REFERENCES,
} from "../lib/s3";
import {
  processUploadedImage,
  getContentType,
} from "../lib/image-processing";
import {
  createUploadUrlSchema,
  confirmUploadSchema,
} from "@mocah/shared";
import { logger } from "@mocah/shared";

// Helper to calculate simplified aspect ratio
function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const w = width / divisor;
  const h = height / divisor;
  // Simplify common ratios
  if (w === 16 && h === 9) return "16:9";
  if (w === 9 && h === 16) return "9:16";
  if (w === 4 && h === 3) return "4:3";
  if (w === 3 && h === 4) return "3:4";
  if (w === 1 && h === 1) return "1:1";
  // For other ratios, return simplified form or approximate
  if (w > 100 || h > 100) {
    // Approximate to common ratios
    const ratio = width / height;
    if (Math.abs(ratio - 16 / 9) < 0.1) return "16:9";
    if (Math.abs(ratio - 9 / 16) < 0.1) return "9:16";
    if (Math.abs(ratio - 4 / 3) < 0.1) return "4:3";
    if (Math.abs(ratio - 3 / 4) < 0.1) return "3:4";
    if (Math.abs(ratio - 1) < 0.1) return "1:1";
  }
  return `${w}:${h}`;
}

export const storageRouter = router({
  // ============================================================================
  // Presigned Upload Flow (preferred - avoids base64 overhead)
  // ============================================================================

  /**
   * Step 1: Get a presigned URL for direct client-to-S3 upload
   */
  createUploadUrl: organizationProcedure
    .input(createUploadUrlSchema)
    .mutation(async ({ input, ctx }) => {
      const { fileName, contentType, templateId, versionId, purpose } = input;

      logger.info("📤 Creating presigned upload URL", {
        fileName,
        contentType,
        templateId,
        versionId,
        purpose,
        userId: ctx.session!.user.id,
        organizationId: ctx.organizationId,
      });

      // Generate storage path based on purpose
      const prefix = purpose === "template-reference" 
        ? STORAGE_PREFIX_TEMPLATE_REFERENCES 
        : purpose === "logo" 
        ? "logos" 
        : "images";
      const storageKey = generateStoragePath(fileName, prefix);

      // Build metadata for S3
      const sanitizedName = encodeURIComponent(fileName);
      const metadata: Record<string, string> = {
        "user-id": ctx.session!.user.id,
        "organization-id": ctx.organizationId,
        "original-name": sanitizedName,
        "upload-timestamp": Date.now().toString(),
      };
      if (templateId) metadata["template-id"] = templateId;
      if (versionId) metadata["version-id"] = versionId;

      try {
        const { uploadUrl, publicUrl } = await createPresignedUploadUrl({
          key: storageKey,
          contentType,
          metadata,
        });

        // Calculate expiry timestamp
        const expiresAt = new Date(
          Date.now() + PRESIGNED_URL_EXPIRY * 1000
        ).toISOString();

        // Parse URL to log query params (without exposing signature)
        const urlObj = new URL(uploadUrl);
        const queryParams = Object.fromEntries(urlObj.searchParams.entries());
        const safeParams = { ...queryParams };
        delete safeParams["X-Amz-Signature"]; // Don't log signature
        
        logger.info("✅ Presigned URL created", {
          storageKey,
          publicUrl,
          expiresAt,
          urlHost: urlObj.host,
          urlPath: urlObj.pathname,
          queryParams: safeParams,
          metadataKeys: Object.keys(metadata),
        });

        return {
          uploadUrl,
          publicUrl,
          storageKey,
          expiresAt,
        };
      } catch (error) {
        logger.error("❌ Failed to create presigned URL", {
          fileName,
          contentType,
          storageKey,
          error: error instanceof Error ? error.message : String(error),
        });
        throw new Error("Failed to generate upload URL");
      }
    }),

  /**
   * Step 2: Confirm upload, process image, and create database record
   * Downloads the uploaded image from S3, optimizes it, re-uploads, and creates record
   */
  confirmUpload: organizationProcedure
    .input(
      confirmUploadSchema.extend({
        skipOptimization: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const {
        storageKey,
        contentType,
        fileName,
        fileSize,
        width: inputWidth,
        height: inputHeight,
        templateId,
        versionId,
        skipOptimization = false,
      } = input;

      try {
        let finalStorageKey = storageKey;
        let finalContentType = contentType;
        let finalWidth = inputWidth;
        let finalHeight = inputHeight;
        let finalSize = fileSize;
        let blurDataUrl: string | undefined;

        // Process image if optimization is enabled
        if (!skipOptimization) {
          // Download the uploaded image from S3
          const getCommand = new GetObjectCommand({
            Bucket: TIGRIS_BUCKET,
            Key: storageKey,
          });

          const s3Response = await s3Client.send(getCommand);
          const originalBuffer = Buffer.from(
            await s3Response.Body!.transformToByteArray()
          );

          // Process the image (optimize + generate blur placeholder)
          const processed = await processUploadedImage(originalBuffer, contentType);

          // Generate new storage key with correct extension
          const extension = processed.format === "jpeg" ? "jpg" : processed.format;
          const baseName = fileName.replace(/\.[^.]+$/, "");
          finalStorageKey = generateStoragePath(`${baseName}.${extension}`, "images");

          // Upload optimized image
          const putCommand = new PutObjectCommand({
            Bucket: TIGRIS_BUCKET,
            Key: finalStorageKey,
            Body: processed.buffer,
            ContentType: getContentType(processed.format),
            Metadata: {
              "user-id": ctx.session!.user.id,
              "organization-id": ctx.organizationId,
              ...(templateId ? { "template-id": templateId } : {}),
              ...(versionId ? { "version-id": versionId } : {}),
              "original-name": encodeURIComponent(fileName),
              "upload-timestamp": Date.now().toString(),
              optimized: "true",
            },
            ServerSideEncryption: "AES256",
          });

          await s3Client.send(putCommand);

          // Delete original unoptimized file if key changed
          if (finalStorageKey !== storageKey) {
            try {
              const deleteCommand = new DeleteObjectCommand({
                Bucket: TIGRIS_BUCKET,
                Key: storageKey,
              });
              await s3Client.send(deleteCommand);
              logger.info("🗑️ Deleted original unoptimized file", { key: storageKey });
            } catch (deleteError) {
              // Log but don't fail - orphaned file is not critical
              logger.warn("⚠️ Failed to delete original file", { 
                key: storageKey, 
                error: deleteError 
              });
            }
          }

          finalContentType = getContentType(processed.format);
          finalWidth = processed.width;
          finalHeight = processed.height;
          finalSize = processed.size;
          blurDataUrl = processed.blurDataUrl;

          logger.info("📦 Upload optimized", {
            original: `${(fileSize / 1024).toFixed(1)}KB`,
            optimized: `${(finalSize / 1024).toFixed(1)}KB`,
            savings: `${(((fileSize - finalSize) / fileSize) * 100).toFixed(1)}%`,
          });
        }

        const url = getPublicUrl(finalStorageKey);

        // Create ImageAsset record
        const imageAsset = await ctx.db.imageAsset.create({
          data: {
            organizationId: ctx.organizationId,
            userId: ctx.session!.user.id,
            templateId,
            versionId,
            url,
            storageKey: finalStorageKey,
            contentType: finalContentType,
            width: finalWidth,
            height: finalHeight,
            aspectRatio:
              finalWidth && finalHeight
                ? calculateAspectRatio(finalWidth, finalHeight)
                : null,
            blurDataUrl,
            prompt: "", // User-uploaded images have no prompt
            model: "upload", // Mark as user upload
            metadata: {
              originalName: fileName,
              originalSize: fileSize,
              optimizedSize: finalSize,
              uploadedAt: new Date().toISOString(),
            },
          },
        });

        return {
          id: imageAsset.id,
          url: imageAsset.url,
          width: imageAsset.width,
          height: imageAsset.height,
          blurDataUrl: imageAsset.blurDataUrl,
          filename: fileName,
          size: finalSize,
          type: finalContentType,
        };
      } catch (error) {
        console.error("[storage.confirmUpload] Failed:", error);
        throw new Error(
          error instanceof Error ? error.message : "Failed to confirm upload"
        );
      }
    }),

  // ============================================================================
  // Legacy base64 Upload (kept for backwards compatibility)
  // ============================================================================

  /**
   * @deprecated Use createUploadUrl + confirmUpload flow instead
   * This legacy endpoint now includes image optimization
   */
  uploadImage: organizationProcedure
    .input(
      z.object({
        file: z.object({
          name: z.string(),
          type: z.string(),
          size: z.number(),
          base64Data: z.string(),
        }),
        templateId: z.string().optional(),
        versionId: z.string().optional(),
        skipOptimization: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { file, templateId, versionId, skipOptimization = false } = input;

      // Validate file
      const validation = validateImageFile({
        type: file.type,
        size: file.size,
        name: file.name,
      });

      if (!validation.valid) {
        throw new Error(validation.error);
      }

      try {
        // Convert base64 string to Buffer
        const originalBuffer = Buffer.from(file.base64Data, "base64");

        let finalBuffer: Buffer = originalBuffer;
        let finalContentType = file.type;
        let finalWidth: number | undefined;
        let finalHeight: number | undefined;
        let blurDataUrl: string | undefined;

        // Process image if optimization is enabled
        if (!skipOptimization) {
          const processed = await processUploadedImage(originalBuffer, file.type);
          finalBuffer = Buffer.from(processed.buffer);
          finalContentType = getContentType(processed.format);
          finalWidth = processed.width;
          finalHeight = processed.height;
          blurDataUrl = processed.blurDataUrl;

          logger.info("📦 Legacy upload optimized", {
            original: `${(file.size / 1024).toFixed(1)}KB`,
            optimized: `${(finalBuffer.length / 1024).toFixed(1)}KB`,
            savings: `${(((file.size - finalBuffer.length) / file.size) * 100).toFixed(1)}%`,
          });
        }

        // Generate file path with correct extension
        const extension = finalContentType.split("/")[1] || "png";
        const baseName = file.name.replace(/\.[^.]+$/, "");
        const filePath = generateStoragePath(`${baseName}.${extension}`, "images");

        // Sanitize filename for HTTP headers
        const sanitizedName = encodeURIComponent(file.name);

        const putCommand = new PutObjectCommand({
          Bucket: TIGRIS_BUCKET,
          Key: filePath,
          Body: finalBuffer,
          ContentType: finalContentType,
          Metadata: {
            "user-id": ctx.session!.user.id,
            "organization-id": ctx.organizationId,
            ...(templateId ? { "template-id": templateId } : {}),
            ...(versionId ? { "version-id": versionId } : {}),
            "original-name": sanitizedName,
            "upload-timestamp": Date.now().toString(),
            optimized: skipOptimization ? "false" : "true",
          },
          ServerSideEncryption: "AES256",
        });

        await s3Client.send(putCommand);

        // Generate public URL
        const url = getPublicUrl(filePath);

        // Create ImageAsset record
        const imageAsset = await ctx.db.imageAsset.create({
          data: {
            organizationId: ctx.organizationId,
            userId: ctx.session!.user.id,
            templateId,
            versionId,
            url,
            storageKey: filePath,
            contentType: finalContentType,
            width: finalWidth,
            height: finalHeight,
            aspectRatio:
              finalWidth && finalHeight
                ? calculateAspectRatio(finalWidth, finalHeight)
                : null,
            blurDataUrl,
            prompt: "", // User-uploaded images have no prompt
            model: "upload", // Mark as user upload
            metadata: {
              originalName: file.name,
              originalSize: file.size,
              optimizedSize: finalBuffer.length,
              uploadedAt: new Date().toISOString(),
            },
          },
        });

        return {
          id: imageAsset.id,
          url: imageAsset.url,
          width: imageAsset.width,
          height: imageAsset.height,
          blurDataUrl: imageAsset.blurDataUrl,
          filename: file.name,
          size: finalBuffer.length,
          type: finalContentType,
        };
      } catch (error) {
        console.error("[storage.uploadImage] Upload failed:", error);
        throw new Error(
          error instanceof Error ? error.message : "Failed to upload image"
        );
      }
    }),

  uploadLogo: protectedProcedure
    .input(
      z.object({
        file: z.object({
          name: z.string(),
          type: z.string(),
          size: z.number(),
          base64Data: z.string(),
        }),
        organizationId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { file, organizationId } = input;

      // Verify user has access to the organization
      const membership = await ctx.db.member.findFirst({
        where: {
          userId: ctx.session.user.id,
          organizationId: organizationId,
        },
      });

      if (!membership) {
        throw new Error("Unauthorized: Not a member of this organization");
      }

      // Validate file
      const validation = validateImageFile({
        type: file.type,
        size: file.size,
        name: file.name,
      } as File);

      if (!validation.valid) {
        throw new Error(validation.error);
      }

      try {
        // Convert base64 string to Buffer
        const buffer = Buffer.from(file.base64Data, "base64");

        // Generate file path with random UUID for privacy
        const filePath = generateStoragePath(file.name, "logos");

        // Upload to Tigris S3
        // Sanitize filename for HTTP headers (S3 metadata only allows ASCII)
        const sanitizedName = encodeURIComponent(file.name);
        
        const putCommand = new PutObjectCommand({
          Bucket: TIGRIS_BUCKET,
          Key: filePath,
          Body: buffer,
          ContentType: file.type,
          Metadata: {
            "user-id": ctx.session.user.id,
            "organization-id": organizationId,
            "original-name": sanitizedName,
            "upload-timestamp": Date.now().toString(),
          },
          ServerSideEncryption: "AES256",
        });

        await s3Client.send(putCommand);

        // Generate public URL
        const url = getPublicUrl(filePath);

        return {
          url,
          filename: file.name,
          size: file.size,
          type: file.type,
        };
      } catch (error) {
        console.error("[storage.uploadLogo] Upload failed:", error);
        throw new Error(
          error instanceof Error ? error.message : "Failed to upload file"
        );
      }
    }),

  /**
   * Re-upload an external image URL to our CDN
   * Used for scraped logos/images that need to be persisted reliably
   */
  reuploadExternalImage: protectedProcedure
    .input(
      z.object({
        url: z.string().url(),
        type: z.enum(["logo", "image"]).default("logo"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { url, type } = input;

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
          console.error(`[storage.reuploadExternalImage] Failed to fetch: ${response.status}`);
          return { url, wasReuploaded: false, error: `Failed to fetch: ${response.status}` };
        }

        const contentType = response.headers.get("content-type") || "image/png";
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Validate size (5MB max)
        if (buffer.length > MAX_FILE_SIZE) {
          console.error("[storage.reuploadExternalImage] File too large");
          return { url, wasReuploaded: false, error: "File too large" };
        }

        // Validate content type
        const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml", "image/gif"];
        const normalizedType = (contentType.split(";")[0] || "").trim();
        if (!validTypes.includes(normalizedType)) {
          console.error(`[storage.reuploadExternalImage] Invalid content type: ${contentType}`);
          return { url, wasReuploaded: false, error: "Invalid image type" };
        }

        // Extract filename from URL or generate one
        const urlPath = new URL(url).pathname;
        const originalName = urlPath.split("/").pop() || `${type}-${Date.now()}`;
        const ext = normalizedType.split("/")[1] || "png";
        const filename = originalName.includes(".") ? originalName : `${originalName}.${ext}`;

        // Generate storage path
        const prefix = type === "logo" ? "logos" : "images";
        const filePath = generateStoragePath(filename, prefix);

        // Upload to our CDN
        const putCommand = new PutObjectCommand({
          Bucket: TIGRIS_BUCKET,
          Key: filePath,
          Body: buffer,
          ContentType: normalizedType,
          Metadata: {
            "user-id": ctx.session.user.id,
            "source-url": encodeURIComponent(url.substring(0, 500)), // Truncate long URLs
            "upload-timestamp": Date.now().toString(),
          },
          ServerSideEncryption: "AES256",
        });

        await s3Client.send(putCommand);

        const cdnUrl = getPublicUrl(filePath);
        
        console.log(`[storage.reuploadExternalImage] Success: ${url} -> ${cdnUrl}`);

        return {
          url: cdnUrl,
          wasReuploaded: true,
          originalUrl: url,
          size: buffer.length,
          contentType: normalizedType,
        };
      } catch (error) {
        console.error("[storage.reuploadExternalImage] Error:", error);
        // Return original URL on failure - don't break the flow
        return {
          url,
          wasReuploaded: false,
          error: error instanceof Error ? error.message : "Failed to re-upload",
        };
      }
    }),
});

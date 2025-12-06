import { z } from "zod";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { protectedProcedure, router } from "../index";
import { organizationProcedure } from "../middleware";
import {
  s3Client,
  TIGRIS_BUCKET,
  validateImageFile,
  generateStoragePath,
  getPublicUrl,
} from "../lib/s3";

export const storageRouter = router({
  // Upload an image for use in templates
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
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { file, templateId, versionId } = input;

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

        // Generate file path
        const filePath = generateStoragePath(file.name, "images");

        // Upload to Tigris S3
        // Sanitize filename for HTTP headers (S3 metadata only allows ASCII)
        const sanitizedName = encodeURIComponent(file.name);
        
        const putCommand = new PutObjectCommand({
          Bucket: TIGRIS_BUCKET,
          Key: filePath,
          Body: buffer,
          ContentType: file.type,
          Metadata: {
            "user-id": ctx.session!.user.id,
            "organization-id": ctx.organizationId,
            ...(templateId ? { "template-id": templateId } : {}),
            ...(versionId ? { "version-id": versionId } : {}),
            "original-name": sanitizedName,
            "upload-timestamp": Date.now().toString(),
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
            contentType: file.type,
            prompt: "", // User-uploaded images have no prompt
            model: "upload", // Mark as user upload, not AI-generated
            metadata: {
              originalName: file.name,
              uploadedAt: new Date().toISOString(),
            },
          },
        });

        return {
          id: imageAsset.id,
          url: imageAsset.url,
          filename: file.name,
          size: file.size,
          type: file.type,
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
});

import { z } from "zod";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { protectedProcedure, router } from "../index";
import {
  s3Client,
  TIGRIS_BUCKET,
  validateImageFile,
  generateStoragePath,
  getPublicUrl,
} from "../lib/s3";

export const storageRouter = router({
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

        // Generate file path
        const filePath = generateStoragePath(
          ctx.session.user.id,
          file.name,
          "logos"
        );

        // Upload to Tigris S3
        const putCommand = new PutObjectCommand({
          Bucket: TIGRIS_BUCKET,
          Key: filePath,
          Body: buffer,
          ContentType: file.type,
          Metadata: {
            "user-id": ctx.session.user.id,
            "organization-id": organizationId,
            "original-name": file.name,
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
        throw new Error("Failed to upload file");
      }
    }),
});

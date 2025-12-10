// IMPORTANT: Disable AWS SDK v3 automatic checksum calculation BEFORE importing S3Client
// This prevents CRC32 checksum headers in presigned URLs that browsers can't satisfy
// See: https://docs.aws.amazon.com/sdkref/latest/guide/feature-dataintegrity.html
process.env.AWS_S3_DISABLE_CHECKSUM = "true";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { serverEnv } from "@mocah/config/env";
import { logger } from "@mocah/shared";

const endpoint = serverEnv.TIGRIS_ENDPOINT_URL;
const accessKeyId = serverEnv.TIGRIS_ACCESS_KEY_ID;
const secretAccessKey = serverEnv.TIGRIS_SECRET_ACCESS_KEY;
const bucketName = serverEnv.TIGRIS_BUCKET_NAME;

export const s3Client = new S3Client({
  region: "auto",
  endpoint: endpoint,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
  forcePathStyle: true,
});

export const TIGRIS_BUCKET = bucketName;

export const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/svg+xml",
  "image/webp",
] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Presigned URL expiry in seconds (15 minutes)
export const PRESIGNED_URL_EXPIRY = 15 * 60;

export function validateImageFile(
  file: File | { type: string; size: number; name: string }
): { valid: true } | { valid: false; error: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as AllowedImageType)) {
    return {
      valid: false,
      error: "Invalid file type. Only PNG, JPG, WebP, and SVG are allowed.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "File too large. Maximum size is 5MB.",
    };
  }

  return { valid: true };
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.-]/g, "_");
}

export function generateStoragePath(
  filename: string,
  prefix: string = "logos"
): string {
  const randomId = crypto.randomUUID();
  const timestamp = Date.now();
  const sanitized = sanitizeFilename(filename);
  return `${prefix}/${randomId}/${timestamp}-${sanitized}`;
}

export const STORAGE_PREFIX_TEMPLATE_REFERENCES = "template-references" as const;

export function getPublicUrl(filePath: string): string {
  const customDomain = serverEnv.TIGRIS_PUBLIC_URL || "storage.mocah.ai";
  return `https://${customDomain}/${filePath}`;
}

/**
 * Generate a presigned URL for direct S3 upload from client
 */
export async function createPresignedUploadUrl(params: {
  key: string;
  contentType: string;
  metadata?: Record<string, string>; // Note: metadata is ignored for presigned URLs
}): Promise<{ uploadUrl: string; publicUrl: string }> {
  const { key, contentType } = params;

  logger.info("🔑 Generating presigned URL", {
    bucket: TIGRIS_BUCKET,
    key,
    contentType,
    expiresIn: PRESIGNED_URL_EXPIRY,
  });

  // Note: Don't include ServerSideEncryption in presigned URL command
  // because it becomes a signed header that browser must send.
  // Encryption is applied during confirmUpload re-upload instead.
  const command = new PutObjectCommand({
    Bucket: TIGRIS_BUCKET,
    Key: key,
    ContentType: contentType,
    // Don't include metadata - becomes signed headers browser can't replicate
    // Metadata will be added during confirmUpload
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: PRESIGNED_URL_EXPIRY,
  });

  const publicUrl = getPublicUrl(key);

  logger.info("🔗 Presigned URL generated", {
    urlLength: uploadUrl.length,
    hasChecksum: uploadUrl.includes("x-amz-checksum") || uploadUrl.includes("checksum"),
    hasMetadata: uploadUrl.includes("x-amz-meta"),
    publicUrl,
  });

  return { uploadUrl, publicUrl };
}

import { S3Client } from "@aws-sdk/client-s3";
import { serverEnv } from "@mocah/config/env";

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
];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function validateImageFile(
  file: File
): { valid: true } | { valid: false; error: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Only PNG, JPG, and SVG are allowed.",
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

export function getPublicUrl(filePath: string): string {
  const customDomain = serverEnv.TIGRIS_PUBLIC_URL || "storage.mocah.ai";
  return `https://${customDomain}/${filePath}`;
}

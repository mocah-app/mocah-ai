/**
 * Convert a File object to the format expected by the tRPC storage API
 */
export async function fileToApiFormat(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  // Convert ArrayBuffer to base64 string for JSON serialization
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString("base64");

  return {
    name: file.name,
    type: file.type,
    size: file.size,
    base64Data: base64,
  };
}

/**
 * Validate image file before upload
 */
export function validateImageFile(
  file: File
): { valid: true } | { valid: false; error: string } {
  const ALLOWED_TYPES = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/svg+xml",
  ];
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Only PNG, JPG, and SVG are allowed.",
    };
  }

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: "File too large. Maximum size is 10MB.",
    };
  }

  return { valid: true };
}

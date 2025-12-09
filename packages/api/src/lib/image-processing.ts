/**
 * Image Processing Utilities using Sharp
 *
 * Handles image optimization, compression, and LQIP generation
 * while preserving quality for email-ready images.
 */

import sharp from "sharp";
import { logger } from "@mocah/shared";

// ============================================================================
// Configuration
// ============================================================================

/**
 * Image processing configuration
 * Adjust these values to balance quality vs file size
 */
export const IMAGE_CONFIG = {
  // Maximum dimensions (longest edge) - preserves aspect ratio
  maxDimension: {
    full: 2048, // Full-res for email hero images
    preview: 1200, // Preview/thumbnail in app
    thumbnail: 400, // Small thumbnails in grids
  },

  // Quality settings (1-100, higher = better quality, larger file)
  quality: {
    jpeg: 88, // Higher quality for email hero images
    webp: 85, // WebP is more efficient, can use slightly lower
    png: 90, // PNG quality (compression level)
    avif: 80, // AVIF is very efficient
  },

  // LQIP (Low Quality Image Placeholder) settings
  lqip: {
    width: 20, // Tiny width for blur placeholder
    quality: 20, // Low quality is fine for blur
    blur: 0, // Sharp blur sigma (0 = no additional blur, CSS handles it)
  },

  // Optimization flags
  optimization: {
    stripMetadata: true, // Remove EXIF, GPS, camera data
    normalizeColorspace: true, // Convert to sRGB for consistency
    progressive: true, // Progressive JPEG/PNG for faster perceived load
  },
} as const;

// ============================================================================
// Types
// ============================================================================

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: "jpeg" | "png" | "webp" | "avif";
  size: number;
  blurDataUrl?: string;
}

export interface ProcessImageOptions {
  /** Maximum dimension (longest edge). Defaults to full (2048) */
  maxDimension?: number;
  /** Output format. Defaults to original or webp */
  format?: "jpeg" | "png" | "webp" | "avif" | "original";
  /** Quality override (1-100) */
  quality?: number;
  /** Generate LQIP blur placeholder */
  generateBlur?: boolean;
  /** Skip optimization (return as-is with metadata only) */
  skipOptimization?: boolean;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  hasAlpha: boolean;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Get image metadata without processing
 */
export async function getImageMetadata(
  input: Buffer | string
): Promise<ImageMetadata> {
  const image = sharp(input);
  const metadata = await image.metadata();

  return {
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    format: metadata.format ?? "unknown",
    size: metadata.size ?? 0,
    hasAlpha: metadata.hasAlpha ?? false,
  };
}

/**
 * Generate a tiny LQIP (Low Quality Image Placeholder) as base64 data URL
 * This creates a ~200-500 byte blurred placeholder for instant loading
 */
export async function generateBlurPlaceholder(
  input: Buffer | string
): Promise<string> {
  try {
    const { width, quality } = IMAGE_CONFIG.lqip;

    const blurBuffer = await sharp(input)
      .resize(width, undefined, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({
        quality,
        progressive: false,
      })
      .toBuffer();

    // Return as base64 data URL for next/image blurDataURL
    return `data:image/jpeg;base64,${blurBuffer.toString("base64")}`;
  } catch (error) {
    logger.warn("Failed to generate blur placeholder", { error });
    // Return a tiny transparent placeholder as fallback
    return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  }
}

/**
 * Process and optimize an image
 *
 * @param input - Buffer or file path
 * @param options - Processing options
 * @returns Processed image with metadata
 */
export async function processImage(
  input: Buffer | string,
  options: ProcessImageOptions = {}
): Promise<ProcessedImage> {
  const {
    maxDimension = IMAGE_CONFIG.maxDimension.full,
    format = "original",
    quality,
    generateBlur = true,
    skipOptimization = false,
  } = options;

  const startTime = Date.now();

  // Get original metadata
  const originalMeta = await getImageMetadata(input);
  const inputSize =
    Buffer.isBuffer(input) ? input.length : originalMeta.size;

  // Start with sharp instance
  let pipeline = sharp(input);

  // Strip metadata if configured
  if (IMAGE_CONFIG.optimization.stripMetadata && !skipOptimization) {
    pipeline = pipeline.rotate(); // Auto-rotate based on EXIF, then strip
  }

  // Normalize colorspace
  if (IMAGE_CONFIG.optimization.normalizeColorspace && !skipOptimization) {
    pipeline = pipeline.toColorspace("srgb");
  }

  // Resize if needed (preserve aspect ratio)
  const needsResize =
    originalMeta.width > maxDimension || originalMeta.height > maxDimension;

  if (needsResize && !skipOptimization) {
    pipeline = pipeline.resize(maxDimension, maxDimension, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  // Determine output format
  let outputFormat: "jpeg" | "png" | "webp" | "avif" =
    format === "original"
      ? getOptimalFormat(originalMeta.format, originalMeta.hasAlpha)
      : format;

  // Apply format-specific settings
  const qualityValue = quality ?? getQualityForFormat(outputFormat);

  switch (outputFormat) {
    case "jpeg":
      pipeline = pipeline.jpeg({
        quality: qualityValue,
        progressive: IMAGE_CONFIG.optimization.progressive,
        mozjpeg: true, // Better compression
      });
      break;
    case "webp":
      pipeline = pipeline.webp({
        quality: qualityValue,
        effort: 4, // Balance speed vs compression (0-6)
        smartSubsample: true,
      });
      break;
    case "avif":
      pipeline = pipeline.avif({
        quality: qualityValue,
        effort: 4,
      });
      break;
    case "png":
      pipeline = pipeline.png({
        compressionLevel: 9, // Max compression for PNG (0-9, higher = smaller)
        progressive: IMAGE_CONFIG.optimization.progressive,
        palette: !originalMeta.hasAlpha, // Use palette for non-alpha images (smaller)
      });
      break;
  }

  // Process the image
  const { data: buffer, info } = await pipeline.toBuffer({
    resolveWithObject: true,
  });

  // Generate blur placeholder if requested
  let blurDataUrl: string | undefined;
  if (generateBlur) {
    blurDataUrl = await generateBlurPlaceholder(input);
  }

  const processingTime = Date.now() - startTime;
  
  // IMPORTANT: If processed file is larger than original, use original instead
  // This can happen with already-optimized PNGs or complex alpha channels
  let finalBuffer = buffer;
  let finalFormat = outputFormat;
  let finalWidth = info.width;
  let finalHeight = info.height;
  
  if (buffer.length > inputSize && Buffer.isBuffer(input)) {
    logger.warn("⚠️ Processed image larger than original, keeping original", {
      originalSize: `${(inputSize / 1024).toFixed(1)}KB`,
      processedSize: `${(buffer.length / 1024).toFixed(1)}KB`,
      format: outputFormat,
    });
    finalBuffer = input;
    finalFormat = (originalMeta.format as "jpeg" | "png" | "webp" | "avif") || outputFormat;
    finalWidth = originalMeta.width;
    finalHeight = originalMeta.height;
  }
  
  const compressionRatio = ((1 - finalBuffer.length / inputSize) * 100).toFixed(1);

  logger.info("🖼️ Image processed", {
    originalSize: `${(inputSize / 1024).toFixed(1)}KB`,
    outputSize: `${(finalBuffer.length / 1024).toFixed(1)}KB`,
    compression: `${compressionRatio}%`,
    dimensions: `${finalWidth}x${finalHeight}`,
    format: finalFormat,
    processingTime: `${processingTime}ms`,
    usedOriginal: finalBuffer === input,
  });

  return {
    buffer: finalBuffer,
    width: finalWidth,
    height: finalHeight,
    format: finalFormat,
    size: finalBuffer.length,
    blurDataUrl,
  };
}

/**
 * Process image for upload (user-uploaded images)
 * Optimizes for EMAIL TEMPLATE compatibility
 */
export async function processUploadedImage(
  input: Buffer,
  originalFormat?: string
): Promise<ProcessedImage> {
  // For EMAIL TEMPLATES - must use email-compatible formats:
  // - JPEG: for photos, no transparency
  // - PNG: for images with transparency, logos, graphics
  // - NO WebP/AVIF: Outlook doesn't support them
  
  const metadata = await sharp(input).metadata();
  const hasAlpha = metadata.hasAlpha ?? false;
  
  let format: "jpeg" | "png" | "original" = "original";
  
  // Convert obscure formats to email-safe ones
  if (shouldConvertFormat(originalFormat)) {
    format = hasAlpha ? "png" : "jpeg";
  }
  // For standard formats (jpeg, png), keep original

  return processImage(input, {
    maxDimension: IMAGE_CONFIG.maxDimension.full,
    format,
    generateBlur: true,
  });
}

/**
 * Process AI-generated image
 * These are already high quality, just need compression and blur
 */
export async function processGeneratedImage(
  input: Buffer,
  _requestedFormat?: string // Ignored - we optimize for email compatibility
): Promise<ProcessedImage> {
  // For AI-generated images in EMAIL TEMPLATES:
  // 
  // Email client compatibility is CRITICAL:
  // - JPEG: Universal support (Gmail, Outlook, Apple Mail, Yahoo) ✅
  // - PNG: Universal support (needed for transparency) ✅
  // - WebP: NOT supported in Outlook ❌
  // - AVIF: Poor support ❌
  //
  // Strategy:
  // - Default to JPEG (best compression + universal support)
  // - Use PNG only if image has transparency (larger but compatible)
  
  let format: "jpeg" | "png" = "jpeg";
  
  // Check if input has alpha channel (transparency)
  const metadata = await sharp(input).metadata();
  const hasAlpha = metadata.hasAlpha ?? false;
  
  if (hasAlpha) {
    // Need transparency - must use PNG for email compatibility
    // (WebP not supported in Outlook)
    format = "png";
  }

  return processImage(input, {
    maxDimension: IMAGE_CONFIG.maxDimension.full,
    format,
    generateBlur: true,
  });
}

/**
 * Create a thumbnail version
 */
export async function createThumbnail(
  input: Buffer | string,
  size: "preview" | "thumbnail" = "thumbnail"
): Promise<ProcessedImage> {
  const maxDimension =
    size === "preview"
      ? IMAGE_CONFIG.maxDimension.preview
      : IMAGE_CONFIG.maxDimension.thumbnail;

  return processImage(input, {
    maxDimension,
    format: "webp",
    quality: 75,
    generateBlur: false,
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determine optimal output format for EMAIL TEMPLATES
 * Must use formats supported by all major email clients (including Outlook)
 */
function getOptimalFormat(
  inputFormat: string,
  hasAlpha: boolean
): "jpeg" | "png" {
  // Email client compatibility requirements:
  // - JPEG: Universal ✅
  // - PNG: Universal ✅
  // - WebP: NOT Outlook ❌
  // - AVIF: Poor support ❌
  
  // Images with transparency must use PNG
  if (hasAlpha) {
    return "png";
  }

  // For photos/JPEG, keep as JPEG
  if (inputFormat === "jpeg" || inputFormat === "jpg") {
    return "jpeg";
  }

  // For PNG without alpha, convert to JPEG (smaller)
  if (inputFormat === "png") {
    return "jpeg";
  }

  // Default to JPEG for other formats
  return "jpeg";
}

/**
 * Get quality setting for format
 */
function getQualityForFormat(format: "jpeg" | "png" | "webp" | "avif"): number {
  return IMAGE_CONFIG.quality[format];
}

/**
 * Check if format should be converted for optimization
 */
function shouldConvertFormat(format?: string): boolean {
  if (!format) return false;

  // These formats benefit from conversion to WebP
  const convertibleFormats = ["bmp", "tiff", "gif"];
  return convertibleFormats.includes(format.toLowerCase());
}

/**
 * Get content type from format
 */
export function getContentType(
  format: "jpeg" | "png" | "webp" | "avif"
): string {
  const types = {
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    avif: "image/avif",
  };
  return types[format];
}

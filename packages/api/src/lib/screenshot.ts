/**
 * Screenshot generation using ApiFlash
 * Generates thumbnails for template library cards
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { serverEnv } from "@mocah/config/env";
import { getPublicUrl } from "./s3";

interface ScreenshotOptions {
  templateId: string;
  htmlCode: string;
  width?: number;
  height?: number;
  quality?: number;
}

/**
 * Generate a screenshot of HTML content using ApiFlash and upload to S3
 * @returns S3 URL of the uploaded screenshot, or null if generation is skipped
 */
export async function generateTemplateScreenshot({
  templateId,
  htmlCode,
  width = 600,
  height = 800,
  quality = 100,
}: ScreenshotOptions): Promise<string | null> {
  // Skip if ApiFlash is not configured
  if (!serverEnv.APIFLASH_API_KEY) {
    console.warn("APIFLASH_API_KEY not configured, skipping screenshot generation");
    return null;
  }

  const s3Client = new S3Client({
    region: "auto",
    endpoint: serverEnv.TIGRIS_ENDPOINT_URL,
    credentials: {
      accessKeyId: serverEnv.TIGRIS_ACCESS_KEY_ID,
      secretAccessKey: serverEnv.TIGRIS_SECRET_ACCESS_KEY,
    },
  });

  // Temporary HTML file key
  const tempHtmlKey = `temp-screenshots/${templateId}.html`;
  let tempHtmlUploaded = false;

  try {
    // Step 1: Upload HTML to temporary S3 location (public access)
    await s3Client.send(
      new PutObjectCommand({
        Bucket: serverEnv.TIGRIS_BUCKET_NAME,
        Key: tempHtmlKey,
        Body: Buffer.from(htmlCode, "utf-8"),
        ContentType: "text/html",
        CacheControl: "no-cache",
      })
    );
    tempHtmlUploaded = true;

    // Generate public URL for ApiFlash to access
    const tempHtmlUrl = getPublicUrl(tempHtmlKey);

    // Step 2: Capture screenshot using ApiFlash
    const formData = new URLSearchParams({
      access_key: serverEnv.APIFLASH_API_KEY,
      url: tempHtmlUrl,
      format: "jpeg",
      quality: quality.toString(),
      width: width.toString(),
      height: height.toString(),
      fresh: "true", // Don't use cache
      wait_until: "network_idle", // Ensure page is fully rendered
      scroll_page: "false",
    });

    const response = await fetch(
      "https://api.apiflash.com/v1/urltoimage",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ApiFlash error: ${response.status} - ${error}`);
    }

    const screenshotBuffer = Buffer.from(await response.arrayBuffer());

    // Step 3: Upload screenshot to permanent S3 location
    const screenshotKey = `library-thumbnails/${templateId}.jpg`;
    
    await s3Client.send(
      new PutObjectCommand({
        Bucket: serverEnv.TIGRIS_BUCKET_NAME,
        Key: screenshotKey,
        Body: screenshotBuffer,
        ContentType: "image/jpeg",
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    // Step 4: Clean up temporary HTML file
    if (tempHtmlUploaded) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: serverEnv.TIGRIS_BUCKET_NAME,
            Key: tempHtmlKey,
          })
        );
      } catch (cleanupError) {
        console.warn("Failed to clean up temp HTML file:", cleanupError);
        // Non-critical, continue
      }
    }

    // Return public screenshot URL
    return getPublicUrl(screenshotKey);
  } catch (error) {
    console.error("Failed to generate screenshot:", error);
    
    // Clean up temp HTML file on error
    if (tempHtmlUploaded) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: serverEnv.TIGRIS_BUCKET_NAME,
            Key: tempHtmlKey,
          })
        );
      } catch (cleanupError) {
        console.warn("Failed to clean up temp HTML file after error:", cleanupError);
      }
    }
    
    // Don't throw - gracefully degrade to no thumbnail
    return null;
  }
}

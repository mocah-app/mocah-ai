import { serverEnv } from "@mocah/config/env";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Helper function to check if hostname is allowed
function isAllowedHost(hostname: string): boolean {
  // Allow all mocah.ai domains (including subdomains)
  if (hostname === "mocah.ai" || hostname.endsWith(".mocah.ai")) {
    return true;
  }
  // Allow Tigris CDN
  if (hostname === `${serverEnv.TIGRIS_PUBLIC_URL}`) {
    return true;
  }
  return false;
}

// Validation schema
const downloadImageSchema = z.object({
  url: z.url("Invalid URL format").refine(
    (url) => {
      try {
        const parsedUrl = new URL(url);
        return isAllowedHost(parsedUrl.hostname);
      } catch {
        return false;
      }
    },
    {
      message: "URL must be from mocah.ai or allowed CDN",
    }
  ),
});

export async function GET(req: NextRequest) {
  try {
    // 1. Get and validate image URL with Zod
    const imageUrl = req.nextUrl.searchParams.get("url");

    const validation = downloadImageSchema.safeParse({ url: imageUrl });

    if (!validation.success) {
      const error = validation.error.issues[0];
      return NextResponse.json(
        { error: error?.message || "Invalid URL" },
        { status: 400 }
      );
    }

    const { url: validatedUrl } = validation.data;

    // 2. Fetch the image
    const response = await fetch(validatedUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: response.status }
      );
    }

    // 3. Get the image data
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Extract filename from URL
    const filename =
      validatedUrl.split("/").pop()?.split("?")[0] || "image.png";

    // 5. Return with download headers
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": response.headers.get("content-type") || "image/png",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Download proxy error:", error);
    return NextResponse.json(
      { error: "Failed to download image" },
      { status: 500 }
    );
  }
}

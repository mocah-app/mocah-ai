import { NextRequest } from "next/server";
import { aiClient, TEMPLATE_GENERATION_MODEL } from "@mocah/api/lib/ai";
import {
  buildReactEmailPrompt,
  reactEmailGenerationSchema,
} from "@mocah/api/lib/prompts";
import { auth } from "@mocah/auth";
import prisma from "@mocah/db";
import { logger } from "@mocah/shared";
import {
  getCachedMembership,
  cacheMembership,
} from "@mocah/shared/cache";
import {
  getCachedBrandKit,
  cacheBrandKit,
  getCachedBrandGuidePreference,
} from "./cache";

// Schema metadata for AI reliability (also exported from prompts.ts after rebuild)
const TEMPLATE_SCHEMA_NAME = "ReactEmailTemplate";
const TEMPLATE_SCHEMA_DESCRIPTION =
  "A complete React Email template with subject line, preview text, and valid React Email component code. The code must use only @react-email/components, no HTML tags.";

// AI SDK streaming works in both Edge and Node.js runtimes
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Parse request body
    const { prompt, organizationId, imageUrls, includeBrandGuide } = await req.json();

    if (!prompt || !organizationId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = session.user.id;

    // 3. Check cache first, then DB if needed
    let isMember = await getCachedMembership(userId, organizationId);
    
    // Check brand guide preference (default to true if not provided for backward compatibility)
    const shouldIncludeBrandGuide = includeBrandGuide !== undefined 
      ? includeBrandGuide 
      : (await getCachedBrandGuidePreference(userId, organizationId)) ?? true;
    
    let brandKit = shouldIncludeBrandGuide ? await getCachedBrandKit(organizationId) : null;

    // Collect promises for any cache misses
    const dbQueries: Promise<void>[] = [];

    if (isMember === null) {
      dbQueries.push(
        prisma.member.findFirst({
          where: { userId, organizationId },
        }).then(async (membership) => {
          isMember = !!membership;
          await cacheMembership(userId, organizationId, isMember);
        })
      );
    }

    if (shouldIncludeBrandGuide && brandKit === null) {
      dbQueries.push(
        prisma.organization.findUnique({
          where: { id: organizationId },
          select: { brandKit: true },
        }).then(async (org) => {
          brandKit = org?.brandKit ?? null;
          await cacheBrandKit(organizationId, brandKit);
        })
      );
    }

    // Wait for any needed DB queries
    if (dbQueries.length > 0) {
      await Promise.all(dbQueries);
    }

    if (!isMember) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Build React Email prompt (without image URLs in text - they'll be sent as message parts)
    const promptText = buildReactEmailPrompt(prompt, brandKit as any);

    // 5. Start streaming with AI SDK (enhanced reliability)
    const result = aiClient.streamStructured(
      reactEmailGenerationSchema,
      promptText,
      TEMPLATE_GENERATION_MODEL,
      {
        schemaName: TEMPLATE_SCHEMA_NAME,
        schemaDescription: TEMPLATE_SCHEMA_DESCRIPTION,
        temperature: 0.7,
        maxRetries: 3,
        imageUrls: imageUrls as string[] | undefined, // Pass images as multi-modal content
        onError: (error: unknown) => {
          logger.error("Stream error in template generation", {
            error: String(error),
            userId: session.user.id,
            organizationId,
            promptPreview: prompt.substring(0, 100),
            imageCount: (imageUrls as string[] | undefined)?.length || 0,
          });
        },
      }
    );

    // 6. Return streaming response
    return result.toTextStreamResponse();
  } catch (error) {
    logger.error("Template generation error:", { error });
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

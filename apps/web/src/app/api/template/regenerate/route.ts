import { NextRequest } from "next/server";
import { aiClient, TEMPLATE_GENERATION_MODEL } from "@mocah/api/lib/ai";
import {
  buildReactEmailRegenerationPrompt,
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
} from "../generate/cache";

// Schema metadata for AI reliability
const TEMPLATE_SCHEMA_NAME = "ReactEmailTemplate";
const TEMPLATE_SCHEMA_DESCRIPTION =
  "A modified React Email template based on existing template and user request. The code must use only @react-email/components, no HTML tags.";

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
    const { prompt, templateId, imageUrls, includeBrandGuide } = await req.json();

    if (!prompt || !templateId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = session.user.id;

    // 3. Get template with current code and organization
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      select: {
        id: true,
        organizationId: true,
        reactEmailCode: true,
        organization: {
          select: {
            brandKit: true,
          },
        },
      },
    });

    if (!template) {
      return new Response(JSON.stringify({ error: "Template not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Check cache first, then DB if needed
    let isMember = await getCachedMembership(userId, template.organizationId);
    
    // Check brand guide preference (default to true if not provided for backward compatibility)
    const shouldIncludeBrandGuide = includeBrandGuide !== undefined 
      ? includeBrandGuide 
      : (await getCachedBrandGuidePreference(userId, template.organizationId)) ?? true;
    
    let brandKit = shouldIncludeBrandGuide ? await getCachedBrandKit(template.organizationId) : null;

    // Collect promises for any cache misses
    const dbQueries: Promise<void>[] = [];

    if (isMember === null) {
      dbQueries.push(
        prisma.member.findFirst({
          where: { userId, organizationId: template.organizationId },
        }).then(async (membership) => {
          isMember = !!membership;
          await cacheMembership(userId, template.organizationId, isMember);
        })
      );
    }

    if (shouldIncludeBrandGuide && brandKit === null && template.organization.brandKit) {
      brandKit = template.organization.brandKit;
      dbQueries.push(
        cacheBrandKit(template.organizationId, brandKit)
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

    // 5. Build React Email regeneration prompt with current template code
    const promptText = buildReactEmailRegenerationPrompt(
      prompt,
      template.reactEmailCode || "",  // Current template code for context
      brandKit as any
    );

    logger.info("🔄 [Regeneration Stream] Starting regeneration", {
      templateId,
      userId,
      promptPreview: prompt.substring(0, 100),
      hasCurrentCode: !!template.reactEmailCode,
      currentCodeLength: template.reactEmailCode?.length || 0,
      imageCount: (imageUrls as string[] | undefined)?.length || 0,
    });

    // 6. Start streaming with AI SDK (enhanced reliability)
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
          logger.error("Stream error in template regeneration", {
            error: String(error),
            userId: session.user.id,
            templateId,
            promptPreview: prompt.substring(0, 100),
            imageCount: (imageUrls as string[] | undefined)?.length || 0,
          });
        },
      }
    );

    // 7. Return streaming response
    return result.toTextStreamResponse();
  } catch (error) {
    logger.error("Template regeneration error:", { error });
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


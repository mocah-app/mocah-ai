import { NextRequest } from "next/server";
import { aiClient, TEMPLATE_GENERATION_MODEL } from "@mocah/api/lib/ai";
import {
  streamTemplateV2,
  type TemplateUiMessage,
} from "@mocah/api/lib/ai-v2-streaming";
import {
  getTemplateGenerationVersion,
  getAI_V2_FeatureFlags,
  logGenerationMetrics,
} from "@mocah/api/lib/ai-v2-rollout";
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
  getCachedBrandKit,
  cacheBrandKit,
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

    const userId = session.user.id;

    // 2. Parse request body
    const body = await req.json();

    // Chat-style V2 calls (from useChat / UI message streams) send `messages`.
    // Handle this path first and bypass the legacy V1/V2 rollout logic.
    if (Array.isArray(body.messages)) {
      const messages = body.messages as TemplateUiMessage[];
      let {
        organizationId,
        templateId,
        enableReasoning = true,
        enableTools = true,
      } = body as {
        organizationId?: string;
        templateId?: string;
        enableReasoning?: boolean;
        enableTools?: boolean;
      };

      // Fallback: derive org/template IDs from message metadata when not
      // explicitly provided in the body (default useChat behavior).
      if (!organizationId && messages.length > 0) {
        const last = messages[messages.length - 1];
        const meta = (last.metadata || {}) as {
          organizationId?: string;
          templateId?: string;
        };
        organizationId = meta.organizationId;
        templateId = templateId ?? meta.templateId;
      }

      if (!organizationId) {
        return new Response(
          JSON.stringify({ error: "Missing organizationId" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      logger.info("[AI Generation] Chat-style V2 request received", {
        userId,
        organizationId,
        templateId,
        enableTools,
        enableReasoning,
      });

      const response = await streamTemplateV2(
        {
          messages,
          organizationId,
          templateId,
          enableReasoning,
          enableTools,
          metadata: {
            userId,
            mode: "v2",
          },
        },
        TEMPLATE_GENERATION_MODEL
      );

      logGenerationMetrics({
        version: "v2",
        organizationId,
        templateId,
        userId,
        fallbackUsed: false,
        durationMs: 0,
      });

      return response;
    }

    // Legacy body shape (V1 + old V2 path)
    const {
      prompt,
      organizationId,
      templateId,
      imageUrls,
      mode: explicitMode, // Explicit mode override (for testing)
      enableReasoning = true,
      enableTools = true,
    } = body as {
      prompt: string;
      organizationId: string;
      templateId?: string;
      imageUrls?: string[];
      mode?: "v1" | "v2";
      enableReasoning?: boolean;
      enableTools?: boolean;
    };

    if (!prompt || !organizationId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const startTime = Date.now();

    // 3. Check cache first, then DB if needed
    let isMember = await getCachedMembership(userId, organizationId);
    let brandKit = await getCachedBrandKit(organizationId);

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

    if (brandKit === null) {
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

    // 4. Determine which version to use (explicit mode override or rollout-based)
    const featureFlags = getAI_V2_FeatureFlags();
    const selectedVersion = explicitMode ?? (await getTemplateGenerationVersion(organizationId, featureFlags));

    logger.info('[AI Generation] Version selected', {
      version: selectedVersion,
      explicitMode,
      rolloutPercentage: featureFlags.rolloutPercentage,
      organizationId,
      userId,
    });

    // V1: Use streamObject (existing implementation, no tools).
    // This runs either when:
    // - selectedVersion is 'v1'
    // - or for any non-chat clients even if feature flags prefer V2
    logger.info('[AI Generation] Starting V1 generation', {
      userId,
      organizationId,
      templateId,
      hasImages: !!imageUrls?.length,
      isFallback: selectedVersion === 'v2', // True if we fell back from V2
    });

    // 6. Build React Email prompt (without image URLs in text - they'll be sent as message parts)
    const promptText = buildReactEmailPrompt(prompt, brandKit as any);

    // 7. Start streaming with AI SDK (enhanced reliability)
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
          logger.error('[AI Generation] V1 stream error', {
            error: String(error),
            userId: session.user.id,
            organizationId,
            templateId,
            promptPreview: prompt.substring(0, 100),
            imageCount: (imageUrls as string[] | undefined)?.length || 0,
          });
        },
      }
    );

    // Log V1 generation metrics
    logGenerationMetrics({
      version: 'v1',
      organizationId,
      templateId,
      userId,
      durationMs: Date.now() - startTime,
      fallbackUsed: selectedVersion === 'v2', // True if we fell back from V2
    });

    // 8. Return streaming response
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

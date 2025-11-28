import { NextRequest } from "next/server";
import { aiClient, TEMPLATE_GENERATION_MODEL } from "@mocah/api/lib/ai";
import {
  buildReactEmailPrompt,
  reactEmailGenerationSchema,
} from "@mocah/api/lib/prompts";
import { auth } from "@mocah/auth";
import prisma from "@mocah/db";
import { logger } from "@mocah/shared";

// AI SDK streaming works in both Edge and Node.js runtimes
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // 2. Parse request body
    const { prompt, organizationId } = await req.json();

    if (!prompt || !organizationId) {
      return new Response("Missing required fields", { status: 400 });
    }

    // 3. Verify organization membership
    const membership = await prisma.member.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organizationId,
      },
    });

    if (!membership) {
      return new Response("Forbidden", { status: 403 });
    }

    // 4. Get organization brand kit
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { brandKit: true },
    });

    // 5. Build React Email prompt
    const promptText = buildReactEmailPrompt(prompt, organization?.brandKit as any);

    // Log complete AI request details for streaming
    // logger.info("\n" + "=".repeat(80));
    // logger.info("🌊 AI STREAMING REQUEST");
    // logger.info("=".repeat(80));
    // logger.info("\n📝 USER PROMPT:", { prompt });
    // logger.info("\n🎨 BRAND KIT:", { brandKit: organization?.brandKit || {} });
    // logger.info("\n📋 COMPLETE SYSTEM PROMPT:", { systemPrompt: promptText });
    // logger.info("\n🔧 GENERATION CONFIG:", {
    //   model: TEMPLATE_GENERATION_MODEL,
    //   schemaFields: Object.keys(reactEmailGenerationSchema.shape),
    //   streaming: true,
    //   user: session.user.email || session.user.id,
    //   organizationId,
    // });
    // logger.info("\n" + "=".repeat(80) + "\n");

    // 6. Start streaming with AI SDK
    const result = aiClient.streamStructured(
      reactEmailGenerationSchema,
      promptText,
      TEMPLATE_GENERATION_MODEL
    );

    // 7. Return streaming response using AI SDK's built-in method
    return result.toTextStreamResponse();
  } catch (error) {
    logger.error("Template generation error:", { error });
    return new Response("Internal server error", { status: 500 });
  }
}

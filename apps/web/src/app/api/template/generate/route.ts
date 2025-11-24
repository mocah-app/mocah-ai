import { NextRequest } from "next/server";
import { aiClient, TEMPLATE_GENERATION_MODEL } from "@mocah/api/lib/ai";
import {
  buildTemplateGenerationPrompt,
  templateGenerationSchema,
} from "@mocah/api/lib/prompts";
import { auth } from "@mocah/auth";
import prisma from "@mocah/db";


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

    // 5. Build prompt
    const promptText = buildTemplateGenerationPrompt(
      prompt,
      organization?.brandKit as any
    );

    // 6. Start streaming with AI SDK
    const result = aiClient.streamStructured(
      templateGenerationSchema,
      promptText,
      TEMPLATE_GENERATION_MODEL
    );

    // 7. Return streaming response using AI SDK's built-in method
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Template generation error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

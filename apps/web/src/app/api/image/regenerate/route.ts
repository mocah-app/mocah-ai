import { NextRequest } from "next/server";
import { auth } from "@mocah/auth";
import prisma from "@mocah/db";
import { logger } from "@mocah/shared";
import { serverEnv } from "@mocah/config/env";
import { ZodError } from "zod";
import {
  imageGenerationInputSchema,
  runFalImageGeneration,
} from "@mocah/api/lib/utils";
import { enforceImageRateLimits } from "@mocah/api/lib/rate-limit";

const regenerateSchema = imageGenerationInputSchema.refine(
  (value) => value.imageUrls && value.imageUrls.length > 0,
  { message: "imageUrls are required for regeneration", path: ["imageUrls"] }
);

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const started = Date.now();
  try {
    if (serverEnv.FAL_IMAGE_ENABLED === false) {
      return new Response(JSON.stringify({ error: "Image generation disabled" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const parsed = regenerateSchema.parse(body);

    const membership = await prisma.member.findFirst({
      where: {
        userId: session.user.id,
        organizationId: parsed.organizationId,
      },
    });

    if (!membership) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    await enforceImageRateLimits(session.user.id, parsed.organizationId);

    if (parsed.templateId) {
      const template = await prisma.template.findUnique({
        where: { id: parsed.templateId },
        select: { organizationId: true },
      });
      if (!template || template.organizationId !== parsed.organizationId) {
        return new Response(JSON.stringify({ error: "Template not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const result = await runFalImageGeneration(parsed, {
      userId: session.user.id,
    });

    logger.info("♻️ Image regeneration succeeded", {
      userId: session.user.id,
      organizationId: parsed.organizationId,
      templateId: parsed.templateId,
      requestId: result.requestId,
      model: result.model,
      images: result.images?.length || 0,
      elapsedMs: result.elapsedMs ?? Date.now() - started,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error("Image regeneration failed", {
      error,
      elapsedMs: Date.now() - started,
    });
    if (error instanceof ZodError) {
      return new Response(JSON.stringify({ error: error.flatten() }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const errStatusCode = (error as any)?.statusCode;
    const status = errStatusCode
      ? errStatusCode
      : message.includes("NSFW")
        ? 422
        : message.toLowerCase().includes("rate limit")
          ? 429
          : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}

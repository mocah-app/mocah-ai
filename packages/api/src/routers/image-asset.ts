import { z } from "zod";
import { router } from "../index";
import { organizationProcedure } from "../middleware";

export const imageAssetRouter = router({
  list: organizationProcedure
    .input(
      z
        .object({
          templateId: z.string().optional(),
          limit: z.number().min(1).max(100).default(20),
          cursor: z.string().optional(),
          // Additional filters
          model: z.string().optional(),
          search: z.string().optional(),
          dateFrom: z.date().optional(),
          dateTo: z.date().optional(),
          aspectRatio: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      
      // Build where clause with filters
      const where: {
        organizationId: string;
        templateId?: string;
        model?: string;
        prompt?: { contains: string; mode: "insensitive" };
        createdAt?: { gte?: Date; lte?: Date };
        aspectRatio?: string;
      } = {
        organizationId: ctx.organizationId,
      };

      // Template filter
      if (input?.templateId) {
        where.templateId = input.templateId;
      }

      // Model filter (e.g., "upload", "fal-ai/flux-2-flex")
      if (input?.model) {
        where.model = input.model;
      }

      // Prompt search (case-insensitive contains)
      if (input?.search) {
        where.prompt = {
          contains: input.search,
          mode: "insensitive",
        };
      }

      // Date range filter
      if (input?.dateFrom || input?.dateTo) {
        where.createdAt = {};
        if (input.dateFrom) {
          where.createdAt.gte = input.dateFrom;
        }
        if (input.dateTo) {
          where.createdAt.lte = input.dateTo;
        }
      }

      // Aspect ratio filter
      if (input?.aspectRatio) {
        where.aspectRatio = input.aspectRatio;
      }

      const images = await ctx.db.imageAsset.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        ...(input?.cursor && { cursor: { id: input.cursor }, skip: 1 }),
        select: {
          id: true,
          url: true,
          prompt: true,
          model: true,
          width: true,
          height: true,
          aspectRatio: true,
          contentType: true,
          blurDataUrl: true,
          createdAt: true,
        },
      });

      const hasNextPage = images.length > limit;
      const items = hasNextPage ? images.slice(0, limit) : images;

      return {
        items,
        nextCursor: hasNextPage ? items[items.length - 1]?.id : undefined,
        hasNextPage,
      };
    }),

  // Get distinct models for filter dropdown
  getModels: organizationProcedure.query(async ({ ctx }) => {
    const models = await ctx.db.imageAsset.findMany({
      where: { organizationId: ctx.organizationId },
      select: { model: true },
      distinct: ["model"],
      orderBy: { model: "asc" },
    });

    return models
      .map((m) => m.model)
      .filter((m): m is string => m !== null && m !== "");
  }),
});

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
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const where = {
        organizationId: ctx.organizationId,
        ...(input?.templateId ? { templateId: input.templateId } : {}),
      };

      const images = await ctx.db.imageAsset.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        ...(input?.cursor && { cursor: { id: input.cursor }, skip: 1 }),
      });

      const hasNextPage = images.length > limit;
      const items = hasNextPage ? images.slice(0, limit) : images;

      return {
        items,
        nextCursor: hasNextPage ? items[items.length - 1]?.id : undefined,
      };
    }),
});

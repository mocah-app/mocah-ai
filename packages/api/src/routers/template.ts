import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../index";
import { organizationProcedure } from "../middleware";

export const templateRouter = router({
  /**
   * Get a single template by ID
   */
  get: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const template = await ctx.db.template.findUnique({
        where: { id: input.id },
        include: {
          versions: {
            orderBy: { version: "desc" },
          },
          sections: {
            orderBy: { order: "asc" },
          },
          organization: {
            select: {
              id: true,
              name: true,
              brandKit: true,
            },
          },
        },
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        });
      }

      // Verify user has access to this template's organization
      const membership = await ctx.db.member.findFirst({
        where: {
          userId: ctx.session.user.id,
          organizationId: template.organizationId,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this template",
        });
      }

      return template;
    }),

  /**
   * List all templates for an organization
   */
  list: organizationProcedure
    .input(
      z
        .object({
          category: z.string().optional(),
          isPublic: z.boolean().optional(),
          isFavorite: z.boolean().optional(),
          limit: z.number().min(1).max(100).default(50),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        organizationId: ctx.organizationId,
        deletedAt: null,
      };

      if (input?.category) {
        where.category = input.category;
      }

      if (input?.isPublic !== undefined) {
        where.isPublic = input.isPublic;
      }

      if (input?.isFavorite !== undefined) {
        where.isFavorite = input.isFavorite;
      }

      const templates = await ctx.db.template.findMany({
        where,
        take: input?.limit || 50,
        ...(input?.cursor && {
          skip: 1,
          cursor: { id: input.cursor },
        }),
        orderBy: { updatedAt: "desc" },
        include: {
          versions: {
            where: { isCurrent: true },
            take: 1,
          },
          _count: {
            select: {
              versions: true,
              sections: true,
            },
          },
        },
      });

      return {
        templates,
        nextCursor:
          templates.length === (input?.limit || 50)
            ? templates[templates.length - 1]?.id
            : undefined,
      };
    }),

  /**
   * Create a new template
   */
  create: organizationProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        subject: z.string().optional(),
        content: z.string(),
        category: z.string().optional(),
        isPublic: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const template = await ctx.db.template.create({
        data: {
          organizationId: ctx.organizationId,
          name: input.name,
          description: input.description,
          subject: input.subject,
          content: input.content,
          category: input.category,
          isPublic: input.isPublic,
        },
      });

      // Create initial version
      const version = await ctx.db.templateVersion.create({
        data: {
          templateId: template.id,
          version: 1,
          name: "V1",
          content: input.content,
          subject: input.subject,
          isCurrent: true,
          createdBy: ctx.session?.user?.id,
        },
      });

      // Update template with current version
      await ctx.db.template.update({
        where: { id: template.id },
        data: { currentVersionId: version.id },
      });

      return template;
    }),

  /**
   * Update a template
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        subject: z.string().optional(),
        content: z.string().optional(),
        category: z.string().optional(),
        isPublic: z.boolean().optional(),
        isFavorite: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Verify access
      const template = await ctx.db.template.findUnique({
        where: { id },
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        });
      }

      const membership = await ctx.db.member.findFirst({
        where: {
          userId: ctx.session.user.id,
          organizationId: template.organizationId,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this template",
        });
      }

      const updatedTemplate = await ctx.db.template.update({
        where: { id },
        data: updateData,
      });

      return updatedTemplate;
    }),

  /**
   * Delete a template (soft delete)
   */
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify access
      const template = await ctx.db.template.findUnique({
        where: { id: input.id },
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        });
      }

      const membership = await ctx.db.member.findFirst({
        where: {
          userId: ctx.session.user.id,
          organizationId: template.organizationId,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this template",
        });
      }

      await ctx.db.template.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      });

      return { success: true };
    }),

  /**
   * Get version history for a template
   */
  versions: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify access
      const template = await ctx.db.template.findUnique({
        where: { id: input.templateId },
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        });
      }

      const membership = await ctx.db.member.findFirst({
        where: {
          userId: ctx.session.user.id,
          organizationId: template.organizationId,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this template",
        });
      }

      const versions = await ctx.db.templateVersion.findMany({
        where: { templateId: input.templateId },
        orderBy: { version: "desc" },
      });

      return versions;
    }),
});

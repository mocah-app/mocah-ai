import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../index";
import { organizationProcedure } from "../middleware";
import { aiClient, TEMPLATE_GENERATION_MODEL } from "../lib/ai";
import {
  buildTemplateGenerationPrompt,
  templateGenerationSchema,
} from "../lib/prompts";

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
   * Generate a new template using AI (non-streaming fallback)
   */
  generate: organizationProcedure
    .input(
      z.object({
        prompt: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Get organization brand kit
      const organization = await ctx.db.organization.findUnique({
        where: { id: ctx.organizationId },
        select: { brandKit: true },
      });

      // 2. Generate template structure
      const prompt = buildTemplateGenerationPrompt(
        input.prompt,
        organization?.brandKit as any
      );

      const result = await aiClient.generateStructured(
        templateGenerationSchema,
        prompt,
        TEMPLATE_GENERATION_MODEL
      );

      // 3. Transform sections (flatten content)
      const sections = result.sections.map((section: any) => ({
        type: section.type,
        styles: section.styles,
        ...section.content,
      }));

      const templateData = {
        subject: result.subject,
        previewText: result.previewText,
        sections,
      };

      const contentString = JSON.stringify(templateData);

      // 4. Create template
      const template = await ctx.db.template.create({
        data: {
          organizationId: ctx.organizationId,
          name: result.subject || "AI Generated Template",
          subject: result.subject,
          content: contentString,
          description: `Generated from prompt: ${input.prompt}`,
        },
      });

      // 5. Create initial version
      const version = await ctx.db.templateVersion.create({
        data: {
          templateId: template.id,
          version: 1,
          name: "V1",
          content: contentString,
          subject: result.subject,
          isCurrent: true,
          createdBy: ctx.session?.user?.id,
          metadata: {
            generatedFrom: "ai",
            prompt: input.prompt,
          },
        },
      });

      // 6. Update template with current version
      await ctx.db.template.update({
        where: { id: template.id },
        data: { currentVersionId: version.id },
      });

      return template;
    }),

  /**
   * Stream template generation for real-time updates
   * Use the /api/template/generate endpoint for actual streaming
   * This returns the stream configuration
   */
  generateStreamConfig: organizationProcedure
    .input(
      z.object({
        prompt: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Return configuration for frontend to use with fetch/EventSource
      return {
        endpoint: "/api/template/generate",
        method: "POST",
        body: {
          prompt: input.prompt,
          organizationId: ctx.organizationId,
        },
      };
    }),

  /**
   * Regenerate template content using AI (creates new version)
   */
  regenerate: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        prompt: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify access
      const template = await ctx.db.template.findUnique({
        where: { id: input.templateId },
        include: { organization: { select: { brandKit: true } } },
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

      // Generate template structure
      const prompt = buildTemplateGenerationPrompt(
        input.prompt,
        template.organization.brandKit as any
      );

      const result = await aiClient.generateStructured(
        templateGenerationSchema,
        prompt,
        TEMPLATE_GENERATION_MODEL
      );

      // Transform sections
      const sections = result.sections.map((section: any) => ({
        type: section.type,
        styles: section.styles,
        ...section.content,
      }));

      const templateData = {
        subject: result.subject,
        previewText: result.previewText,
        sections,
      };

      const contentString = JSON.stringify(templateData);

      // Get latest version number
      const latestVersion = await ctx.db.templateVersion.findFirst({
        where: { templateId: input.templateId },
        orderBy: { version: "desc" },
      });

      const newVersionNumber = (latestVersion?.version || 0) + 1;

      // Create new version
      const version = await ctx.db.templateVersion.create({
        data: {
          templateId: input.templateId,
          version: newVersionNumber,
          name: `AI Generated V${newVersionNumber}`,
          content: contentString,
          subject: result.subject,
          isCurrent: true,
          createdBy: ctx.session.user.id,
          metadata: {
            generatedFrom: "ai",
            prompt: input.prompt,
          },
        },
      });

      // Update template with current version
      await ctx.db.template.update({
        where: { id: input.templateId },
        data: {
          currentVersionId: version.id,
          subject: result.subject,
          content: contentString,
        },
      });

      return version;
    }),

  /**
   * Create a new template
   */
  create: organizationProcedure
    .input(
      z.object({
        id: z.uuid().optional(), // Allow client-provided UUID
        name: z.string().min(1),
        description: z.string().optional(),
        subject: z.string().optional(),
        content: z.string(),
        category: z.string().optional(),
        isPublic: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if ID already exists (collision detection)
      if (input.id) {
        const existing = await ctx.db.template.findUnique({
          where: { id: input.id },
        });
        
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Template ID already exists",
          });
        }
      }

      const template = await ctx.db.template.create({
        data: {
          ...(input.id && { id: input.id }), // Use client ID if provided
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

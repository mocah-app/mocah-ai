import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../index";
import { organizationProcedure } from "../middleware";
import { aiClient, TEMPLATE_GENERATION_MODEL } from "../lib/ai";
import {
  buildReactEmailPrompt,
  reactEmailGenerationSchema,
} from "../lib/prompts";
import { validateReactEmailCode, logger } from "@mocah/shared";

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

      // 2. Generate React Email template
      const prompt = buildReactEmailPrompt(
        input.prompt,
        organization?.brandKit as any
      );

      // Log complete AI request details
      logger.info("\n" + "=".repeat(80));
      logger.info("🤖 AI GENERATION REQUEST");
      logger.info("=".repeat(80));
      logger.info("\n📝 USER PROMPT:", { prompt: input.prompt });
      logger.info("\n🎨 BRAND KIT:", { brandKit: organization?.brandKit || {} });
      logger.info("\n📋 COMPLETE SYSTEM PROMPT:", { systemPrompt: prompt });
      logger.info("\n🔧 GENERATION CONFIG:", {
        model: TEMPLATE_GENERATION_MODEL,
        schemaFields: Object.keys(reactEmailGenerationSchema.shape),
      });
      logger.info("\n" + "=".repeat(80) + "\n");

      const result = await aiClient.generateStructured(
        reactEmailGenerationSchema,
        prompt,
        TEMPLATE_GENERATION_MODEL
      );

      // Log AI response summary
      logger.info("\n" + "=".repeat(80));
      logger.info("✅ AI GENERATION RESPONSE");
      logger.info("=".repeat(80));
      logger.info("Response Summary:", {
        subject: result.subject,
        previewText: result.previewText,
        styleType: result.styleType,
        codeLength: result.reactEmailCode?.length || 0,
        model: result.metadata?.model || "unknown",
        tokensUsed: result.metadata?.tokensUsed || "unknown",
      });
      logger.info("=".repeat(80) + "\n");

      // Validate generated React Email code
      logger.info("\n" + "=".repeat(80));
      logger.info("🔍 VALIDATION RESULTS");
      logger.info("=".repeat(80));
      const validation = validateReactEmailCode(result.reactEmailCode);
      logger.info(`Valid: ${validation.isValid ? "✅ YES" : "❌ NO"}`);
      
      if (validation.errors && validation.errors.length > 0) {
        logger.error("❌ VALIDATION ERRORS:", { errors: validation.errors });
      }
      
      if (validation.warnings && validation.warnings.length > 0) {
        logger.warn("⚠️  VALIDATION WARNINGS:", { warnings: validation.warnings });
      }
      
      if (validation.isValid && (!validation.warnings || validation.warnings.length === 0)) {
        logger.info("✨ Perfect! No errors or warnings.");
      }
      logger.info("=".repeat(80) + "\n");
      
      if (!validation.isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Generated code failed validation: ${validation.errors.join(", ")}`,
        });
      }

      // Parse styleDefinitions from JSON string if provided
      let styleDefinitions = {};
      if (result.styleDefinitionsJson) {
        try {
          styleDefinitions = JSON.parse(result.styleDefinitionsJson);
        } catch {
          // Ignore parse errors, use empty object
        }
      }

      // 3. Create template
      const template = await ctx.db.template.create({
        data: {
          organizationId: ctx.organizationId,
          name: result.subject || "AI Generated Template",
          subject: result.subject,
          description: `Generated from prompt: ${input.prompt}`,
          reactEmailCode: result.reactEmailCode,
          styleType: result.styleType.toUpperCase() as any,
          styleDefinitions,
          previewText: result.previewText,
        },
      });

      // 4. Create initial version
      const version = await ctx.db.templateVersion.create({
        data: {
          templateId: template.id,
          version: 1,
          name: "V1",
          subject: result.subject,
          isCurrent: true,
          createdBy: ctx.session?.user?.id,
          reactEmailCode: result.reactEmailCode,
          styleType: result.styleType.toUpperCase() as any,
          styleDefinitions,
          previewText: result.previewText,
          metadata: {
            generatedFrom: "ai",
            prompt: input.prompt,
            ...result.metadata,
          },
        },
      });

      // 5. Update template with current version
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

      // Get latest version number
      const latestVersion = await ctx.db.templateVersion.findFirst({
        where: { templateId: input.templateId },
        orderBy: { version: "desc" },
      });

      const newVersionNumber = (latestVersion?.version || 0) + 1;

      // Generate React Email template
      const prompt = buildReactEmailPrompt(
        input.prompt,
        template.organization.brandKit as any
      );

      const result = await aiClient.generateStructured(
        reactEmailGenerationSchema,
        prompt,
        TEMPLATE_GENERATION_MODEL
      );

      // Parse styleDefinitions from JSON string if provided
      let styleDefinitions = {};
      if (result.styleDefinitionsJson) {
        try {
          styleDefinitions = JSON.parse(result.styleDefinitionsJson);
        } catch {
          // Ignore parse errors, use empty object
        }
      }

      // Create new version
      const version = await ctx.db.templateVersion.create({
        data: {
          templateId: input.templateId,
          version: newVersionNumber,
          name: `AI Generated V${newVersionNumber}`,
          subject: result.subject,
          isCurrent: true,
          createdBy: ctx.session.user.id,
          reactEmailCode: result.reactEmailCode,
          styleType: result.styleType.toUpperCase() as any,
          styleDefinitions,
          previewText: result.previewText,
          metadata: {
            generatedFrom: "ai",
            prompt: input.prompt,
            ...result.metadata,
          },
        },
      });

      // Update template with current version
      await ctx.db.template.update({
        where: { id: input.templateId },
        data: {
          currentVersionId: version.id,
          subject: result.subject,
          reactEmailCode: result.reactEmailCode,
          styleType: result.styleType.toUpperCase() as any,
          styleDefinitions,
          previewText: result.previewText,
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
        category: z.string().optional(),
        isPublic: z.boolean().default(false),
        reactEmailCode: z.string(),
        styleType: z.enum(["INLINE", "PREDEFINED_CLASSES", "STYLE_OBJECTS"]).default("STYLE_OBJECTS"),
        styleDefinitions: z.record(z.string(), z.any()).optional(),
        previewText: z.string().optional(),
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
          ...(input.id && { id: input.id }),
          organizationId: ctx.organizationId,
          name: input.name,
          description: input.description,
          subject: input.subject,
          category: input.category,
          isPublic: input.isPublic,
          reactEmailCode: input.reactEmailCode,
          styleType: input.styleType,
          styleDefinitions: input.styleDefinitions,
          previewText: input.previewText,
        },
      });

      // Create initial version
      const version = await ctx.db.templateVersion.create({
        data: {
          templateId: template.id,
          version: 1,
          name: "V1",
          subject: input.subject,
          isCurrent: true,
          createdBy: ctx.session?.user?.id,
          reactEmailCode: input.reactEmailCode,
          styleType: input.styleType,
          styleDefinitions: input.styleDefinitions,
          previewText: input.previewText,
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
        category: z.string().optional(),
        isPublic: z.boolean().optional(),
        isFavorite: z.boolean().optional(),
        reactEmailCode: z.string().optional(),
        styleType: z.enum(["INLINE", "PREDEFINED_CLASSES", "STYLE_OBJECTS"]).optional(),
        styleDefinitions: z.record(z.string(), z.any()).optional(),
        previewText: z.string().optional(),
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

      // Validate React Email code if provided
      if (updateData.reactEmailCode) {

        // Find span tags in the code for debugging
        const spanTagMatches = updateData.reactEmailCode.match(/<span[\s>]/g);
        if (spanTagMatches) {
          logger.warn("⚠️ Found span tags in code:", {
            count: spanTagMatches.length,
            matches: spanTagMatches.slice(0, 10), // First 10 matches
          });
          
          // Find line numbers where span tags appear
          const lines = updateData.reactEmailCode.split('\n');
          const spanTagLines: Array<{ line: number; content: string }> = [];
          lines.forEach((line, index) => {
            if (/<span[\s>]/.test(line)) {
              spanTagLines.push({
                line: index + 1,
                content: line.trim().substring(0, 200),
              });
            }
          });
          
          if (spanTagLines.length > 0) {
            logger.warn("📍 Span tags found at lines:", {
              lines: spanTagLines.slice(0, 20), // First 20 occurrences
            });
          }
        }

        const validation = validateReactEmailCode(updateData.reactEmailCode);
        
        logger.info("Validation result:", {
          isValid: validation.isValid,
          errors: validation.errors || [],
          warnings: validation.warnings || [],
        });
        logger.info("=".repeat(80) + "\n");

        if (!validation.isValid) {
          logger.error("❌ [Template Update] Validation failed:", {
            errors: validation.errors,
            codeLength: updateData.reactEmailCode.length,
            codePreview: updateData.reactEmailCode.substring(0, 500),
          });
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invalid React Email code: ${validation.errors.join(", ")}`,
          });
        }

        // Log warnings if any
        if (validation.warnings && validation.warnings.length > 0) {
          logger.warn("⚠️ [Template Update] Validation warnings:", validation.warnings);
        }
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

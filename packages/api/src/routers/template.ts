import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../index";
import { organizationProcedure } from "../middleware";
import { aiClient, TEMPLATE_GENERATION_MODEL } from "../lib/ai";
import {
  buildReactEmailPrompt,
  buildReactEmailRegenerationPrompt,
  reactEmailGenerationSchema,
} from "../lib/prompts";
import { repairHtmlTags } from "../lib/html-tag-repair";
import { validateReactEmailCode, logger } from "@mocah/shared";
import { checkMembership } from "../lib/membership-cache";
import { serverEnv } from "@mocah/config/env";
import { generateTemplateScreenshot } from "../lib/screenshot";

// Valid style type values for templates
const VALID_STYLE_TYPES = ["INLINE", "PREDEFINED_CLASSES", "STYLE_OBJECTS"] as const;
type StyleType = (typeof VALID_STYLE_TYPES)[number];

/**
 * Validates and normalizes a style type string to a valid StyleType.
 * Uppercases the input, checks membership, logs warning and returns default if invalid.
 */
function validateStyleType(styleType: string): StyleType {
  const uppercased = styleType.toUpperCase();
  if (VALID_STYLE_TYPES.includes(uppercased as StyleType)) {
    return uppercased as StyleType;
  }
  logger.warn(`⚠️ Invalid styleType "${styleType}", defaulting to STYLE_OBJECTS`);
  return "STYLE_OBJECTS";
}


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
   * List all templates for an organization (minimal data for dashboard/lists)
   */
  list: organizationProcedure
    .input(
      z
        .object({
          category: z.string().optional(),
          status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
          includeDrafts: z.boolean().optional(), // Explicitly include DRAFT templates
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

      // Filter by status - default to ACTIVE only (excludes incomplete drafts)
      if (input?.status) {
        where.status = input.status;
      } else if (!input?.includeDrafts) {
        // By default, exclude DRAFT templates from dashboard
        where.status = "ACTIVE";
      }

      if (input?.category) {
        where.category = input.category;
      }

      if (input?.isPublic !== undefined) {
        where.isPublic = input.isPublic;
      }

      if (input?.isFavorite !== undefined) {
        where.isFavorite = input.isFavorite;
      }

      // Run count and list queries in parallel
      const [totalCount, templates] = await Promise.all([
        ctx.db.template.count({ where }),
        ctx.db.template.findMany({
          where,
          take: input?.limit || 50,
          ...(input?.cursor && {
            skip: 1,
            cursor: { id: input.cursor },
          }),
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            name: true,
            updatedAt: true,
            isFavorite: true,
            htmlCode: true, // Include cached HTML for preview
            _count: {
              select: {
                versions: true,
              },
            },
          },
        }),
      ]);

      return {
        templates,
        totalCount,
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
      // logger.info("\n" + "=".repeat(80));
      // logger.info("🤖 AI GENERATION REQUEST");
      // logger.info("=".repeat(80));
      // logger.info("\n📝 USER PROMPT:", { prompt: input.prompt });
      // logger.info("\n🎨 BRAND KIT:", { brandKit: organization?.brandKit || {} });
      // logger.info("\n📋 COMPLETE SYSTEM PROMPT:", { systemPrompt: prompt });
      // logger.info("\n🔧 GENERATION CONFIG:", {
      //   model: TEMPLATE_GENERATION_MODEL,
      //   schemaFields: Object.keys(reactEmailGenerationSchema.shape),
      // });
      // logger.info("\n" + "=".repeat(80) + "\n");

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
      });
      logger.info("=".repeat(80) + "\n");

      // Auto-repair HTML tags before validation (safety net for non-compliant AI output)
      const repairResult = repairHtmlTags(result.reactEmailCode);
      if (repairResult.changed) {
        logger.info("🔧 Auto-repaired HTML tags in AI output", {
          originalLength: result.reactEmailCode.length,
          repairedLength: repairResult.code.length,
          changeCount: repairResult.changeCount,
        });
        result.reactEmailCode = repairResult.code;
      }

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

      // 3. Create template
      const template = await ctx.db.template.create({
        data: {
          organizationId: ctx.organizationId,
          name: result.subject || "AI Generated Template",
          subject: result.subject,
          description: `Generated from prompt: ${input.prompt}`,
          reactEmailCode: result.reactEmailCode,
          styleType: validateStyleType(result.styleType),
          styleDefinitions: {},
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
          styleType: validateStyleType(result.styleType),
          styleDefinitions: {},
          previewText: result.previewText,
          metadata: {
            generatedFrom: "ai",
            prompt: input.prompt,
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

      // Generate React Email template with context from current template
      const prompt = buildReactEmailRegenerationPrompt(
        input.prompt,
        template.reactEmailCode || "",  // Current template code for context
        template.organization.brandKit as any
      );

      logger.info("🔄 [Regeneration] Building prompt with current template", {
        templateId: input.templateId,
        userPrompt: input.prompt,
        hasCurrentCode: !!template.reactEmailCode,
        codeLength: template.reactEmailCode?.length || 0,
      });

      const result = await aiClient.generateStructured(
        reactEmailGenerationSchema,
        prompt,
        TEMPLATE_GENERATION_MODEL
      );

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
          styleType: validateStyleType(result.styleType),
          styleDefinitions: {},
          previewText: result.previewText,
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
          reactEmailCode: result.reactEmailCode,
          styleType: validateStyleType(result.styleType),
          styleDefinitions: {},
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
        htmlCode: z.string().optional(), // Rendered HTML (generated client-side)
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
        status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
        isPublic: z.boolean().optional(),
        isFavorite: z.boolean().optional(),
        reactEmailCode: z.string().optional(),
        htmlCode: z.string().optional(), // Rendered HTML (generated client-side)
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

      const isMember = await checkMembership(
        ctx.db,
        ctx.session.user.id,
        template.organizationId
      );

      if (!isMember) {
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

        // Auto-repair HTML tags before validation (safety net for non-compliant AI output)
        const repairResult = repairHtmlTags(updateData.reactEmailCode);
        if (repairResult.changed) {
          logger.info("🔧 Auto-repaired HTML tags in AI output", {
            originalLength: updateData.reactEmailCode.length,
            repairedLength: repairResult.code.length,
            changeCount: repairResult.changeCount,
          });
          updateData.reactEmailCode = repairResult.code;
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
          
          // Return validation errors with the attempted code instead of throwing
          // This allows the frontend to show a friendly error UI with "Fix with AI" option
          return {
            validationFailed: true as const,
            validationErrors: validation.errors,
            validationWarnings: validation.warnings || [],
            attemptedCode: updateData.reactEmailCode,
            templateId: id,
          };
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
   * Duplicate a template (remix)
   */
  duplicate: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify access and get template with messages and images
      const template = await ctx.db.template.findUnique({
        where: { id: input.id },
        include: {
          currentVersion: true,
          messages: {
            orderBy: {
              createdAt: "asc",
            },
          },
          imageAssets: {
            where: {
              versionId: null, // Get template-level images (not version-specific)
            },
          },
          libraryTemplates: {
            select: {
              id: true,
            },
            take: 1, // Just check if it exists
          },
        },
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        });
      }

      // Check if template is public or has been published to library
      // If so, allow duplication into user's active org
      const isPublicOrInLibrary = template.isPublic || template.libraryTemplates.length > 0;
      let targetOrganizationId = template.organizationId;
      
      if (isPublicOrInLibrary) {
        // For public/library templates, duplicate into user's active organization
        if (!ctx.activeOrganization) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No active organization. Please select or create an organization first.",
          });
        }
        targetOrganizationId = ctx.activeOrganization.id;
      } else {
        // For private templates, require membership in the source organization
        const isMember = await checkMembership(
          ctx.db,
          ctx.session.user.id,
          template.organizationId
        );

        if (!isMember) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this template",
          });
        }
      }

      // Create duplicated template
      const duplicatedTemplate = await ctx.db.template.create({
        data: {
          organizationId: targetOrganizationId,
          name: `${template.name} (Copy)`,
          description: template.description,
          subject: template.subject,
          category: template.category,
          status: template.status,
          isPublic: false, // Duplicates are private by default
          isFavorite: false, // Don't copy favorite status
          reactEmailCode: template.reactEmailCode,
          styleType: template.styleType,
          styleDefinitions: template.styleDefinitions as any,
          htmlCode: template.htmlCode,
          tableHtmlCode: template.tableHtmlCode,
          previewText: template.previewText,
        },
      });

      // Create initial version from current version if it exists
      if (template.currentVersion) {
        const duplicatedVersion = await ctx.db.templateVersion.create({
          data: {
            templateId: duplicatedTemplate.id,
            version: 1,
            name: "V1",
            subject: template.currentVersion.subject,
            isCurrent: true,
            createdBy: ctx.session.user.id,
            reactEmailCode: template.currentVersion.reactEmailCode,
            styleType: template.currentVersion.styleType,
            styleDefinitions: template.currentVersion.styleDefinitions as any,
            htmlCode: template.currentVersion.htmlCode,
            tableHtmlCode: template.currentVersion.tableHtmlCode,
            previewText: template.currentVersion.previewText,
            metadata: {
              duplicatedFrom: template.id,
              duplicatedAt: new Date().toISOString(),
            },
          },
        });

        // Update template with current version
        await ctx.db.template.update({
          where: { id: duplicatedTemplate.id },
          data: { currentVersionId: duplicatedVersion.id },
        });
      }

      // Copy chat messages
      if (template.messages && template.messages.length > 0) {
        const messagesToCreate = template.messages.map((msg) => ({
          templateId: duplicatedTemplate.id,
          role: msg.role,
          content: msg.content,
          isStreaming: false, // Messages are never streaming on duplication
          metadata: msg.metadata as any,
        }));

        await ctx.db.chatMessage.createMany({
          data: messagesToCreate,
        });
      }

      // Copy image assets with source metadata
      if (template.imageAssets && template.imageAssets.length > 0) {
        const imagesToCreate = template.imageAssets.map((img) => ({
          organizationId: targetOrganizationId, // Use target org (user's org for public templates)
          userId: ctx.session.user.id, // New owner is the current user
          templateId: duplicatedTemplate.id,
          versionId: null, // Template-level images
          prompt: img.prompt,
          model: img.model,
          requestId: img.requestId,
          url: img.url, // Same storage URL (not copying the blob)
          storageKey: img.storageKey, // Same storage key
          contentType: img.contentType,
          aspectRatio: img.aspectRatio,
          width: img.width,
          height: img.height,
          nsfw: img.nsfw,
          blurDataUrl: img.blurDataUrl,
          metadata: {
            ...(img.metadata as any),
            sourceImageAssetId: img.id, // Track the original image
            remixedFrom: template.id,
            remixedAt: new Date().toISOString(),
          },
        }));

        await ctx.db.imageAsset.createMany({
          data: imagesToCreate,
        });
      }

      return duplicatedTemplate;
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

      const isMember = await checkMembership(
        ctx.db,
        ctx.session.user.id,
        template.organizationId
      );

      if (!isMember) {
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

      const isMember = await checkMembership(
        ctx.db,
        ctx.session.user.id,
        template.organizationId
      );

      if (!isMember) {
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

  /**
   * Check if current user can publish templates to library
   */
  canPublishToLibrary: protectedProcedure.query(async ({ ctx }) => {
    const publisherEmails = serverEnv.TEMPLATE_PUBLISHER_EMAILS || "";
    const allowedEmails = publisherEmails
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);

    const userEmail = ctx.session.user.email.toLowerCase();
    return allowedEmails.includes(userEmail);
  }),

  /**
   * Get library categories
   */
  getLibraryCategories: publicProcedure.query(async ({ ctx }) => {
    const categories = await ctx.db.templateCategory.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        name: "asc",
      },
    });

    return categories;
  }),

  /**
   * Get library templates with search and filter
   */
  getLibraryTemplates: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        categorySlug: z.string().optional(),
        tags: z.array(z.string()).optional(),
        limit: z.number().min(1).max(100).optional().default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        deletedAt: null,
      };

      // Search filter
      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { description: { contains: input.search, mode: "insensitive" } },
        ];
      }

      // Category filter
      if (input.categorySlug) {
        where.category = input.categorySlug;
      }

      // Tags filter
      if (input.tags && input.tags.length > 0) {
        where.tags = {
          hasSome: input.tags,
        };
      }

      const templates = await ctx.db.templateLibrary.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          templateId: true,
          name: true,
          description: true,
          subject: true,
          category: true,
          thumbnail: true,
          htmlCode: true,
          isPremium: true,
          tags: true,
          previewText: true,
          createdAt: true,
        },
      });

      let nextCursor: string | undefined = undefined;
      if (templates.length > input.limit) {
        const nextItem = templates.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: templates,
        nextCursor,
      };
    }),

  /**
   * Get library template detail with messages
   */
  getLibraryTemplateDetail: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const libraryTemplate = await ctx.db.templateLibrary.findUnique({
        where: { id: input.id },
        include: {
          sourceTemplate: {
            select: {
              id: true,
              messages: {
                take: 2, // Get first 2 messages (user prompt + AI response)
                orderBy: {
                  createdAt: "asc",
                },
              },
            },
          },
        },
      });

      if (!libraryTemplate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Library template not found",
        });
      }

      return libraryTemplate;
    }),

  /**
   * Publish a template to the library
   */
  publishToLibrary: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        isPremium: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check authorization
      const publisherEmails = serverEnv.TEMPLATE_PUBLISHER_EMAILS || "";
      const allowedEmails = publisherEmails
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);

      const userEmail = ctx.session.user.email.toLowerCase();
      if (!allowedEmails.includes(userEmail)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to publish templates to the library",
        });
      }

      // Get template
      const template = await ctx.db.template.findUnique({
        where: { id: input.id },
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        });
      }

      // Verify user has access
      const isMember = await checkMembership(
        ctx.db,
        ctx.session.user.id,
        template.organizationId
      );

      if (!isMember) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this template",
        });
      }

      // Generate thumbnail screenshot
      const thumbnailUrl = template.htmlCode
        ? await generateTemplateScreenshot({
            templateId: template.id,
            htmlCode: template.htmlCode,
          })
        : null;

      // Create or update library template
      const libraryTemplate = await ctx.db.templateLibrary.create({
        data: {
          templateId: template.id, // Link to source template for chat messages
          name: template.name,
          description: template.description,
          subject: template.subject,
          category: input.category || template.category,
          tags: input.tags || [],
          isPremium: input.isPremium || false,
          thumbnail: thumbnailUrl, // Add generated thumbnail
          reactEmailCode: template.reactEmailCode,
          htmlCode: template.htmlCode, // Save HTML for preview (fallback)
          styleType: template.styleType,
          styleDefinitions: template.styleDefinitions as any,
          previewText: template.previewText,
        },
      });

      return libraryTemplate;
    }),
});

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../index";
import {
  organizationProcedure,
  templateQuotaProcedure,
  requireActiveOrganization,
  requireTemplateGenerationQuota,
} from "../middleware";
import { aiClient, TEMPLATE_GENERATION_MODEL } from "../lib/ai";
import {
  buildReactEmailPrompt,
  buildReactEmailRegenerationPrompt,
  reactEmailGenerationSchema,
} from "../lib/prompts";
import { logger } from "@mocah/shared";
import { checkMembership } from "../lib/membership-cache";
import {
  getActiveTrial,
  incrementUsage,
  checkUsageLimit,
  UsageLimitError,
} from "../lib/usage-tracking";
import {
  validateStyleType,
  verifyTemplateAccess,
  createInitialVersion,
  validateAndRepairCode,
} from "../lib/template-helpers";

export const templateCoreRouter = router({
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
      const template = await verifyTemplateAccess(
        ctx.db,
        ctx.session.user.id,
        input.id,
        {
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
        }
      );

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
   * Uses templateQuotaProcedure + organizationProcedure for usage limit enforcement and org context
   */
  generate: protectedProcedure
    .use(requireActiveOrganization)
    .use(requireTemplateGenerationQuota)
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

      // Validate and repair code
      const validationResult = validateAndRepairCode(result.reactEmailCode);

      // Log validation results
      logger.info("\n" + "=".repeat(80));
      logger.info("🔍 VALIDATION RESULTS");
      logger.info("=".repeat(80));
      logger.info(`Valid: ${validationResult.isValid ? "✅ YES" : "❌ NO"}`);

      if (validationResult.errors && validationResult.errors.length > 0) {
        logger.error("❌ VALIDATION ERRORS:", { errors: validationResult.errors });
      }

      if (validationResult.warnings && validationResult.warnings.length > 0) {
        logger.warn("⚠️  VALIDATION WARNINGS:", { warnings: validationResult.warnings });
      }

      if (validationResult.isValid && (!validationResult.warnings || validationResult.warnings.length === 0)) {
        logger.info("✨ Perfect! No errors or warnings.");
      }
      logger.info("=".repeat(80) + "\n");

      if (!validationResult.isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Generated code failed validation: ${validationResult.errors.join(", ")}`,
        });
      }

      // 3. Create template
      if (!ctx.organizationId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Organization context required",
        });
      }

      const template = await ctx.db.template.create({
        data: {
          organizationId: ctx.organizationId,
          name: result.subject || "AI Generated Template",
          subject: result.subject,
          description: `Generated from prompt: ${input.prompt}`,
          reactEmailCode: validationResult.code,
          styleType: validateStyleType(result.styleType),
          styleDefinitions: {},
          previewText: result.previewText,
        },
      });

      // 4. Create initial version
      await createInitialVersion(
        ctx.db,
        {
          templateId: template.id,
          version: 1,
          name: "V1",
          subject: result.subject,
          reactEmailCode: validationResult.code,
          styleType: validateStyleType(result.styleType),
          styleDefinitions: {},
          previewText: result.previewText,
          metadata: {
            generatedFrom: "ai",
            prompt: input.prompt,
          },
        },
        ctx.session?.user?.id
      );

      // 5. Increment usage after successful generation
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Authentication required",
        });
      }
      await incrementUsage(ctx.session.user.id, "templateGeneration");

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
   * Uses templateQuotaProcedure for usage limit enforcement
   */
  regenerate: templateQuotaProcedure
    .input(
      z.object({
        templateId: z.string(),
        prompt: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify access
      const template = await verifyTemplateAccess<{
        id: string;
        reactEmailCode: string | null;
        organization: { brandKit: any };
      }>(
        ctx.db,
        ctx.session!.user.id,
        input.templateId,
        {
          include: { organization: { select: { brandKit: true } } },
        }
      );

      // Get latest version number
      const latestVersion = await ctx.db.templateVersion.findFirst({
        where: { templateId: input.templateId },
        orderBy: { version: "desc" },
      });

      const newVersionNumber = (latestVersion?.version || 0) + 1;

      // Generate React Email template with context from current template
      const prompt = buildReactEmailRegenerationPrompt(
        input.prompt,
        template.reactEmailCode || "", // Current template code for context
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
          createdBy: ctx.session!.user.id,
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

      // Increment usage after successful regeneration
      await incrementUsage(ctx.session!.user.id, "templateGeneration");

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
      await createInitialVersion(
        ctx.db,
        {
          templateId: template.id,
          version: 1,
          name: "V1",
          subject: input.subject,
          reactEmailCode: input.reactEmailCode,
          styleType: input.styleType,
          styleDefinitions: input.styleDefinitions,
          previewText: input.previewText,
        },
        ctx.session?.user?.id
      );

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
      await verifyTemplateAccess(ctx.db, ctx.session.user.id, id);

      // Check if this is a first-time generation (template being saved after streaming)
      // We increment usage when:
      // 1. reactEmailCode is being set (not empty)
      // 2. AND template didn't have reactEmailCode before (or had empty string)
      // 3. AND status is being set to ACTIVE
      let shouldIncrementUsage = false;
      if (updateData.reactEmailCode && updateData.reactEmailCode.trim().length > 0) {
        const existingTemplate = await ctx.db.template.findUnique({
          where: { id },
          select: { status: true, reactEmailCode: true },
        });

        // Increment if:
        // - Template didn't have reactEmailCode before (empty or null) - first generation
        // - AND status is being set to ACTIVE
        const isFirstGeneration =
          existingTemplate &&
          (!existingTemplate.reactEmailCode ||
            existingTemplate.reactEmailCode.trim().length === 0);

        const isBeingActivated = updateData.status === "ACTIVE";

        if (isFirstGeneration && isBeingActivated) {
          shouldIncrementUsage = true;
        }
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
          const lines = updateData.reactEmailCode.split("\n");
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

        // Validate and repair code
        const validationResult = validateAndRepairCode(updateData.reactEmailCode);
        updateData.reactEmailCode = validationResult.code;

        logger.info("Validation result:", {
          isValid: validationResult.isValid,
          errors: validationResult.errors || [],
          warnings: validationResult.warnings || [],
        });
        logger.info("=".repeat(80) + "\n");

        if (!validationResult.isValid) {
          logger.error("❌ [Template Update] Validation failed:", {
            errors: validationResult.errors,
            codeLength: updateData.reactEmailCode.length,
            codePreview: updateData.reactEmailCode.substring(0, 500),
          });

          // Return validation errors with the attempted code instead of throwing
          // This allows the frontend to show a friendly error UI with "Fix with AI" option
          return {
            validationFailed: true as const,
            validationErrors: validationResult.errors,
            validationWarnings: validationResult.warnings || [],
            attemptedCode: updateData.reactEmailCode,
            templateId: id,
          };
        }

        // Log warnings if any
        if (validationResult.warnings && validationResult.warnings.length > 0) {
          logger.warn("⚠️ [Template Update] Validation warnings:", validationResult.warnings);
        }
      }

      const updatedTemplate = await ctx.db.template.update({
        where: { id },
        data: updateData,
      });

      // Increment usage after successful first generation
      if (shouldIncrementUsage && ctx.session?.user?.id) {
        await incrementUsage(ctx.session.user.id, "templateGeneration").catch(
          (err) => {
            logger.error("Failed to increment template usage", {
              error: err,
              userId: ctx.session.user.id,
              templateId: id,
            });
            // Don't fail the request if usage tracking fails, but log it
          }
        );
      }

      return updatedTemplate;
    }),

  /**
   * Duplicate a template (remix)
   * Requires active subscription for library template remixes
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

      // Check usage limit for ALL template duplications (prevents quota bypass)
      const usageCheck = await checkUsageLimit(ctx.session.user.id, "templateGeneration");
      
      if (!usageCheck.allowed) {
        throw new UsageLimitError({
          code: usageCheck.isTrialUser ? "TRIAL_LIMIT_REACHED" : "QUOTA_EXCEEDED",
          remaining: usageCheck.remaining,
          limit: usageCheck.limit,
          resetDate: usageCheck.resetDate,
        });
      }

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
        await createInitialVersion(
          ctx.db,
          {
            templateId: duplicatedTemplate.id,
            version: 1,
            name: "V1",
            subject: template.currentVersion.subject,
            reactEmailCode: template.currentVersion.reactEmailCode || "",
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
          ctx.session.user.id
        );
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

      // Increment usage for ALL template duplications (prevents quota bypass)
      // All remixes count against quota, regardless of source (public/private)
      await incrementUsage(ctx.session.user.id, "templateGeneration").catch(
        (err) => {
          logger.error("Failed to increment remix usage", {
            error: err,
            userId: ctx.session.user.id,
            templateId: input.id,
            duplicatedTemplateId: duplicatedTemplate.id,
          });
          // Don't fail the request if usage tracking fails, but log it
        }
      );

      return duplicatedTemplate;
    }),

  /**
   * Delete a template (soft delete)
   * Note: Template deletion is blocked during trial period
   */
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is in trial - templates cannot be deleted during trial
      const trial = await getActiveTrial(ctx.session.user.id);
      
      if (trial) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Templates cannot be deleted during trial. This preserves your trial generation count. Upgrade to manage templates freely.",
          cause: {
            code: "TRIAL_RESTRICTION",
            upgradeUrl: "/pricing",
          },
        });
      }

      // Verify access
      await verifyTemplateAccess(ctx.db, ctx.session.user.id, input.id);

      await ctx.db.template.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      });

      return { success: true };
    }),
});


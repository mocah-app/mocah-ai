import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../index";
import { generateTemplateScreenshot } from "../lib/screenshot";
import {
  checkPublisherPermission,
  verifyTemplateAccess,
  verifyLibraryEntryOwnership,
} from "../lib/template-helpers";

export const templateLibraryRouter = router({
  /**
   * Check if current user can publish templates to library
   */
  canPublish: protectedProcedure.query(async ({ ctx }) => {
    return checkPublisherPermission(ctx.session.user.email);
  }),

  /**
   * Get library categories
   */
  getCategories: publicProcedure.query(async ({ ctx }) => {
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
   * Create a new template category (publisher only)
   */
  createCategory: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        slug: z.string().optional(), // Optional, will be generated from name if not provided
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check authorization
      if (!checkPublisherPermission(ctx.session.user.email)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to create template categories",
        });
      }

      // Generate slug from name if not provided
      let slug = input.slug || input.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "") // Remove special characters
        .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

      // Ensure slug is not empty
      if (!slug) {
        slug = `category-${Date.now()}`;
      }

      // Check if slug already exists
      const existing = await ctx.db.templateCategory.findUnique({
        where: { slug },
      });

      if (existing) {
        // Append number if slug exists
        let counter = 1;
        let uniqueSlug = `${slug}-${counter}`;
        while (
          await ctx.db.templateCategory.findUnique({
            where: { slug: uniqueSlug },
          })
        ) {
          counter++;
          uniqueSlug = `${slug}-${counter}`;
        }
        slug = uniqueSlug;
      }

      // Create category
      const category = await ctx.db.templateCategory.create({
        data: {
          name: input.name.trim(),
          slug,
          description: input.description?.trim(),
        },
      });

      return category;
    }),

  /**
   * Update a template category (publisher only)
   */
  updateCategory: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check authorization
      if (!checkPublisherPermission(ctx.session.user.email)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update template categories",
        });
      }

      // Check if category exists
      const existing = await ctx.db.templateCategory.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      // Generate new slug from name if name changed
      let slug = existing.slug;
      if (input.name.trim() !== existing.name) {
        slug = input.name
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "") // Remove special characters
          .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
          .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

        // Ensure slug is not empty
        if (!slug) {
          slug = `category-${Date.now()}`;
        }

        // Check if new slug already exists (excluding current category)
        const slugExists = await ctx.db.templateCategory.findFirst({
          where: {
            slug,
            id: { not: input.id },
          },
        });

        if (slugExists) {
          // Append number if slug exists
          let counter = 1;
          let uniqueSlug = `${slug}-${counter}`;
          while (
            await ctx.db.templateCategory.findFirst({
              where: {
                slug: uniqueSlug,
                id: { not: input.id },
              },
            })
          ) {
            counter++;
            uniqueSlug = `${slug}-${counter}`;
          }
          slug = uniqueSlug;
        }
      }

      // Update category
      const category = await ctx.db.templateCategory.update({
        where: { id: input.id },
        data: {
          name: input.name.trim(),
          slug,
          description: input.description?.trim() || null,
        },
      });

      return category;
    }),

  /**
   * Delete a template category (publisher only, soft delete)
   */
  deleteCategory: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check authorization
      if (!checkPublisherPermission(ctx.session.user.email)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete template categories",
        });
      }

      // Check if category exists
      const existing = await ctx.db.templateCategory.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      // Soft delete (set deletedAt)
      await ctx.db.templateCategory.update({
        where: { id: input.id },
        data: {
          deletedAt: new Date(),
        },
      });

      return { success: true };
    }),

  /**
   * Get library templates with search and filter
   */
  getTemplates: publicProcedure
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
  getDetail: publicProcedure
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
  publish: protectedProcedure
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
      if (!checkPublisherPermission(ctx.session.user.email)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to publish templates to the library",
        });
      }

      // Get template and verify access
      const template = await verifyTemplateAccess(
        ctx.db,
        ctx.session.user.id,
        input.id
      );

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

  /**
   * Get all published templates for current organization
   */
  getPublished: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        sortBy: z.enum(["newest", "oldest", "name_asc", "name_desc"]).optional().default("newest"),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.activeOrganization) {
        throw new Error("No active organization");
      }

      // Build where clause
      const where: any = {
        deletedAt: null,
        sourceTemplate: {
          organizationId: ctx.activeOrganization.id,
          deletedAt: null,
        },
      };

      // Search filter
      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { description: { contains: input.search, mode: "insensitive" } },
          { tags: { hasSome: [input.search] } },
        ];
      }

      // Category filter
      if (input.category) {
        where.category = input.category;
      }

      // Build orderBy
      let orderBy: any = { createdAt: "desc" };
      switch (input.sortBy) {
        case "oldest":
          orderBy = { createdAt: "asc" };
          break;
        case "name_asc":
          orderBy = { name: "asc" };
          break;
        case "name_desc":
          orderBy = { name: "desc" };
          break;
      }

      const publishedTemplates = await ctx.db.templateLibrary.findMany({
        where,
        orderBy,
        include: {
          sourceTemplate: {
            select: {
              id: true,
              name: true,
              updatedAt: true,
            },
          },
          _count: {
            select: {
              customizations: true, // Count of remixes
            },
          },
        },
      });

      return publishedTemplates;
    }),

  /**
   * Get library entry for a specific template (check if published)
   */
  getEntryForTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user has access to template
      await verifyTemplateAccess(ctx.db, ctx.session.user.id, input.templateId);

      // Get library entry
      const libraryEntry = await ctx.db.templateLibrary.findFirst({
        where: {
          templateId: input.templateId,
          deletedAt: null,
        },
        include: {
          _count: {
            select: {
              customizations: true,
            },
          },
        },
      });

      return libraryEntry;
    }),

  /**
   * Update library entry metadata
   */
  updateEntry: protectedProcedure
    .input(
      z.object({
        libraryId: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        subject: z.string().optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        isPremium: z.boolean().optional(),
        regenerateThumbnail: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const libraryEntry = await verifyLibraryEntryOwnership(
        ctx.db,
        ctx.session.user.id,
        input.libraryId
      );

      // Regenerate thumbnail if requested
      let thumbnailUrl = libraryEntry.thumbnail;
      if (input.regenerateThumbnail && libraryEntry.htmlCode) {
        thumbnailUrl = await generateTemplateScreenshot({
          templateId: libraryEntry.sourceTemplate!.id,
          htmlCode: libraryEntry.htmlCode,
        });
      }

      // Update library entry
      const updated = await ctx.db.templateLibrary.update({
        where: { id: input.libraryId },
        data: {
          name: input.name,
          description: input.description,
          subject: input.subject,
          category: input.category,
          tags: input.tags,
          isPremium: input.isPremium,
          thumbnail: thumbnailUrl,
        },
      });

      return updated;
    }),

  /**
   * Update library entry from source template (sync latest changes)
   */
  updateFromSource: protectedProcedure
    .input(
      z.object({
        libraryId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const libraryEntry = await verifyLibraryEntryOwnership(
        ctx.db,
        ctx.session.user.id,
        input.libraryId
      );

      const sourceTemplate = libraryEntry.sourceTemplate!;

      // Generate new thumbnail
      const thumbnailUrl = sourceTemplate.htmlCode
        ? await generateTemplateScreenshot({
            templateId: sourceTemplate.id,
            htmlCode: sourceTemplate.htmlCode,
          })
        : libraryEntry.thumbnail;

      // Update library entry with source template data
      const updated = await ctx.db.templateLibrary.update({
        where: { id: input.libraryId },
        data: {
          reactEmailCode: sourceTemplate.reactEmailCode,
          htmlCode: sourceTemplate.htmlCode,
          styleType: sourceTemplate.styleType,
          styleDefinitions: sourceTemplate.styleDefinitions as any,
          previewText: sourceTemplate.previewText,
          thumbnail: thumbnailUrl,
          // Note: We don't update name/description/category automatically
          // User can update those separately via updateLibraryEntry
        },
      });

      return {
        updated,
        changes: {
          codeUpdated: true,
          thumbnailRegenerated: !!thumbnailUrl,
        },
      };
    }),

  /**
   * Unpublish template (soft delete from library)
   */
  unpublish: protectedProcedure
    .input(
      z.object({
        libraryId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const libraryEntry = await verifyLibraryEntryOwnership(
        ctx.db,
        ctx.session.user.id,
        input.libraryId
      );

      // Soft delete (set deletedAt)
      await ctx.db.templateLibrary.update({
        where: { id: input.libraryId },
        data: {
          deletedAt: new Date(),
        },
      });

      return {
        success: true,
        remixCount: libraryEntry._count.customizations,
      };
    }),

  /**
   * Permanently delete library entry
   */
  deleteEntry: protectedProcedure
    .input(
      z.object({
        libraryId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const libraryEntry = await verifyLibraryEntryOwnership(
        ctx.db,
        ctx.session.user.id,
        input.libraryId
      );

      // Hard delete
      await ctx.db.templateLibrary.delete({
        where: { id: input.libraryId },
      });

      return {
        success: true,
        remixCount: libraryEntry._count.customizations,
      };
    }),
});


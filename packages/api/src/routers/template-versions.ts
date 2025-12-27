import { z } from "zod";
import { protectedProcedure, router } from "../index";
import { verifyTemplateAccess } from "../lib/template-helpers";
import { logger } from "@mocah/shared";

export const templateVersionsRouter = router({
  /**
   * Get version history for a template
   */
  list: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify access
      await verifyTemplateAccess(ctx.db, ctx.session.user.id, input.templateId);

      const versions = await ctx.db.templateVersion.findMany({
        where: { templateId: input.templateId },
        orderBy: { version: "desc" },
      });

      return versions;
    }),

  /**
   * Create a new version from current template state
   * This snapshots the current template state before saving new changes
   * NOTE: This does NOT update template.currentVersionId - that only happens on restore
   */
  create: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        name: z.string().optional(),
        changeNote: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Get current template with all versions for cleanup
      const template = await verifyTemplateAccess<{
        id: string;
        reactEmailCode: string | null;
        styleType: any;
        styleDefinitions: any;
        htmlCode: string | null;
        tableHtmlCode: string | null;
        subject: string | null;
        previewText: string | null;
        currentVersionId: string | null;
        versions: Array<{ id: string; version: number }>;
      }>(
        ctx.db,
        ctx.session.user.id,
        input.templateId,
        {
          include: {
            versions: {
              orderBy: { version: "desc" },
            },
          },
        }
      );

      // 2. Delete oldest versions if we have 10 or more (keep most recent 9)
      if (template.versions.length >= 10) {
        const versionsToDelete = template.versions.slice(9); // Keep first 9, delete rest
        const idsToDelete = versionsToDelete.map((v: { id: string }) => v.id);

        await ctx.db.templateVersion.deleteMany({
          where: {
            id: { in: idsToDelete },
          },
        });

        logger.info("🗑️ [Template] Deleted old versions:", {
          templateId: input.templateId,
          deletedCount: idsToDelete.length,
        });
      }

      // 3. Calculate next version number
      const latestVersion = template.versions[0];
      const nextVersionNumber = latestVersion ? latestVersion.version + 1 : 1;

      // 4. Create new version (snapshot current template state)
      const newVersion = await ctx.db.templateVersion.create({
        data: {
          templateId: input.templateId,
          version: nextVersionNumber,
          name: input.name || `Version ${nextVersionNumber}`,
          changeNote: input.changeNote,
          reactEmailCode: template.reactEmailCode,
          styleType: template.styleType,
          styleDefinitions: template.styleDefinitions || undefined,
          htmlCode: template.htmlCode,
          tableHtmlCode: template.tableHtmlCode,
          subject: template.subject,
          previewText: template.previewText,
          isCurrent: false, // Snapshots are NOT current - template is current
          parentVersionId: template.currentVersionId,
          createdBy: ctx.session.user.id,
          metadata: template.styleDefinitions
            ? {
                source: "manual_save",
                createdAt: new Date().toISOString(),
              }
            : undefined,
        },
      });

      // NOTE: We do NOT update template.currentVersionId here
      // Snapshots are historical records, not the current state
      // Only restoreVersion should update currentVersionId

      logger.info("📦 [Template] Version snapshot created:", {
        templateId: input.templateId,
        versionId: newVersion.id,
        versionNumber: nextVersionNumber,
        source: "manual_save",
      });

      return newVersion;
    }),
});


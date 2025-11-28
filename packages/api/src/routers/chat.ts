import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../index";

/**
 * Helper to verify user has access to a template
 */
async function verifyTemplateAccess(
  db: any,
  userId: string,
  templateId: string
) {
  const template = await db.template.findUnique({
    where: { id: templateId },
    select: { organizationId: true },
  });

  if (!template) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Template not found",
    });
  }

  const membership = await db.member.findFirst({
    where: {
      userId,
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
}

export const chatRouter = router({
  /**
   * List all messages for a template
   */
  list: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify access to template
      await verifyTemplateAccess(
        ctx.db,
        ctx.session.user.id,
        input.templateId
      );

      const messages = await ctx.db.chatMessage.findMany({
        where: {
          templateId: input.templateId,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      return messages;
    }),

  /**
   * Create a new chat message
   */
  create: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        role: z.enum(["user", "assistant"]),
        content: z.string(),
        isStreaming: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify access to template
      await verifyTemplateAccess(
        ctx.db,
        ctx.session.user.id,
        input.templateId
      );

      const message = await ctx.db.chatMessage.create({
        data: {
          templateId: input.templateId,
          role: input.role,
          content: input.content,
          isStreaming: input.isStreaming,
        },
      });

      return message;
    }),

  /**
   * Update an existing chat message (e.g., for streaming updates)
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string().optional(),
        isStreaming: z.boolean().optional(),
        metadata: z.object({
          subject: z.string().optional(),
          previewText: z.string().optional(),
          codePreview: z.string().optional(), // First ~500 chars for display
        }).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get the message to verify access via template
      const message = await ctx.db.chatMessage.findUnique({
        where: { id: input.id },
        select: { templateId: true },
      });

      if (!message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found",
        });
      }

      // Verify access to template
      await verifyTemplateAccess(
        ctx.db,
        ctx.session.user.id,
        message.templateId
      );

      const updated = await ctx.db.chatMessage.update({
        where: { id: input.id },
        data: {
          ...(input.content !== undefined && { content: input.content }),
          ...(input.isStreaming !== undefined && {
            isStreaming: input.isStreaming,
          }),
          ...(input.metadata !== undefined && { metadata: input.metadata }),
        },
      });

      return updated;
    }),

  /**
   * Delete a chat message
   */
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get the message to verify access via template
      const message = await ctx.db.chatMessage.findUnique({
        where: { id: input.id },
        select: { templateId: true },
      });

      if (!message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found",
        });
      }

      // Verify access to template
      await verifyTemplateAccess(
        ctx.db,
        ctx.session.user.id,
        message.templateId
      );

      await ctx.db.chatMessage.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});


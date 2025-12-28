import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../index";
import { EmailService } from "@mocah/auth/email-service";
import { verifyTemplateAccess } from "../lib/template-helpers";
import { logger } from "@mocah/shared";

export const emailTestRouter = router({
  /**
   * Send a test email with the template HTML
   */
  sendTest: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        to: z.email("Invalid email address"),
        html: z.string().optional(), // Optional HTML - will use cached HTML if not provided
        subject: z.string().optional(), // Optional subject - will use template subject if not provided
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user has access to the template
      await verifyTemplateAccess(
        ctx.db,
        ctx.session.user.id,
        input.templateId
      );

      // Fetch template with selected fields
      const template = await ctx.db.template.findUnique({
        where: { id: input.templateId },
        select: {
          id: true,
          subject: true,
          htmlCode: true,
          reactEmailCode: true,
        },
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        });
      }

      // Determine HTML to send
      let htmlToSend: string;
      
      if (input.html) {
        // Use provided HTML (from client-side render)
        htmlToSend = input.html;
      } else if (template.htmlCode) {
        // Use cached HTML from database
        htmlToSend = template.htmlCode;
      } else {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "No HTML available. Please provide HTML or ensure template has been rendered.",
        });
      }

      // Determine subject
      const subject =
        input.subject || template.subject || "Test Email from Mocah";

      // Send the email
      try {
        const result = await EmailService.sendEmail({
          to: input.to,
          subject,
          html: htmlToSend,
        });

        logger.info("Test email sent successfully", {
          templateId: input.templateId,
          to: input.to,
          emailId: result.data?.id,
        });

        return {
          success: true,
          emailId: result.data?.id,
          message: "Test email sent successfully",
        };
      } catch (error) {
        logger.error("Failed to send test email", {
          templateId: input.templateId,
          to: input.to,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? `Failed to send email: ${error.message}`
              : "Failed to send email",
        });
      }
    }),
});


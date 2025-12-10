/**
 * Template Context Tool
 * 
 * Gets existing template details for regeneration or iteration.
 * Provides current subject, code snippet, and metadata to help understand what to preserve or modify.
 */

import { z } from 'zod';
import prisma from '@mocah/db';
import { logger } from '@mocah/shared/logger';

/**
 * Tool for fetching template context during regeneration
 * 
 * This allows the AI model to understand the current state of a template
 * when the user asks to modify, improve, or regenerate it.
 */
export const getTemplateContextTool = {
  description: 'Get existing template details for regeneration or iteration. Provides current subject, code snippet, preview text, and metadata to help understand what to preserve or modify. Use when user asks to modify an existing template.',

  inputSchema: z.object({
    templateId: z.string().describe('The template ID to fetch context for'),
  }),

  execute: async ({ templateId }: { templateId: string }) => {
    try {
      logger.info('Tool: Fetching template context', {
        component: 'ai-tools',
        action: 'getTemplateContext',
        templateId,
      });

      // Fetch template from database
      const template = await prisma.template.findUnique({
        where: { id: templateId },
        select: {
          id: true,
          name: true,
          description: true,
          subject: true,
          previewText: true,
          reactEmailCode: true,
          category: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          // Metadata for context
          organization: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!template) {
        logger.warn('Tool: Template not found', {
          component: 'ai-tools',
          action: 'getTemplateContext',
          templateId,
        });

        return {
          success: false,
          message: 'Template not found. Treating this as a new template generation request.',
        };
      }

      // Extract a meaningful snippet of the code (first 800 characters)
      // This gives the model context without overwhelming the token budget
      const codeSnippet = template.reactEmailCode 
        ? template.reactEmailCode.slice(0, 800) 
        : null;
      
      const hasMoreCode = template.reactEmailCode 
        ? template.reactEmailCode.length > 800 
        : false;

      logger.info('Tool: Template context retrieved successfully', {
        component: 'ai-tools',
        action: 'getTemplateContext',
        templateId,
        hasCode: !!template.reactEmailCode,
        codeLength: template.reactEmailCode?.length || 0,
      });

      return {
        success: true,
        template: {
          id: template.id,
          name: template.name,
          description: template.description,
          subject: template.subject,
          previewText: template.previewText,
          category: template.category,
          status: template.status,
          organizationName: template.organization.name,
          codeSnippet,
          hasMoreCode,
          lastUpdated: template.updatedAt.toISOString(),
          metadata: {
            // Provide high-level context about the template
            hasSubject: !!template.subject,
            hasPreviewText: !!template.previewText,
            hasCode: !!template.reactEmailCode,
            codeLength: template.reactEmailCode?.length || 0,
          },
        },
      };
    } catch (error) {
      logger.error('Tool: Error fetching template context', {
        component: 'ai-tools',
        action: 'getTemplateContext',
        templateId,
      }, error as Error);

      return {
        success: false,
        message: 'Error fetching template context. Treating as new generation.',
        error: (error as Error).message,
      };
    }
  },
};

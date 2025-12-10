/**
 * Submit Template Tool
 * 
 * This tool is called by the AI when it's ready to submit the final template.
 * The structured data is passed as tool arguments and captured by the frontend.
 * 
 * This is the bridge between streamText (text output) and structured data (JSON).
 */

import { z } from 'zod';
import { logger } from '@mocah/shared/logger';

/**
 * Schema for the final template submission
 * This matches reactEmailGenerationSchema from prompts.ts
 */
export const submitTemplateSchema = z.object({
  subject: z.string().describe('The email subject line'),
  previewText: z.string().describe('The preview text shown in inbox'),
  reactEmailCode: z.string().describe('The complete React Email component code'),
  tone: z
    .string()
    .optional()
    .describe('The tone of the email (e.g., "professional", "friendly")'),
  keyPoints: z
    .array(z.string())
    .optional()
    .describe('Key points or benefits highlighted in the email'),
});

/**
 * Submit Template Tool
 * 
 * The AI calls this tool when it has generated the final template.
 * The execute function just acknowledges - the real data capture happens
 * in the frontend via onToolCall.
 */
export const submitTemplateTool = {
  description: `Submit the final React Email template once you have generated it. 
Call this tool with the complete template including subject, previewText, and reactEmailCode.
This is the final step after gathering context and generating the template.`,
  inputSchema: submitTemplateSchema,
  execute: async (args: z.infer<typeof submitTemplateSchema>) => {
    logger.info('[Submit Template Tool] Template submitted by AI', {
      subject: args.subject,
      codeLength: args.reactEmailCode?.length || 0,
      hasTone: !!args.tone,
      keyPointsCount: args.keyPoints?.length || 0,
    });

    return {
      success: true,
      message: 'Template received successfully. The user will now see your generated template.',
    };
  },
};

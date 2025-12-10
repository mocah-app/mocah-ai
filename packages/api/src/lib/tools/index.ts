/**
 * AI Tools Registry
 * 
 * Central registry for all AI tools available to the model during template generation.
 * Tools allow the model to fetch brand settings, template context, and validate code.
 */

import { getBrandSettingsTool } from './brand-settings';
import { getTemplateContextTool } from './template-context';
import { validateEmailCodeTool } from './validate-email';
import { submitTemplateTool } from './submit-template';

/**
 * Registry of all available tools for AI template generation
 * 
 * Tools can be selectively enabled based on context:
 * - getBrandSettings: Always provide when organizationId is available
 * - getTemplateContext: Only provide when templateId is available (regeneration)
 * - validateEmailCode: Always provide (allows self-correction)
 * - submitTemplate: Always provide for V2 (final structured output)
 */
export const mocahToolRegistry = {
  getBrandSettings: getBrandSettingsTool,
  getTemplateContext: getTemplateContextTool,
  validateEmailCode: validateEmailCodeTool,
  submitTemplate: submitTemplateTool,
} as const;

/**
 * Type-safe tool names
 */
export type MocahToolName = keyof typeof mocahToolRegistry;

/**
 * Helper to get a subset of tools based on context
 * 
 * @param options - Context options to determine which tools to enable
 * @returns Filtered tool set
 */
export function getToolsForContext(options: {
  organizationId?: string;
  templateId?: string;
  enableValidation?: boolean;
  includeSubmit?: boolean;
}) {
  const tools: Record<string, typeof mocahToolRegistry[MocahToolName]> = {};

  // Always include brand settings if organization is known
  if (options.organizationId) {
    tools.getBrandSettings = mocahToolRegistry.getBrandSettings;
  }

  // Include template context only for regenerations
  if (options.templateId) {
    tools.getTemplateContext = mocahToolRegistry.getTemplateContext;
  }

  // Include validation tool (allows model to self-check)
  if (options.enableValidation !== false) {
    tools.validateEmailCode = mocahToolRegistry.validateEmailCode;
  }

  // Include submit tool for V2 (default: true)
  if (options.includeSubmit !== false) {
    tools.submitTemplate = mocahToolRegistry.submitTemplate;
  }

  return tools;
}

// Re-export individual tools for direct access
export { getBrandSettingsTool } from './brand-settings';
export { getTemplateContextTool } from './template-context';
export { validateEmailCodeTool } from './validate-email';
export { submitTemplateTool } from './submit-template';

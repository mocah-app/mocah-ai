/**
 * Email Code Validation Tool
 * 
 * Validates React Email code for syntax and component usage compliance.
 * Returns structured errors with suggestions for any issues found.
 */

import { z } from 'zod';
import { validateReactEmailCode } from '@mocah/shared';
import { logger } from '@mocah/shared/logger';

/**
 * Tool for validating React Email code
 * 
 * This allows the AI model to validate its own generated code
 * and make corrections before returning the final result to the user.
 */
export const validateEmailCodeTool = {
  description: 'Validate React Email code for syntax and component usage compliance. Returns structured errors and warnings with suggestions for fixing issues. Use to self-check generated code before returning to user.',

  inputSchema: z.object({
    code: z.string().describe('The React Email component code to validate'),
  }),

  execute: async ({ code }: { code: string }) => {
    try {
      logger.info('Tool: Validating email code', {
        component: 'ai-tools',
        action: 'validateEmailCode',
        codeLength: code.length,
      });

      // Run validation using shared validation logic
      const validationResult = validateReactEmailCode(code);

      if (validationResult.isValid) {
        logger.info('Tool: Email code validation passed', {
          component: 'ai-tools',
          action: 'validateEmailCode',
          hasWarnings: !!validationResult.warnings?.length,
          warningCount: validationResult.warnings?.length || 0,
        });

        return {
          isValid: true,
          message: 'Code is valid and follows React Email best practices.',
          warnings: validationResult.warnings || [],
        };
      }

      // Validation failed - provide detailed feedback
      logger.warn('Tool: Email code validation failed', {
        component: 'ai-tools',
        action: 'validateEmailCode',
        errorCount: validationResult.errors.length,
        warningCount: validationResult.warnings?.length || 0,
      });

      // Enhance errors with actionable suggestions
      const enhancedErrors = validationResult.errors.map((error) => {
        // Provide specific fix suggestions based on error type
        let suggestion = '';

        if (error.includes('<div>')) {
          suggestion = 'Replace all <div> tags with <Section>, <Row>, or <Column> components.';
        } else if (error.includes('<span>')) {
          suggestion = 'Replace all <span> tags with <Text> component.';
        } else if (error.includes('<p>')) {
          suggestion = 'Replace all <p> tags with <Text> component.';
        } else if (error.includes('heading')) {
          suggestion = 'Replace all <h1>-<h6> tags with <Heading> component.';
        } else if (error.includes('<a>')) {
          suggestion = 'Replace all <a> tags with <Link> component from @react-email/components.';
        } else if (error.includes('as')) {
          suggestion = 'Remove the "as" prop from <Heading> components.';
        } else if (error.includes('display')) {
          suggestion = 'Remove all display properties. Use padding/margin for spacing, and <Row>/<Column> for layout.';
        } else if (error.includes('export default')) {
          suggestion = 'Add "export default function ComponentName() { return (...); }" at the top level.';
        } else if (error.includes('import')) {
          suggestion = 'Add import statement: import { Html, Body, Container, Section, Text, ... } from "@react-email/components";';
        }

        return {
          message: error,
          suggestion,
        };
      });

      return {
        isValid: false,
        errors: enhancedErrors,
        warnings: validationResult.warnings || [],
        summary: `Found ${validationResult.errors.length} error(s) and ${validationResult.warnings?.length || 0} warning(s). Please fix the errors before finalizing.`,
      };
    } catch (error) {
      logger.error('Tool: Error during email code validation', {
        component: 'ai-tools',
        action: 'validateEmailCode',
      }, error as Error);

      return {
        isValid: false,
        errors: [{
          message: 'Validation error occurred',
          suggestion: 'Unable to validate code. Please ensure it is valid React/JSX syntax.',
        }],
        warnings: [],
      };
    }
  },
};

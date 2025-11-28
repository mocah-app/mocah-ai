/**
 * React Email Renderer
 * Utilities for rendering React Email JSX to HTML
 *
 * All rendering happens client-side in the browser sandbox (secure).
 */

import { injectElementIds } from "./jsx-parser";
import { validateReactEmailCode as validateReactEmailCodeShared } from "@mocah/shared";
import { 
  renderReactEmailClientSide, 
  RenderError, 
  RenderErrorCode,
  clearRenderCache,
} from "./client-renderer";
import type { RenderOptions } from "./client-renderer";

/**
 * Render React Email JSX to HTML (Client-Side)
 * Uses browser sandbox
 * 
 * @param reactEmailCode - The React Email JSX code to render
 * @param options - Optional render options (timeout, cache, pretty)
 */
export async function renderReactEmail(
  reactEmailCode: string,
  options?: RenderOptions
): Promise<string> {
  return renderReactEmailClientSide(reactEmailCode, options);
}

/**
 * Render with element IDs injected for selection (used in Visual Editor)
 * 
 * @param reactEmailCode - The React Email JSX code to render
 * @param options - Optional render options
 */
export async function renderReactEmailWithIds(
  reactEmailCode: string,
  options?: RenderOptions
): Promise<string> {
  // Inject data-element-id attributes before rendering
  const codeWithIds = injectElementIds(reactEmailCode);
  return renderReactEmail(codeWithIds, options);
}

/**
 * Convert React Email JSX to plain HTML (for email clients)
 * Same as renderReactEmail but explicitly for email export
 * 
 * @param reactEmailCode - The React Email JSX code to convert
 * @param skipCache - Force fresh render without cache
 */
export async function convertToEmailHTML(
  reactEmailCode: string,
  skipCache = false
): Promise<string> {
  // For export, we might want to skip cache to ensure fresh output
  return renderReactEmail(reactEmailCode, { skipCache, pretty: true });
}

/**
 * Convert React Email to table-based HTML (for maximum email client compatibility)
 * This ensures compatibility with older email clients like Outlook
 * Uses the same rendering as convertToEmailHTML (React Email already handles table conversion)
 * 
 * @param reactEmailCode - The React Email JSX code to convert
 * @param skipCache - Force fresh render without cache
 */
export async function convertToTableHTML(
  reactEmailCode: string,
  skipCache = false
): Promise<string> {
  // React Email's render() already produces table-based HTML for compatibility
  return renderReactEmail(reactEmailCode, { skipCache, pretty: true });
}

/**
 * Force clear the render cache
 * Useful when making code changes that should reflect immediately
 */
export function clearCache(): void {
  clearRenderCache();
}

// Re-export error types for consumers
export { RenderError, RenderErrorCode };

/**
 * Validate React Email JSX code
 * Re-exports the shared validation for convenience
 * Client and server both use @mocah/shared for validation
 */
export function validateReactEmailCode(code: string): {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
} {
  return validateReactEmailCodeShared(code);
}

/**
 * Extract preview text from React Email code
 */
export function extractPreviewText(code: string): string | null {
  try {
    // Look for Preview component (using [\s\S] for cross-version compatibility)
    const previewMatch = code.match(/<Preview[^>]*>([\s\S]*?)<\/Preview>/);
    if (previewMatch && previewMatch[1]) {
      return previewMatch[1].trim();
    }

    return null;
  } catch (error) {
    console.error("Failed to extract preview text:", error);
    return null;
  }
}

/**
 * Get email metadata from React Email code
 */
export function getEmailMetadata(code: string): {
  hasPreview: boolean;
  componentName: string | null;
  imports: string[];
} {
  try {
    const hasPreview = code.includes("<Preview");

    // Extract component name
    const exportMatch = code.match(/export\s+default\s+function\s+(\w+)/);
    const componentName = exportMatch ? exportMatch[1] : null;

    // Extract imports
    const importMatches = code.matchAll(
      /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g
    );
    const imports: string[] = [];
    for (const match of importMatches) {
      imports.push(match[2]);
    }

    return {
      hasPreview,
      componentName,
      imports,
    };
  } catch (error) {
    console.error("Failed to get email metadata:", error);
    return {
      hasPreview: false,
      componentName: null,
      imports: [],
    };
  }
}

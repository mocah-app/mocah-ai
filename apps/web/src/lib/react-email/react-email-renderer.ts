/**
 * React Email Renderer
 * Utilities for rendering React Email JSX to HTML
 *
 * Uses server-side API route for actual rendering since React components
 * can't be safely executed from strings on the client.
 */

import { injectElementIds } from "./jsx-parser";
import { validateReactEmailCode as validateReactEmailCodeShared } from "@mocah/shared";

/**
 * Render React Email JSX to HTML using server-side API
 */
export async function renderReactEmail(
  reactEmailCode: string
): Promise<string> {
  try {
    const response = await fetch("/api/template/render", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reactEmailCode }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || "Failed to render React Email");
    }

    const { html } = await response.json();
    return html;
  } catch (error) {
    console.error("Failed to render React Email:", error);
    throw error;
  }
}

/**
 * Render with element IDs injected for selection (used in Visual Editor)
 */
export async function renderReactEmailWithIds(
  reactEmailCode: string
): Promise<string> {
  try {
    // Inject data-element-id attributes before rendering
    const codeWithIds = injectElementIds(reactEmailCode);
    return renderReactEmail(codeWithIds);
  } catch (error) {
    console.error("Failed to render React Email with IDs:", error);
    throw error;
  }
}

/**
 * Convert React Email JSX to plain HTML (for email clients)
 * Same as renderReactEmail but explicitly for email export
 */
export async function convertToEmailHTML(
  reactEmailCode: string
): Promise<string> {
  try {
    // Use the same rendering endpoint
    // This produces HTML optimized for email clients
    return renderReactEmail(reactEmailCode);
  } catch (error) {
    console.error("Failed to convert to email HTML:", error);
    throw error;
  }
}

/**
 * Convert React Email to table-based HTML (for maximum email client compatibility)
 * This ensures compatibility with older email clients like Outlook
 * Uses the same rendering as convertToEmailHTML (React Email already handles table conversion)
 */
export async function convertToTableHTML(
  reactEmailCode: string
): Promise<string> {
  try {
    // React Email's render() already produces table-based HTML for compatibility
    // So we can use the same endpoint
    return renderReactEmail(reactEmailCode);
  } catch (error) {
    console.error("Failed to convert to table HTML:", error);
    throw error;
  }
}

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

/**
 * React Email code validation
 * Shared validation logic used by both client and server
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Validate React Email component code
 * Used by both client (real-time feedback) and server (before DB save)
 */
export function validateReactEmailCode(code: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic validation
  if (!code || code.trim().length === 0) {
    errors.push("Code is empty");
    return { isValid: false, errors };
  }

  // Check for required imports
  if (!code.includes("@react-email/components")) {
    errors.push("Missing required import from '@react-email/components'");
  }

  // Check for export default
  if (!/export\s+default\s+function/.test(code)) {
    errors.push("Missing 'export default function' - component must be exported");
  }

  // Check for JSX structure
  if (!code.includes("<") || !code.includes(">")) {
    errors.push("Missing JSX elements - this doesn't appear to be a React component");
  }

  // CRITICAL: Check for HTML div tags (should use React Email components)
  if (/<div[\s>]/.test(code)) {
    errors.push(
      "Found HTML <div> tags. You must use React Email components like <Section>, <Row>, or <Column> instead."
    );
  }

  // CRITICAL: Check for HTML span tags
  if (/<span[\s>]/.test(code)) {
    errors.push(
      "Found HTML <span> tags. You must use <Text> component for all text content."
    );
  }

  // CRITICAL: Check for HTML paragraph tags
  if (/<p[\s>]/.test(code)) {
    errors.push(
      "Found HTML <p> tags. You must use <Text> component for paragraph text."
    );
  }

  // CRITICAL: Check for HTML heading tags
  if (/<h[1-6][\s>]/.test(code)) {
    errors.push(
      "Found HTML heading tags (<h1>, <h2>, etc.). You must use <Heading> component."
    );
  }

  // CRITICAL: Check for HTML anchor tags (unless used with Link component)
  if (/<a[\s>]/.test(code) && !code.includes("Link")) {
    errors.push(
      "Found HTML <a> tags. You must use <Link> component for hyperlinks."
    );
  }

  // WARNING: Check for ANY display property (all problematic in emails)
  if (/display:\s*['"]?(?:flex|inline-flex|grid|inline-grid|block|inline-block|inline|table|table-cell|table-row)['"]?/.test(code)) {
    warnings.push(
      "Found 'display' property. The display property has inconsistent support across email clients. Remove it and use email-safe alternatives (padding, margin, line-height for spacing; <Row>/<Column> for layouts)."
    );
  }

  // ERROR: Check for 'as' prop on Heading
  if (/<Heading\s+[^>]*as=/.test(code)) {
    errors.push(
      "Found 'as' prop on <Heading> component (e.g., as=\"h2\"). Remove the 'as' prop - the Heading component handles semantic structure automatically."
    );
  }

  // WARNING: Check for position property (including relative)
  if (/position:\s*['"]?(?:absolute|fixed|sticky|relative)['"]?/.test(code)) {
    warnings.push(
      "Found position property. Positioning (including 'relative') has very limited support in email clients. Remove it."
    );
  }

  // WARNING: Check for fit-content, max-content, min-content
  if (/(?:width|height):\s*['"]?(?:fit-content|max-content|min-content)['"]?/.test(code)) {
    warnings.push(
      "Found fit-content/max-content/min-content. These CSS values are not supported in email clients. Use pixels ('600px') or percentages ('50%') instead."
    );
  }

  // WARNING: Check for transform
  if (/transform:\s*['"]/.test(code)) {
    warnings.push(
      "Found CSS transform. Transforms are not supported in most email clients."
    );
  }

  // WARNING: Check for box-shadow
  if (/boxShadow:\s*['"]/.test(code)) {
    warnings.push(
      "Found boxShadow. Shadows have limited support in email clients - use sparingly."
    );
  }

  // WARNING: Check for overflow property
  if (/overflow:\s*['"]?hidden['"]?/.test(code)) {
    warnings.push(
      "Found overflow: hidden. Overflow properties have limited support in email clients."
    );
  }

  // Check for basic required structure
  if (!code.includes("<Html")) {
    warnings.push("Missing <Html> wrapper - emails should start with <Html> component");
  }

  if (!code.includes("<Body")) {
    warnings.push("Missing <Body> component - emails should have <Body> wrapper");
  }

  if (!code.includes("<Container")) {
    warnings.push(
      "Missing <Container> component - use Container for max-width content wrapper"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}


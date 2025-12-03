import { z } from "zod";

/**
 * Optimized prompt templates for AI React Email generation
 * Token-efficient design with modular architecture
 */

interface BrandKit {
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  logoUrl?: string;
  brandVoice?: string;
}

interface PromptConfig {
  includeExamples?: boolean;
  includeValidation?: boolean;
  verbosity?: "minimal" | "standard" | "detailed";
}

// ============================================================================
// TIER 1: CRITICAL RULES (Validation Failures) - ~300 tokens
// ============================================================================

const CRITICAL_RULES = `CRITICAL RULES (validation fails if violated):

1. NO HTML TAGS → React Email components only
   FORBIDDEN: div, span, p, h1-h6, a, button, img, br, hr, strong, em, b, i
   USE: Html, Head, Body, Container, Section, Row, Column, Heading, Text, Button, Img, Link, Hr

2. NO nested <Text> components
   BAD:  <Text>Hello <Text>World</Text></Text>
   FIX:  <Text>Hello</Text><Text>World</Text>

3. NO 'display' CSS property (use Row/Column for layouts)

4. Export format: export default function ComponentName() { return (...); }
   BAD: export const X = () => ...

5. NO 'as' prop on Heading: <Heading style={...}> only`;

// ============================================================================
// TIER 2: COMPONENT REFERENCE - ~200 tokens
// ============================================================================

const COMPONENT_REFERENCE = `COMPONENTS (import from '@react-email/components'):
Html, Head, Body, Container, Section, Row, Column, Heading, Text, Button, Img, Link, Hr

REQUIRED IMPORTS:
import { Html, Head, Body, Container, Section, Text, Heading, Button, Img, Link, Hr, Row, Column } from '@react-email/components';
import * as React from 'react';`;

// ============================================================================
// TIER 3: STYLE GUIDELINES - ~250 tokens
// ============================================================================

const STYLE_GUIDELINES = `STYLE RULES:
- Use 'as const' for literals: textAlign: 'center' as const
- Width/height: pixels ('600px') or percentages ('50%') only. NO fit-content/max-content
- Container max-width: 600px
- Vertical centering: lineHeight = height (e.g., height: '32px', lineHeight: '32px')

EMAIL-SAFE CSS:
✅ padding, margin, backgroundColor, color, fontSize, fontWeight, textAlign, lineHeight, borderRadius, border, width, height, letterSpacing, verticalAlign
❌ display, position, transform, flex*, grid*, float, box-shadow, overflow, filter`;

// ============================================================================
// TIER 4: EXAMPLES (Condensed) - ~300 tokens when included
// ============================================================================

const CONDENSED_EXAMPLES = `PATTERN EXAMPLES:

// Style objects at top
const headingStyle = { fontSize: '32px', fontWeight: '700', color: '#1a1a1a', textAlign: 'center' as const, margin: '0 0 16px 0' };
const buttonStyle = { backgroundColor: '#007bff', color: '#fff', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none' };

// Basic section
<Section style={{ padding: '40px', textAlign: 'center' as const }}>
  <Heading style={headingStyle}>Welcome!</Heading>
  <Text style={{ fontSize: '16px', color: '#666' }}>Your content here</Text>
  <Button href="https://example.com" style={buttonStyle}>Click Me</Button>
</Section>

// Multi-column
<Row>
  <Column style={{ width: '50%' }}><Text>Left</Text></Column>
  <Column style={{ width: '50%' }}><Text>Right</Text></Column>
</Row>`;

// ============================================================================
// VALIDATION CHECKLIST (Modular) - ~100 tokens
// ============================================================================

const VALIDATION_CHECKLIST = `PRE-OUTPUT CHECKS:
□ No HTML tags (div, span, p, h1-h6, a, button, img)
□ No nested Text: pattern "Text>.*<Text" = 0 matches
□ No display: property
□ No Heading as= prop
□ export default function exists
□ All textAlign/verticalAlign have 'as const'
□ <Text> count = </Text> count`;

// ============================================================================
// DESIGN PHILOSOPHY (Brief) - ~150 tokens
// ============================================================================

const DESIGN_PHILOSOPHY = `DESIGN APPROACH:
- Match design to content purpose (urgent sale = bold, newsletter = clean, invitation = elegant)
- Use white space strategically
- Typography: vary sizes, use color accents on key words
- Brand colors enhance, not dominate - use neutrals as base`;

// ============================================================================
// PROMPT BUILDERS
// ============================================================================

/**
 * Build brand guidelines section
 */
function buildBrandSection(brandKit?: BrandKit): string {
  if (!brandKit) return "";
  const parts = [
    `Primary: ${brandKit.primaryColor || "Not specified"}`,
    `Accent: ${brandKit.accentColor || "Not specified"}`,
    `Font: ${brandKit.fontFamily || "Not specified"}`,
    `Voice: ${brandKit.brandVoice || "Professional"}`,
  ];
  if (brandKit.logoUrl) parts.push(`Logo: ${brandKit.logoUrl}`);
  return `\nBRAND: ${parts.join(" | ")}`;
}

/**
 * Build a prompt for element regeneration
 */
export function buildElementRegenerationPrompt(
  elementType: string,
  currentContent: string,
  userPrompt: string,
  brandKit?: BrandKit
): string {
  const brandContext = brandKit
    ? `\nBrand Voice: ${brandKit.brandVoice || "Professional"}`
    : "";

  return `Regenerate this ${elementType} element:

Current: ${currentContent}
Request: "${userPrompt}"
${brandContext}

Requirements: Address request, maintain quality, stay on-brand, keep element type.
Return only regenerated content.`;
}

/**
 * Build optimized prompt for React Email JSX generation
 * Supports configurable verbosity and modular sections
 */
export function buildReactEmailPrompt(
  userPrompt: string,
  brandKit?: BrandKit,
  config: PromptConfig = {}
): string {
  const {
    includeExamples = true,
    includeValidation = true,
    verbosity = "standard",
  } = config;

  const sections: string[] = [
    `Create a React Email template.

Request: "${userPrompt}"
${buildBrandSection(brandKit)}`,
    CRITICAL_RULES,
    COMPONENT_REFERENCE,
    STYLE_GUIDELINES,
  ];

  if (verbosity !== "minimal") {
    sections.push(DESIGN_PHILOSOPHY);
  }

  if (includeExamples && verbosity !== "minimal") {
    sections.push(CONDENSED_EXAMPLES);
  }

  if (includeValidation) {
    sections.push(VALIDATION_CHECKLIST);
  }

  sections.push(`OUTPUT: Complete React Email component with imports, style objects, and export default function.`);

  return sections.filter(Boolean).join("\n\n");
}

/**
 * Build prompt for React Email template regeneration/modification
 */
export function buildReactEmailRegenerationPrompt(
  userPrompt: string,
  currentTemplateCode: string,
  brandKit?: BrandKit
): string {
  return `Modify existing React Email template.

CURRENT CODE:
\`\`\`tsx
${currentTemplateCode}
\`\`\`

REQUEST: "${userPrompt}"
${buildBrandSection(brandKit)}

MODIFICATION RULES:
- Preserve structure unless explicitly asked to change
- Only modify what user requested
- Keep all existing content not mentioned
- Respect previous customizations

${CRITICAL_RULES}

${VALIDATION_CHECKLIST}

Return complete modified component code.`;
}

// ============================================================================
// EXTENDED PROMPTS (for complex scenarios)
// ============================================================================

/**
 * Build detailed prompt with all examples (for debugging or complex requests)
 */
export function buildDetailedReactEmailPrompt(
  userPrompt: string,
  brandKit?: BrandKit
): string {
  return buildReactEmailPrompt(userPrompt, brandKit, {
    includeExamples: true,
    includeValidation: true,
    verbosity: "detailed",
  });
}

/**
 * Build minimal prompt (for simple modifications)
 */
export function buildMinimalReactEmailPrompt(
  userPrompt: string,
  brandKit?: BrandKit
): string {
  return buildReactEmailPrompt(userPrompt, brandKit, {
    includeExamples: false,
    includeValidation: true,
    verbosity: "minimal",
  });
}

// ============================================================================
// SCHEMA DEFINITIONS
// ============================================================================

/**
 * Zod schema for React Email JSX generation output
 * Optimized for streaming with early fields first
 */
export const reactEmailGenerationSchema = z.object({
  subject: z
    .string()
    .min(1)
    .max(100)
    .describe("Email subject line (1-100 chars). Concise, compelling."),

  previewText: z
    .string()
    .min(30)
    .max(200)
    .describe("Email preview text (30-200 chars). Main value proposition."),

  reactEmailCode: z
    .string()
    .min(500)
    .describe(
      "Complete React Email component. Imports from @react-email/components, style objects, export default function. NO HTML tags, NO nested Text, NO display CSS."
    ),

  styleType: z
    .enum(["inline", "predefined-classes", "style-objects"])
    .default("style-objects")
    .describe("Styling approach. Default: style-objects."),

  styleDefinitionsJson: z
    .string()
    .optional()
    .describe("Optional JSON of extracted style objects."),

  metadata: z
    .object({
      generatedAt: z.string().describe("ISO 8601 timestamp"),
      model: z.string().describe("Model identifier"),
      tokensUsed: z.number().int().min(0).describe("Tokens consumed"),
      emailType: z
        .string()
        .nullish()
        .describe("Category: welcome, newsletter, promotional, transactional, notification"),
    })
    .describe("Generation metadata"),
});

export const TEMPLATE_SCHEMA_NAME = "ReactEmailTemplate";
export const TEMPLATE_SCHEMA_DESCRIPTION =
  "React Email template with subject, preview text, and valid component code using @react-email/components only.";

export type ReactEmailGenerationOutput = z.infer<typeof reactEmailGenerationSchema>;

// ============================================================================
// PROMPT SUGGESTIONS
// ============================================================================

export const promptSuggestions = {
  text: [
    "Make this more urgent",
    "Shorten to 2 sentences",
    "Add a bullet list",
    "Make tone more casual",
    "Make tone more professional",
  ],
  headline: [
    "Make this more compelling",
    "Add urgency",
    "Make it shorter",
    "Include a benefit",
    "Add emotional appeal",
  ],
  cta: [
    "Make this more action-oriented",
    "Add urgency",
    "Make it more specific",
    "Emphasize the benefit",
  ],
  image: [
    "Generate a hero image for this section",
    "Create an illustration",
    "Generate a product photo",
    "Create an abstract background",
  ],
};

// ============================================================================
// UTILITY EXPORTS (for prompt caching strategies)
// ============================================================================

/** Static rules section - cacheable */
export const STATIC_PROMPT_SECTIONS = {
  criticalRules: CRITICAL_RULES,
  componentReference: COMPONENT_REFERENCE,
  styleGuidelines: STYLE_GUIDELINES,
  examples: CONDENSED_EXAMPLES,
  validation: VALIDATION_CHECKLIST,
  designPhilosophy: DESIGN_PHILOSOPHY,
} as const;

/** Get estimated token count for a prompt config */
export function estimateTokenCount(config: PromptConfig = {}): number {
  const baseTokens = 400; // Request + critical rules
  let total = baseTokens;
  
  if (config.verbosity !== "minimal") {
    total += 150; // Design philosophy
    if (config.includeExamples !== false) {
      total += 300; // Examples
    }
  }
  
  if (config.includeValidation !== false) {
    total += 100; // Validation
  }
  
  return total;
}

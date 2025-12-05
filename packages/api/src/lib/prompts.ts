import { z } from "zod";

/**
 * Optimized prompt templates for AI React Email generation
 * Token-efficient design with modular architecture
 */

interface BrandKit {
  // Core brand colors
  primaryColor?: string | null;
  accentColor?: string | null;
  backgroundColor?: string | null;
  textPrimaryColor?: string | null;

  // Typography & Voice
  fontFamily?: string | null;
  brandVoice?: string | null; // "professional", "casual", "playful", "luxury"

  // Brand assets
  logo?: string | null;
  favicon?: string | null;
  ogImage?: string | null;
  customCss?: string | null;

  // Layout
  borderRadius?: string | null;

  // Brand personality
  brandTone?: string | null;
  brandEnergy?: string | null; // "low", "medium", "high"
  targetAudience?: string | null;

  // Company information
  companyName?: string | null;
  companyDescription?: string | null;
  tagline?: string | null;
  industry?: string | null;
  productsServices?: string[] | null;
  brandValues?: string[] | null;
  socialLinks?: Record<string, string> | null;
  contactEmail?: string | null;
  foundingYear?: string | null;

  // Website data
  websiteUrl?: string | null;
  summary?: string | null;
  links?: string[] | null;
}

interface PromptConfig {
  includeExamples?: boolean;
  includeValidation?: boolean;
  verbosity?: "minimal" | "standard" | "detailed";
}

// ============================================================================
// TIER 1: CRITICAL RULES (Validation Failures) - ~300 tokens
// ============================================================================

const CRITICAL_RULES = `⚠️ CRITICAL RULES - STRICTLY ENFORCED (code REJECTED if violated):

1. NO BLOCK-LEVEL HTML TAGS - Use React Email components instead
   ❌ FORBIDDEN: div, span, p, h1-h6, a, button, img, br, hr
   ✅ REQUIRED: Section, Row, Column (for layout), Heading, Text, Button, Img, Link, Hr

   WRONG: <div style={{...}}>content</div>
   RIGHT: <Section style={{...}}>content</Section>

   WRONG: <div><div>nested</div></div>
   RIGHT: <Section><Row><Column>nested</Column></Row></Section>

2. INLINE FORMATTING inside <Text> - use HTML inline tags:
   ✅ ALLOWED inside Text: <b>, <strong>, <em>, <i>, <Link>
   
   ✅ CORRECT patterns:
   <Text style={text}><b>Bold:</b> content here</Text>
   <Text style={text}>Welcome to <strong style={highlight}>Brand</strong>!</Text>
   <Text style={text}>Click <Link href="url">here</Link> to continue</Text>
   <Text style={text}>This is <em>emphasized</em> text</Text>

3. NO nested <Text> components (use inline tags instead)
   ❌ BAD:  <Text>Hello <Text>World</Text></Text>
   ✅ GOOD:  <Text>Hello <strong>World</strong></Text>

4. NO 'display' CSS property (use Row/Column for layouts)

5. Export format: export default function ComponentName() { return (...); }
   ❌ BAD: export const X = () => ...
   ✅ GOOD: export default function ComponentName()

6. NO 'as' prop on Heading: <Heading style={...}> only`;

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
✅ ALLOWED: padding, margin, backgroundColor, color, fontSize, fontWeight, textAlign, lineHeight, borderRadius, border, width, height, letterSpacing, verticalAlign
❌ FORBIDDEN: display, position, transform, flex*, grid*, float, box-shadow, overflow, filter`;

// ============================================================================
// VALIDATION CHECKLIST (Modular) - ~100 tokens
// ============================================================================

const VALIDATION_CHECKLIST = `PRE-OUTPUT CHECKS:
□ No block HTML tags (div, span, p, h1-h6, a, button, img) - use React Email components
□ Inline tags (<b>, <strong>, <em>, <i>) only inside <Text> components
□ No nested Text: pattern "Text>.*<Text" = 0 matches
□ No display: property
□ No Heading as= prop
□ export default function exists
□ All textAlign/verticalAlign have 'as const'
□ <Text> count = </Text> count`;

// ============================================================================
// DESIGN PHILOSOPHY - ~200 tokens
// ============================================================================

const DESIGN_PHILOSOPHY = `DESIGN CREATIVITY:
Think: "What makes THIS email memorable and distinctive in an inbox?"

- AVOID generic templates - every email should feel custom-designed for its specific purpose
- Match design intensity to content purpose (urgent vs calm, promotional vs informational)
- Explore varied layouts - don't default to centered single-column
- Create visual hierarchy through strategic size, spacing, and color contrast
- Use white space intentionally - sometimes less is more impactful
- Apply brand colors purposefully: primary for CTAs/key elements, accent for highlights
- Typography should create rhythm: vary sizes and weights to guide the eye
- Let the content's emotional tone drive design choices
- Reflect brand voice and personality throughout
- Design for the target audience's expectations and preferences

Challenge yourself: Would someone recognize this as distinct from a template library?`;

// ============================================================================
// PROMPT BUILDERS
// ============================================================================

/**
 * Build comprehensive brand context section for AI
 * Includes company info, personality, colors, and design guidelines
 */
function buildBrandSection(brandKit?: BrandKit): string {
  if (!brandKit) return "";

  const sections: string[] = [];

  // Company Identity
  const companyParts: string[] = [];
  if (brandKit.companyName) companyParts.push(`Company: ${brandKit.companyName}`);
  if (brandKit.tagline) companyParts.push(`Tagline: "${brandKit.tagline}"`);
  if (brandKit.industry) companyParts.push(`Industry: ${brandKit.industry}`);
  if (brandKit.foundingYear) companyParts.push(`Founded: ${brandKit.foundingYear}`);
  
  if (companyParts.length > 0) {
    sections.push(`COMPANY: ${companyParts.join(" | ")}`);
  }

  // Company Description
  if (brandKit.companyDescription) {
    sections.push(`ABOUT: ${brandKit.companyDescription}`);
  }

  // Products & Services
  if (brandKit.productsServices && brandKit.productsServices.length > 0) {
    sections.push(`PRODUCTS/SERVICES: ${brandKit.productsServices.join(", ")}`);
  }

  // Brand Values
  if (brandKit.brandValues && brandKit.brandValues.length > 0) {
    sections.push(`BRAND VALUES: ${brandKit.brandValues.join(", ")}`);
  }

  // Target Audience
  if (brandKit.targetAudience) {
    sections.push(`TARGET AUDIENCE: ${brandKit.targetAudience}`);
  }

  // Brand Personality
  const personalityParts: string[] = [];
  if (brandKit.brandVoice) personalityParts.push(`Voice: ${brandKit.brandVoice}`);
  if (brandKit.brandTone) personalityParts.push(`Tone: ${brandKit.brandTone}`);
  if (brandKit.brandEnergy) personalityParts.push(`Energy: ${brandKit.brandEnergy}`);
  
  if (personalityParts.length > 0) {
    sections.push(`BRAND PERSONALITY: ${personalityParts.join(" | ")}`);
  }

  // Visual Identity
  const visualParts: string[] = [];
  if (brandKit.primaryColor) visualParts.push(`Primary: ${brandKit.primaryColor}`);
  if (brandKit.accentColor) visualParts.push(`Accent: ${brandKit.accentColor}`);
  if (brandKit.backgroundColor) visualParts.push(`Background: ${brandKit.backgroundColor}`);
  if (brandKit.textPrimaryColor) visualParts.push(`Text: ${brandKit.textPrimaryColor}`);
  if (brandKit.fontFamily) visualParts.push(`Font: ${brandKit.fontFamily}`);
  if (brandKit.borderRadius) visualParts.push(`Border Radius: ${brandKit.borderRadius}`);
  
  if (visualParts.length > 0) {
    sections.push(`VISUAL IDENTITY: ${visualParts.join(" | ")}`);
  }

  // Logo (include if available for image reference)
  if (brandKit.logo && !brandKit.logo.startsWith('data:')) {
    sections.push(`LOGO URL: ${brandKit.logo}`);
  }

  // Website Summary (if available from scraping)
  if (brandKit.summary) {
    // Truncate if too long
    const summaryTruncated = brandKit.summary.length > 500 
      ? brandKit.summary.substring(0, 500) + "..."
      : brandKit.summary;
    sections.push(`WEBSITE CONTEXT: ${summaryTruncated}`);
  }

  if (sections.length === 0) return "";

  return `\n=== BRAND GUIDELINES ===\n${sections.join("\n")}\n========================\n
IMPORTANT: Apply these brand guidelines throughout the email:
- Use the brand colors (primary for CTAs, accent for highlights)
- Match the brand voice and tone in all copy
- Speak to the target audience appropriately
- Reflect brand values in messaging
- Reference products/services when relevant`;
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
  const brandContext = buildBrandContextForElement(brandKit);

  return `Regenerate this ${elementType} element:

Current: ${currentContent}
Request: "${userPrompt}"
${brandContext}

Requirements: Address request, maintain quality, stay on-brand, keep element type.
Return only regenerated content.`;
}

/**
 * Build a concise brand context for element-level regeneration
 */
function buildBrandContextForElement(brandKit?: BrandKit): string {
  if (!brandKit) return "";

  const parts: string[] = [];
  
  if (brandKit.companyName) parts.push(`Company: ${brandKit.companyName}`);
  if (brandKit.brandVoice) parts.push(`Voice: ${brandKit.brandVoice}`);
  if (brandKit.brandTone) parts.push(`Tone: ${brandKit.brandTone}`);
  if (brandKit.targetAudience) parts.push(`Audience: ${brandKit.targetAudience}`);
  if (brandKit.tagline) parts.push(`Tagline: "${brandKit.tagline}"`);
  
  if (parts.length === 0) return "";
  
  return `\nBrand Context: ${parts.join(" | ")}`;
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
    includeValidation = true,
    verbosity = "standard",
  } = config;

  const sections: string[] = [
    `Create a unique, visually distinctive React Email template.

Request: "${userPrompt}"
${buildBrandSection(brandKit)}`,
    CRITICAL_RULES,
    COMPONENT_REFERENCE,
    STYLE_GUIDELINES,
  ];

  if (verbosity !== "minimal") {
    sections.push(DESIGN_PHILOSOPHY);
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
 * Build detailed prompt with all guidance (for complex requests)
 */
export function buildDetailedReactEmailPrompt(
  userPrompt: string,
  brandKit?: BrandKit
): string {
  return buildReactEmailPrompt(userPrompt, brandKit, {
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
  validation: VALIDATION_CHECKLIST,
  designPhilosophy: DESIGN_PHILOSOPHY,
} as const;

/** Get estimated token count for a prompt config */
export function estimateTokenCount(config: PromptConfig = {}): number {
  const baseTokens = 400; // Request + critical rules
  let total = baseTokens;
  
  if (config.verbosity !== "minimal") {
    total += 200; // Design philosophy
  }
  
  if (config.includeValidation !== false) {
    total += 100; // Validation
  }
  
  return total;
}
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
// SOCIAL ICONS CDN - ~100 tokens
// ============================================================================

const SOCIAL_ICONS_CDN = `SOCIAL ICONS:
For social media icons, use our CDN: https://cdn.mocah.ai/icons/{platform}.png

Available icons: twitter, facebook, instagram, linkedin, youtube, tiktok, pinterest, 
snapchat, reddit, discord, whatsapp, telegram, apple, google, github, dribbble, behance, 
medium, spotify, twitch, slack, x

Examples:
- Twitter/X: https://cdn.mocah.ai/icons/twitter.png or https://cdn.mocah.ai/icons/x.png
- Facebook: https://cdn.mocah.ai/icons/facebook.png
- Instagram: https://cdn.mocah.ai/icons/instagram.png
- LinkedIn: https://cdn.mocah.ai/icons/linkedin.png

Usage: <Img src="https://cdn.mocah.ai/icons/twitter.png" alt="Twitter" width="24" height="24" />

Center all the icons in the footer.

`;

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
// CONTENT GUIDELINES - ~200 tokens
// ============================================================================

const CONTENT_GUIDELINES = `CONTENT PRINCIPLES:

- CONCISE: Every word must earn its place. Default to shorter.

- ONE clear CTA per email (not multiple buttons)

- Headlines: 5-10 words max

- Body paragraphs: 2-3 sentences max

- ONE social proof element max (if needed)

- Remove marketing fluff - get to the point

- White space > word count for visual impact



EMAIL LENGTH TARGETS:

- Transactional: 50-150 words total

- Promotional: 100-200 words total  

- Newsletter: 150-300 words total`;

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
Balance distinction with restraint. Effective emails are concise and focused.

- Visual hierarchy through strategic spacing and color, not content volume
- ONE primary message, ONE primary CTA
- White space is a design element - use it generously
- Quality over quantity in every element
- Remove anything that doesn't directly support the core goal
- Let visuals carry weight instead of explaining everything in text`;

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

  // Logo - critical for brand consistency
  if (brandKit.logo && !brandKit.logo.startsWith('data:')) {
    sections.push(`BRAND LOGO: ${brandKit.logo}
⚠️ ALWAYS use this exact logo URL in the email header. Do NOT use placeholder images or omit the logo.`);
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
- ALWAYS include the brand logo in the email header using the exact URL provided above
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
    SOCIAL_ICONS_CDN,
    CONTENT_GUIDELINES,
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

${SOCIAL_ICONS_CDN}

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
  socialIconsCdn: SOCIAL_ICONS_CDN,
  contentGuidelines: CONTENT_GUIDELINES,
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
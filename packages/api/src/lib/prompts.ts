import { z } from "zod";

/**
 * Prompt templates for AI React Email generation
 */

interface BrandKit {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  logoUrl?: string;
  brandVoice?: string;
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

  return `Regenerate this ${elementType} element based on the following request:

Current Content:
${currentContent}

User Request: "${userPrompt}"
${brandContext}

Generate an improved version that:
1. Addresses the user's request
2. Maintains professional quality
3. Stays consistent with brand voice
4. Keeps the same element type and structure

Return only the regenerated content, nothing else.`;
}

/**
 * Build a prompt for React Email JSX generation
 */
export function buildReactEmailPrompt(
  userPrompt: string,
  brandKit?: BrandKit
): string {
  const brandGuidelines = brandKit
    ? `
Brand Guidelines:
- Primary Color: ${brandKit.primaryColor || "Not specified"}
- Secondary Color: ${brandKit.secondaryColor || "Not specified"}
- Font Family: ${brandKit.fontFamily || "Not specified"}
- Brand Voice: ${brandKit.brandVoice || "Professional"}
${brandKit.logoUrl ? `- Logo URL: ${brandKit.logoUrl}` : ""}
`
    : "";

  return `Create a unique, visually distinctive email template as a React Email component.

User Request: "${userPrompt}"

${brandGuidelines}

Design Philosophy:
- AVOID generic templates - be creative with layout, spacing, and composition
- Design should match the content's purpose and tone (urgent sale = bold/dynamic, newsletter = clean/spacious, invitation = elegant)
- Vary section arrangements: side-by-side columns, asymmetric layouts, alternating image positions
- Use white space strategically - not every email needs to be packed
- Consider unconventional hero sections: split backgrounds, overlapping elements, edge-to-edge images
- Make typography interesting: vary sizes dramatically, use color accents on key words
- Brand colors should enhance, not dominate - use neutrals and let brand colors highlight important elements

CRITICAL RULES - MUST FOLLOW:
1. ONLY use React Email components - NEVER use HTML tags like <div>, <span>, <p>, <h1>, etc.

2. REQUIRED components (import from '@react-email/components'):
   - <Html> - Root wrapper
   - <Head> - For meta tags
   - <Body> - Main body
   - <Container> - Max-width content wrapper
   - <Section> - Content sections (replaces <div>)
   - <Row> & <Column> - Multi-column layouts
   - <Heading> - Headings (replaces <h1>, <h2>, etc.) - DO NOT use 'as' prop
   - <Text> - All text content (replaces <p>, <span>)
   - <Button> - Call-to-action buttons
   - <Img> - Images
   - <Link> - Hyperlinks
   - <Hr> - Horizontal rules

3. Style objects at top for main elements (make them easy to customize):

const heroSectionStyle = {
  padding: '40px',
  textAlign: 'center' as const,
};

const headingStyle = {
  fontSize: '48px',
  fontWeight: '800',
  color: '#1a1a1a',
  textAlign: 'center' as const,
  margin: '0 0 16px 0',
};

// For badge/number styles, DO NOT use display property
const badgeStyle = {
  width: '32px',
  height: '32px',
  backgroundColor: '#007bff',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '700',
  textAlign: 'center' as const,
  lineHeight: '32px',
  borderRadius: '50%',
  margin: '0 0 8px 0',
};

4. Component usage examples:

// Basic section
<Section style={heroSectionStyle}>
  <Heading style={headingStyle}>Welcome!</Heading>
  <Text style={bodyTextStyle}>Your content here</Text>
  <Button href="https://example.com" style={buttonStyle}>Click Me</Button>
</Section>

// Multi-column layout
<Section>
  <Row>
    <Column style={{ width: '50%' }}>
      <Text>Left column</Text>
    </Column>
    <Column style={{ width: '50%' }}>
      <Text>Right column</Text>
    </Column>
  </Row>
</Section>

// Numbers/badges (use Text, not div)
<Section>
  <Text style={badgeStyle}>1</Text>
  <Heading style={featureTitleStyle}>Feature Title</Heading>
  <Text style={descStyle}>Description text</Text>
</Section>

5. <Heading> component rules:
   ❌ NEVER use: <Heading as="h2"> or <Heading as="h3">
   ✅ ALWAYS use: <Heading style={yourStyle}>
   The component handles semantic heading structure automatically.

5.5. <Text> component rules - CRITICAL:
   ❌ NEVER nest <Text> components: <Text>Hello <Text>World</Text></Text>
   ❌ NEVER use multiple <Text> components inline within another <Text>
   ✅ For inline styling within text, use a single <Text> with inline HTML tags (span, strong, em)
   ✅ For separate paragraphs, use separate <Text> components at the same level
   ✅ For colored/highlighted text, use inline <span> with style attribute inside a single <Text>
   
   Example - WRONG (creates nested <p> tags - INVALID HTML):
   <Text>We are thrilled to announce <Text style={{color: '#d0069a'}}>[Product Name]</Text> launch!</Text>
   
   Example - CORRECT (single <Text> with inline span):
   <Text>We are thrilled to announce <span style="color: #d0069a; font-weight: bold">[Product Name]</span> launch!</Text>
   
   Example - CORRECT (separate paragraphs):
   <Text>First paragraph</Text>
   <Text>Second paragraph</Text>
   
   Example - CORRECT (multiple styled spans in one Text):
   <Text>Get <span style="color: #d0069a; font-weight: bold">20% OFF</span> your first purchase!</Text>

6. Email-safe CSS ONLY:
   ✅ ALLOWED: padding, margin, backgroundColor, color, fontSize, fontWeight, textAlign, lineHeight, borderRadius, border, width, height
   ✅ WIDTH/HEIGHT: Use pixels ('600px'), percentages ('50%'), or omit entirely - NEVER use 'fit-content', 'max-content', 'min-content'
   ❌ FORBIDDEN: 
      - display (flex, grid, inline-block, block, inline, table, etc.)
      - position (absolute, fixed, sticky, relative)
      - transform, flexbox properties, grid properties
      - box-shadow (limited support, use sparingly if needed)
      - overflow, clip-path, filter
      - float, clear
      - Modern CSS: fit-content, max-content, min-content, clamp(), calc() with complex expressions

7. For spacing and layout:
   - Vertical spacing: Use margin-top/bottom, padding-top/bottom
   - Horizontal spacing: Use margin-left/right, padding-left/right
   - Centering text: Use textAlign: 'center' as const
   - Centering blocks: Use margin: '0 auto'
   - Multi-column: Use <Row> and <Column> with percentage widths

8. Max-width 600px on Container

9. Use TypeScript 'as const' for string literals:
   ✅ REQUIRED: textAlign: 'center' as const
   This provides type safety and proper literal types for style properties

10. Line-height for vertical centering:
    For fixed-height elements like badges, use lineHeight equal to height:
    { height: '32px', lineHeight: '32px' } // Centers text vertically

OUTPUT FORMAT:
- Valid TypeScript/TSX code with proper types
- Proper imports at the top: import { ... } from '@react-email/components';
- export default function ComponentName() { ... }
- Use 'as const' for string literal types in style objects
- Complete, production-ready component

Think: "What would make THIS specific email stand out in an inbox while staying professional and on-brand?"`;
}

/**
 * Zod schema for React Email JSX generation output
 * Optimized for streaming with early fields first
 */
export const reactEmailGenerationSchema = z.object({
  subject: z.string().describe("Email subject line - generate this first"),
  previewText: z.string().describe("Email preview text (50-100 characters)"),
  
  reactEmailCode: z.string().describe(
    "Complete React Email component code including imports, style objects, and JSX. This is the canonical source."
  ),
  
  styleType: z
    .enum(["inline", "predefined-classes", "style-objects"])
    .describe("Primary styling approach used in the component"),
  
  styleDefinitionsJson: z
    .string()
    .optional()
    .describe(
      "Style object definitions as a JSON string (e.g., '{\"headingStyle\":{\"fontSize\":\"48px\"}}'). Optional - styles are already in reactEmailCode."
    ),
  
  metadata: z.object({
    generatedAt: z.string(),
    model: z.string(),
    tokensUsed: z.number(),
    emailType: z.string().nullish(),
  }),
});

export type ReactEmailGenerationOutput = z.infer<
  typeof reactEmailGenerationSchema
>;

/**
 * Prompt suggestions for different section types
 */
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

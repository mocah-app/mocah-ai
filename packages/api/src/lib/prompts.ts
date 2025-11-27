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

CRITICAL RULES - MUST FOLLOW (VALIDATION WILL FAIL IF NOT FOLLOWED):

1. ABSOLUTELY NO HTML TAGS - ONLY React Email components:
   ❌ FORBIDDEN: <div>, <span>, <p>, <h1-h6>, <a>, <button>, <img>, <br>, <hr>, <strong>, <em>, <b>, <i>
   ✅ REQUIRED: Only use @react-email/components
   
   ANY HTML tag will cause validation failure. Use ONLY React Email components.

2. REQUIRED components (import from '@react-email/components'):
   - <Html> - Root wrapper
   - <Head> - For meta tags
   - <Body> - Main body
   - <Container> - Max-width content wrapper
   - <Section> - Content sections (replaces <div>)
   - <Row> & <Column> - Multi-column layouts
   - <Heading> - Headings (replaces <h1>, <h2>, etc.) - DO NOT use 'as' prop
   - <Text> - All text content (replaces <p>, <span>, <strong>, <em>)
   - <Button> - Call-to-action buttons
   - <Img> - Images
   - <Link> - Hyperlinks (replaces <a>)
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

6. <Text> component rules - CRITICAL (MOST COMMON VALIDATION ERROR):

   THE #1 MISTAKE: Nesting <Text> components inside other <Text> components
   
   ❌ ABSOLUTELY FORBIDDEN - These patterns will FAIL validation:
   
   <Text>Hello <Text style={{color: 'red'}}>World</Text></Text>
   <Text>We offer <Text style={{fontWeight: 'bold'}}>free shipping</Text> today</Text>
   <Text>Get <Text>20%</Text> off!</Text>
   <Text style={paragraph}>Visit <Text style={emphasizeText}>our store</Text> today</Text>
   
   ✅ CORRECT APPROACHES - Choose ONE of these patterns:
   
   Pattern 1: Separate Text components (RECOMMENDED - most reliable):
   <Text style={{marginBottom: '20px'}}>We offer</Text>
   <Text style={{fontWeight: 'bold', color: 'red', marginBottom: '20px'}}>free shipping</Text>
   <Text style={{marginBottom: '20px'}}>today!</Text>
   
   Pattern 2: Single Text with unified styling (when inline emphasis isn't critical):
   <Text style={{fontSize: '16px', marginBottom: '20px'}}>
     We offer free shipping today!
   </Text>
   
   Pattern 3: Use formatting in single string (NO nested tags):
   <Text style={{fontSize: '16px'}}>
     Get your 20% OFF discount today!
   </Text>
   
   Pattern 4: Multiple adjacent Text components for distinct styles:
   <Section>
     <Text style={{fontSize: '18px', color: '#333', marginBottom: '10px'}}>
       Welcome to our special offer!
     </Text>
     <Text style={{fontSize: '24px', color: '#d0069a', fontWeight: 'bold', marginBottom: '10px'}}>
       20% OFF Everything
     </Text>
     <Text style={{fontSize: '16px', color: '#666'}}>
       Use code SAVE20 at checkout
     </Text>
   </Section>

   WHY THIS MATTERS:
   - Email clients don't support nested Text components reliably
   - React Email's Text component is designed to be self-contained
   - Nested Text causes rendering issues in Outlook, Gmail, etc.
   
   VALIDATION CHECK:
   Before completing generation, scan your code for "</Text>" 
   - Count occurrences
   - Ensure each <Text> has exactly ONE closing tag
   - If you find patterns like "Text>.*?<Text", you have nested components - FIX IT

   EXAMPLES OF COMMON MISTAKES AND FIXES:
   
   ❌ WRONG:
   <Text style={paragraph}>
     Once upon a time, <Text style={emphasizeText}>[Your Brand]</Text> was born
   </Text>
   
   ✅ FIXED - Option A (Separate components):
   <Text style={paragraph}>Once upon a time,</Text>
   <Text style={{...paragraph, ...emphasizeText}}>[Your Brand]</Text>
   <Text style={paragraph}>was born</Text>
   
   ✅ FIXED - Option B (Unified styling):
   <Text style={paragraph}>
     Once upon a time, [Your Brand] was born
   </Text>
   
   ---
   
   ❌ WRONG:
   <Text style={paragraph}>
     We believe in <Text style={emphasizeText}>love, laughter, and magic</Text>!
   </Text>
   
   ✅ FIXED:
   <Text style={paragraph}>We believe in</Text>
   <Text style={{...paragraph, ...emphasizeText, margin: '0 0 20px 0'}}>
     love, laughter, and magic
   </Text>
   <Text style={paragraph}>!</Text>
   
   ---
   
   ❌ WRONG:
   <Text>Enjoy a <Text style={{fontWeight: 'bold'}}>15% DISCOUNT</Text> today!</Text>
   
   ✅ FIXED:
   <Text style={{marginBottom: '10px'}}>Enjoy a</Text>
   <Text style={{fontWeight: 'bold', fontSize: '20px', color: '#d0069a', marginBottom: '10px'}}>
     15% DISCOUNT
   </Text>
   <Text>today!</Text>

   SELF-CHECK BEFORE OUTPUTTING:
   1. Search your generated code for "<Text>" - count them
   2. Search for "</Text>" - count them
   3. Counts should be EQUAL
   4. Search for pattern "Text>.*<Text" - should find ZERO matches
   5. If you find nested Text, STOP and rewrite those sections

7. Email-safe CSS ONLY (CRITICAL - display property will trigger warnings):
   ✅ ALLOWED: padding, margin, backgroundColor, color, fontSize, fontWeight, textAlign, lineHeight, borderRadius, border, width, height, letterSpacing, verticalAlign
   ✅ WIDTH/HEIGHT: Use pixels ('600px'), percentages ('50%'), or omit entirely - NEVER use 'fit-content', 'max-content', 'min-content'
   
   ❌ ABSOLUTELY FORBIDDEN (will break in email clients):
      - display: ANY VALUE (flex, grid, inline-block, block, inline, table, table-cell, etc.)
        → Use <Row>/<Column> for layouts instead
        → Use padding/margin for spacing instead
        → Use lineHeight equal to height for vertical centering
      - position: ANY VALUE (absolute, fixed, sticky, relative)
      - transform, flexbox properties (justify-content, align-items, flex-direction, etc.)
      - grid properties (grid-template, grid-column, etc.)
      - box-shadow (limited support, avoid if possible)
      - overflow, clip-path, filter, backdrop-filter
      - float, clear
      - Modern CSS: fit-content, max-content, min-content, clamp(), calc() with complex expressions
   
   NEVER write "display:" in any style object. Use layout components and spacing properties instead.

8. For spacing and layout:
   - Vertical spacing: Use margin-top/bottom, padding-top/bottom
   - Horizontal spacing: Use margin-left/right, padding-left/right
   - Centering text: Use textAlign: 'center' as const
   - Centering blocks: Use margin: '0 auto'
   - Multi-column: Use <Row> and <Column> with percentage widths

9. Max-width 600px on Container

10. Use TypeScript 'as const' for string literals:
    ✅ REQUIRED: textAlign: 'center' as const
    This provides type safety and proper literal types for style properties

11. Line-height for vertical centering:
    For fixed-height elements like badges, use lineHeight equal to height:
    { height: '32px', lineHeight: '32px' } // Centers text vertically

PRE-GENERATION VALIDATION CHECKLIST (Review before generating):

Run through this checklist mentally BEFORE generating code:

1. ❌ NO HTML tags anywhere (div, span, p, h1-h6, a, button, img, etc.)
   ✅ Only React Email components from @react-email/components

2. ❌ NO nested <Text> components - SCAN FOR: Text>.*<Text
   ✅ Each <Text> is independent and self-contained

3. ❌ NO display property in any style object
   ✅ Use Row/Column for layouts, padding/margin for spacing

4. ❌ NO "as" prop on <Heading> components - SCAN FOR: Heading as=
   ✅ <Heading style={...}> only

5. ❌ NO export const ComponentName =
   ✅ export default function ComponentName()

6. ❌ NO width: 'fit-content' or 'max-content'
   ✅ Use pixels ('600px') or percentages ('50%') only

7. ✅ All string literal styles use 'as const': textAlign: 'center' as const

8. ✅ All imports from @react-email/components at top

9. ✅ React imported: import * as React from 'react';

10. ✅ Style objects defined before component function

If ANY ❌ item is found in your generated code, STOP and fix it before outputting.

OUTPUT FORMAT (CRITICAL - VALIDATION WILL FAIL IF NOT FOLLOWED):

1. EXPORT FORMAT - REQUIRED (validation checks this):
   ❌ WRONG: export const ComponentName = () => ( ... );
   ❌ WRONG: export const ComponentName = () => { return ( ... ); };
   ❌ WRONG: const ComponentName = () => ( ... ); export default ComponentName;
   ✅ CORRECT: export default function ComponentName() { return ( ... ); }
   
   You MUST use 'export default function' or validation will fail.

2. Complete structure:
   - Proper imports at the top: import { Html, Head, Body, Container, Section, Text, Heading, Button, Img, Link, Hr, Row, Column } from '@react-email/components';
   - Import React: import * as React from 'react';
   - TypeScript interface for props (if any)
   - Style object definitions (const styleName = { ... };)
   - export default function ComponentName(props) { return ( ... ); }
   - Use 'as const' for string literal types in style objects

3. Example correct format:

import { Html, Head, Body, Container, Section, Text, Heading, Button } from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
  userName?: string;
}

const mainStyle = {
  backgroundColor: '#f6f6f6',
  fontFamily: 'Arial, sans-serif',
};

const containerStyle = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px',
  maxWidth: '600px',
};

export default function WelcomeEmail({ userName = 'there' }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          <Section>
            <Heading>Welcome!</Heading>
            <Text>Hello {userName}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

Think: "What would make THIS specific email stand out in an inbox while staying professional and on-brand?"

FINAL SELF-CHECK (Do this before outputting your generated code):
1. Run a text search for "<div", "<span", "<p>", "<h1", "<h2", "<a " in your code → Should find ZERO
2. Run a text search for "display:" in your code → Should find ZERO
3. Run a text search for "Text>.*<Text" pattern → Should find ZERO
4. Run a text search for "Heading as=" → Should find ZERO
5. Run a text search for "export const" at component level → Should find ZERO
6. Verify "export default function" exists → Should find EXACTLY ONE
7. Count <Text> tags vs </Text> tags → Should be EQUAL
8. Verify all textAlign/verticalAlign have "as const" → Should be 100%

If any check fails, DO NOT output the code. Fix the issues first.`;
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
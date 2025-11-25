import { z } from "zod";

/**
 * Prompt templates for AI email generation
 */

interface BrandKit {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  logoUrl?: string;
  brandVoice?: string;
}

/**
 * Build a prompt for template generation
 */
export function buildTemplateGenerationPrompt(
  userPrompt: string,
  brandKit?: BrandKit,
  emailType?: string
): string {
  const brandGuidelines = brandKit
    ? `
Brand Guidelines:
- Primary Color: ${brandKit.primaryColor || "Not specified"}
- Secondary Color: ${brandKit.secondaryColor || "Not specified"}
- Font: ${brandKit.fontFamily || "Not specified"}
- Brand Voice: ${brandKit.brandVoice || "Professional"}
${brandKit.logoUrl ? `- Logo URL: ${brandKit.logoUrl}` : ""}
`
    : "";

  return `Generate a professional email template for: "${userPrompt}"

${brandGuidelines}

Email Type: ${emailType || "General"}

Requirements:
- Mobile-responsive design
- Include header with logo (if provided)
- Hero section with compelling headline
- 2-3 body sections with relevant content
- Clear CTA button
- Footer with social links and unsubscribe
- Follow email best practices
- Use brand colors and voice consistently

Generate a complete email template with the following structure:
1. Subject line (compelling and relevant)
2. Preview text (50-100 characters)
3. Sections (header, hero, content sections, CTA, footer)

Make it professional, engaging, and aligned with the brand guidelines.`;
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
 * Zod schema for template generation output
 * Optimized for streaming with early fields first
 */
export const templateGenerationSchema = z.object({
  subject: z.string().describe("Email subject line - generate this first"),
  previewText: z.string().describe("Email preview text (50-100 characters) - generate early for quick preview"),
  sections: z.array(
    z.object({
      type: z
        .enum([
          "header",
          "hero",
          "text",
          "cta",
          "product_grid",
          "testimonial",
          "footer",
        ])
        .describe("Section type - generate sections in order from header to footer"),
      content: z.object({
        headline: z.string().optional().describe("Section headline"),
        subheadline: z.string().optional().describe("Section subheadline"),
        body: z.string().optional().describe("Section body text"),
        buttonText: z.string().optional().describe("CTA button text"),
        buttonUrl: z.string().optional().describe("CTA button URL"),
        imageUrl: z.string().optional().describe("Image URL"),
        imageAlt: z.string().optional().describe("Image alt text"),
      }),
      styles: z
        .object({
          backgroundColor: z.string().optional(),
          textColor: z.string().optional(),
          padding: z.string().optional(),
        })
        .optional(),
    })
  ).describe("Generate sections incrementally, one at a time from top to bottom"),
  metadata: z.object({
    emailType: z.string().optional(),
    generatedAt: z.string(),
    model: z.string(),
    tokensUsed: z.number(),
  }),
});

export type TemplateGenerationOutput = z.infer<
  typeof templateGenerationSchema
>;

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

  return `Generate a professional email template as a complete React Email component.

User Request: "${userPrompt}"

${brandGuidelines}

Requirements:
1. Output a complete, valid React Email JSX component
2. Import from '@react-email/components' (Html, Head, Body, Container, Section, Heading, Text, Button, Img, etc.)
3. Use STYLE OBJECTS for reusable styles (define at component top)
4. Use INLINE STYLES for one-off customizations
5. Follow email best practices (max-width 600px, inline CSS)
6. Include proper structure: Html > Head/Body > Container > Sections
7. Make it mobile-responsive and accessible
8. Use semantic HTML and proper accessibility attributes

Style Approach:
- Define style objects at the top for commonly-edited elements (headings, buttons, sections)
- Use inline styles for specific tweaks
- Keep styles simple and email-client compatible
- Example:

const heroSectionStyle = {
  backgroundColor: '#f8f9fa',
  padding: '40px',
  textAlign: 'center',
};

const headingStyle = {
  fontSize: '48px',
  fontWeight: '800',
  color: '#212529',
  textAlign: 'center',
  margin: '0 0 16px 0',
};

<Section style={heroSectionStyle}>
  <Heading style={headingStyle}>Welcome!</Heading>
</Section>

Output format: Complete React Email component code as a string that can be directly executed.`;
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
  
  styleDefinitions: z
    .record(z.string(), z.any())
    .optional()
    .describe(
      "Style object definitions as JSON (e.g., { headingStyle: { fontSize: '48px' } })"
    ),
  
  metadata: z.object({
    emailType: z.string().optional(),
    generatedAt: z.string(),
    model: z.string(),
    tokensUsed: z.number(),
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

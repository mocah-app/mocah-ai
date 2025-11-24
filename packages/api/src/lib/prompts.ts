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

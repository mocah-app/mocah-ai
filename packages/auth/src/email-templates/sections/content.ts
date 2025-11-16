import type { EmailTheme } from "../theme";

export interface ContentProps {
  title: string;
  paragraphs: string[];
  theme?: EmailTheme;
}

/**
 * Email content section with title and paragraphs
 */
export function createEmailContent({ 
  title, 
  paragraphs,
  theme 
}: ContentProps): string {
  const t = theme || require("../theme").defaultTheme;
  
  const paragraphsHtml = paragraphs
    .map(p => `
      <p style="
        font-size: 16px;
        color: ${t.colors.text};
        font-family: ${t.fonts.primary};
        line-height: 1.6;
        margin: 0 0 ${t.spacing.md} 0;
      ">${p}</p>
    `)
    .join("");
  
  return `
    <div style="padding: ${t.spacing.xl} 0;">
      <h2 style="
        color: ${t.colors.text};
        font-family: ${t.fonts.primary};
        font-size: 20px;
        font-weight: 600;
        margin: 0 0 ${t.spacing.lg} 0;
      ">${title}</h2>
      ${paragraphsHtml}
    </div>
  `;
}


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
  theme,
}: ContentProps): string {
  const t = theme || require("../theme").defaultTheme;

  const paragraphsHtml = paragraphs
    .map(
      (p) => `
      <table 
        role="presentation" 
        cellspacing="0" 
        cellpadding="0" 
        border="0" 
        width="100%"
        style="margin-bottom: ${t.spacing.sm};"
      >
        <tr>
          <td style="padding: 0;">
            <p class="content-text" style="
              font-size: 15px;
              color: ${t.colors.text};
              font-family: ${t.fonts.primary};
              line-height: 1.5;
              margin: 0;
            ">${p}</p>
          </td>
        </tr>
      </table>
    `
    )
    .join("");

  return `
    <table 
      role="presentation" 
      cellspacing="0" 
      cellpadding="0" 
      border="0" 
      width="100%"
      style="padding: ${t.spacing.md} 0;"
    >
      <tr>
        <td style="padding: 0;">
          <table 
            role="presentation" 
            cellspacing="0" 
            cellpadding="0" 
            border="0" 
            width="100%"
            style="margin-bottom: ${t.spacing.md};"
          >
            <tr>
              <td style="padding: 0;">
                <h2 class="content-title" style="
                  color: ${t.colors.text};
                  font-family: ${t.fonts.primary};
                  font-size: 18px;
                  font-weight: 600;
                  margin: 0;
                  line-height: 1.3;
                ">${title}</h2>
              </td>
            </tr>
          </table>
          ${paragraphsHtml}
        </td>
      </tr>
    </table>
  `;
}

import type { EmailTheme } from "../theme";

export interface FooterProps {
  appName: string;
  theme?: EmailTheme;
  additionalText?: string;
}

/**
 * Email footer section with app information
 */
export function createEmailFooter({ 
  appName, 
  theme,
  additionalText 
}: FooterProps): string {
  const t = theme || require("../theme").defaultTheme;
  
  return `
    <div style="
      margin-top: ${t.spacing.xl};
      padding-top: ${t.spacing.lg};
      border-top: 1px solid ${t.colors.border};
      text-align: center;
    ">
      ${additionalText ? `
        <p style="
          font-size: 12px;
          color: ${t.colors.textMuted};
          font-family: ${t.fonts.primary};
          margin: 0 0 ${t.spacing.md} 0;
        ">${additionalText}</p>
      ` : ""}
      <p style="
        font-size: 12px;
        color: ${t.colors.textMuted};
        font-family: ${t.fonts.primary};
        margin: 0;
      ">
        © ${new Date().getFullYear()} ${appName}. All rights reserved.
      </p>
    </div>
  `;
}


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
  
  const additionalTextSection = additionalText ? `
    <table 
      role="presentation" 
      cellspacing="0" 
      cellpadding="0" 
      border="0" 
      width="100%"
      style="margin-bottom: ${t.spacing.sm};"
    >
      <tr>
        <td align="center" style="padding: 0;">
          <p style="
            font-size: 11px;
            color: ${t.colors.textMuted};
            font-family: ${t.fonts.primary};
            margin: 0;
            line-height: 1.4;
          ">${additionalText}</p>
        </td>
      </tr>
    </table>
  ` : "";
  
  return `
    <table 
      role="presentation" 
      cellspacing="0" 
      cellpadding="0" 
      border="0" 
      width="100%"
      style="
        margin-top: ${t.spacing.lg};
        padding-top: ${t.spacing.md};
        border-top: 1px solid ${t.colors.border};
      "
    >
      <tr>
        <td align="center" style="padding: 0;">
          ${additionalTextSection}
          <table 
            role="presentation" 
            cellspacing="0" 
            cellpadding="0" 
            border="0" 
            width="100%"
          >
            <tr>
              <td align="center" style="padding: 0;">
                <p style="
                  font-size: 11px;
                  color: ${t.colors.textMuted};
                  font-family: ${t.fonts.primary};
                  margin: 0;
                  line-height: 1.4;
                ">
                  © ${new Date().getFullYear()} ${appName}. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}


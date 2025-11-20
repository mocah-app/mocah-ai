import type { EmailTheme } from "../theme";

export interface HeaderProps {
  appName: string;
  theme?: EmailTheme;
  logoUrl?: string;
}

/**
 * Email header section with app branding and logo
 */
export function createEmailHeader({ appName, theme, logoUrl }: HeaderProps): string {
  const t = theme || require("../theme").defaultTheme;
  
  const logoSection = logoUrl ? `
    <table 
      role="presentation" 
      cellspacing="0" 
      cellpadding="0" 
      border="0" 
      width="100%"
      style="margin-bottom: ${t.spacing.md};"
    >
      <tr>
        <td align="center" style="padding: 0;">
          <img 
            src="${logoUrl}" 
            alt="${appName} Logo" 
            class="logo-img"
            style="
              max-width: 200px;
              width: auto;
              height: auto;
              display: block;
              border: 0;
            "
          />
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
      class="email-header"
      style="
        border-bottom: 1px solid ${t.colors.border};
        padding-bottom: ${t.spacing.xl};
        margin-bottom: ${t.spacing.xl};
      "
    >
      <tr>
        <td align="center" style="padding: 0;">
          ${logoSection}
          <table 
            role="presentation" 
            cellspacing="0" 
            cellpadding="0" 
            border="0"
            style="width: 100%;"
          >
            <tr>
              <td align="center" style="padding: 0;">
                <h1 style="
                  color: ${t.colors.primary};
                  font-family: ${t.fonts.primary};
                  font-size: 24px;
                  font-weight: 600;
                  margin: 0;
                  padding: 0;
                  line-height: 1.2;
                ">${appName}</h1>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}


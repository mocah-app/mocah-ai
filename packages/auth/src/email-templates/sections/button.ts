import type { EmailTheme } from "../theme";

export interface ButtonProps {
  text: string;
  url: string;
  theme?: EmailTheme;
  variant?: "primary" | "secondary";
}

/**
 * Reusable email button component with responsive table layout
 */
export function createEmailButton({ 
  text, 
  url, 
  theme,
  variant = "primary"
}: ButtonProps): string {
  const t = theme || require("../theme").defaultTheme;
  
  const backgroundColor = variant === "primary" ? t.colors.primary : t.colors.surface;
  const textColor = variant === "primary" ? "#ffffff" : t.colors.text;
  const border = variant === "primary" ? "none" : `1px solid ${t.colors.border}`;
  
  return `
    <table 
      role="presentation" 
      cellspacing="0" 
      cellpadding="0" 
      border="0" 
      width="100%"
      class="button-table"
      style="margin: ${t.spacing.lg} 0;"
    >
      <tr>
        <td align="center" class="button-cell" style="padding: ${t.spacing.md} 0;">
          <table 
            role="presentation" 
            cellspacing="0" 
            cellpadding="0" 
            border="0"
            style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt;"
          >
            <tr>
              <td 
                align="center" 
                style="
                  background-color: ${backgroundColor};
                  border-radius: ${t.borderRadius};
                  border: ${border};
                "
              >
                <a 
                  href="${url}" 
                  class="button-link"
                  style="
                    display: inline-block;
                    background-color: ${backgroundColor};
                    color: ${textColor};
                    padding: ${t.spacing.sm} ${t.spacing.xl};
                    text-decoration: none;
                    border-radius: ${t.borderRadius};
                    font-weight: 600;
                    font-family: ${t.fonts.primary};
                    font-size: 16px;
                    border: ${border};
                    text-align: center;
                    width: 100%;
                    box-sizing: border-box;
                  "
                >
                  ${text}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}


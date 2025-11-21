import type { EmailTheme } from "../theme";

export interface LinkFallbackProps {
  url: string;
  theme?: EmailTheme;
  label?: string;
}

/**
 * Link fallback section for when buttons don't work
 */
export function createLinkFallback({
  url,
  theme,
  label = "If the button doesn't work, copy and paste this link into your browser:",
}: LinkFallbackProps): string {
  const t = theme || require("../theme").defaultTheme;

  return `
    <table 
      role="presentation" 
      cellspacing="0" 
      cellpadding="0" 
      border="0" 
      width="100%"
      style="margin-top: ${t.spacing.md};"
    >
      <tr>
        <td style="padding: 0;">
          <table 
            role="presentation" 
            cellspacing="0" 
            cellpadding="0" 
            border="0" 
            width="100%"
            style="margin-bottom: ${t.spacing.xs};"
          >
            <tr>
              <td style="padding: 0;">
                <p style="
                  font-size: 13px;
                  color: ${t.colors.textSecondary};
                  font-family: ${t.fonts.primary};
                  margin: 0;
                  line-height: 1.4;
                ">${label}</p>
              </td>
            </tr>
          </table>
          <table 
            role="presentation" 
            cellspacing="0" 
            cellpadding="0" 
            border="0" 
            width="100%"
          >
            <tr>
              <td style="
                padding: ${t.spacing.xs} ${t.spacing.sm};
                border: 1px solid ${t.colors.border};
                border-radius: ${t.borderRadius};
              ">
                <p style="
                  font-size: 11px;
                  color: ${t.colors.textMuted};
                  font-family: ${t.fonts.primary};
                  word-break: break-all;
                  margin: 0;
                  line-height: 1.4;
                ">${url}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

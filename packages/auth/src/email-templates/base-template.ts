import type { EmailTheme } from "./theme";
import { defaultTheme } from "./theme";
import { createEmailHeader } from "./sections/header";
import { createEmailFooter } from "./sections/footer";

export interface BaseTemplateProps {
  appName: string;
  title: string;
  content: string;
  theme?: EmailTheme;
  footerText?: string;
}

/**
 * Base email template with consistent structure and styling
 */
export function createBaseEmailTemplate({
  appName,
  title,
  content,
  theme = defaultTheme,
  footerText,
}: BaseTemplateProps): string {
  const header = createEmailHeader({ appName, theme });
  const footer = createEmailFooter({ appName, theme, additionalText: footerText });
  
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>${title}</title>
      </head>
      <body style="
        font-family: ${theme.fonts.primary};
        line-height: 1.6;
        color: ${theme.colors.text};
        background-color: ${theme.colors.background};
        margin: 0;
        padding: 0;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      ">
        <table 
          role="presentation" 
          cellspacing="0" 
          cellpadding="0" 
          border="0" 
          width="100%"
          style="background-color: ${theme.colors.background};"
        >
          <tr>
            <td align="center" style="padding: ${theme.spacing.xl} ${theme.spacing.md};">
              <table 
                role="presentation" 
                cellspacing="0" 
                cellpadding="0" 
                border="0" 
                width="${theme.maxWidth}"
                style="
                  max-width: ${theme.maxWidth};
                  background-color: ${theme.colors.background};
                  border-radius: ${theme.borderRadius};
                "
              >
                <tr>
                  <td style="
                    background-color: ${theme.colors.surface};
                    padding: ${theme.spacing.xl};
                    border-radius: ${theme.borderRadius};
                  ">
                    ${header}
                    ${content}
                    ${footer}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}


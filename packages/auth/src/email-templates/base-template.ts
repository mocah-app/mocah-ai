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
  logoUrl?: string;
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
  logoUrl,
}: BaseTemplateProps): string {
  const header = createEmailHeader({ appName, theme, logoUrl });
  const footer = createEmailFooter({ appName, theme, additionalText: footerText });
  
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="x-apple-disable-message-reformatting">
        <title>${title}</title>
        <style type="text/css">
          /* Reset styles */
          body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
          }
          table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
          }
          img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
          }
          
          /* Media queries for responsive design */
          @media only screen and (max-width: 600px) {
            .email-container {
              width: 100% !important;
              max-width: 100% !important;
            }
            .email-content {
              padding: ${theme.spacing.md} !important;
            }
            .email-header {
              padding: ${theme.spacing.md} 0 !important;
            }
            .logo-img {
              max-width: 150px !important;
              height: auto !important;
            }
            .button-table {
              width: 100% !important;
            }
            .button-cell {
              padding: ${theme.spacing.sm} !important;
            }
            .button-link {
              font-size: 14px !important;
              padding: ${theme.spacing.sm} ${theme.spacing.md} !important;
            }
            .content-title {
              font-size: 18px !important;
            }
            .content-text {
              font-size: 14px !important;
            }
          }
          
          /* Dark mode support */
          @media (prefers-color-scheme: dark) {
            .email-body {
              background-color: #1a1a1a !important;
            }
            .email-surface {
              background-color: #2a2a2a !important;
            }
          }
        </style>
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
        width: 100% !important;
        min-width: 100%;
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      " class="email-body">
        <!-- Wrapper table -->
        <table 
          role="presentation" 
          cellspacing="0" 
          cellpadding="0" 
          border="0" 
          width="100%"
          style="
            background-color: ${theme.colors.background};
            margin: 0;
            padding: 0;
            width: 100%;
            table-layout: fixed;
          "
        >
          <tr>
            <td align="center" style="padding: ${theme.spacing.xl} ${theme.spacing.md};">
              <!-- Main content table -->
              <table 
                role="presentation" 
                cellspacing="0" 
                cellpadding="0" 
                border="0" 
                width="${theme.maxWidth}"
                class="email-container"
                style="
                  max-width: ${theme.maxWidth};
                  width: 100%;
                  background-color: ${theme.colors.background};
                  border-radius: ${theme.borderRadius};
                "
              >
                <tr>
                  <td 
                    class="email-content email-surface"
                    style="
                      background-color: ${theme.colors.surface};
                      padding: ${theme.spacing.xl};
                      border-radius: ${theme.borderRadius};
                    "
                  >
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


import { createBaseEmailTemplate } from "./base-template";
import { createEmailContent } from "./sections/content";
import { createEmailButton } from "./sections/button";
import { createLinkFallback } from "./sections/link-fallback";
import type { EmailTheme } from "./theme";
import { defaultTheme } from "./theme";

export interface VerificationEmailProps {
  appName: string;
  user: { email: string; name?: string };
  verificationUrl: string;
  theme?: EmailTheme;
  expiresInHours?: number;
  logoUrl?: string;
}

/**
 * Email verification template
 */
export function createVerificationEmail({
  appName,
  user,
  verificationUrl,
  theme = defaultTheme,
  expiresInHours = 24,
  logoUrl,
}: VerificationEmailProps): string {
  const greeting = user.name ? `Hi ${user.name},` : "Hi there,";
  
  const expiryText = `
    <table 
      role="presentation" 
      cellspacing="0" 
      cellpadding="0" 
      border="0" 
      width="100%"
      style="margin-top: ${theme.spacing.xl};"
    >
      <tr>
        <td align="center" style="padding: 0;">
          <p style="
            font-size: 12px;
            color: ${theme.colors.textMuted};
            font-family: ${theme.fonts.primary};
            margin: 0;
            line-height: 1.5;
          ">
            This link will expire in ${expiresInHours} ${expiresInHours === 1 ? "hour" : "hours"}.
          </p>
        </td>
      </tr>
    </table>
  `;
  
  const content = `
    ${createEmailContent({
      title: "Verify your email address",
      paragraphs: [
        `${greeting}`,
        `Thanks for signing up for ${appName}! Please verify your email address by clicking the button below.`,
      ],
      theme,
    })}
    ${createEmailButton({
      text: "Verify Email Address",
      url: verificationUrl,
      theme,
    })}
    ${createLinkFallback({
      url: verificationUrl,
      theme,
    })}
    ${expiryText}
  `;

  return createBaseEmailTemplate({
    appName,
    title: `Verify your ${appName} account`,
    content,
    theme,
    footerText: `If you didn't create an account with ${appName}, you can safely ignore this email.`,
    logoUrl,
  });
}


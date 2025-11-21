import { createBaseEmailTemplate } from "./base-template";
import { createEmailContent } from "./sections/content";
import { createEmailButton } from "./sections/button";
import { createLinkFallback } from "./sections/link-fallback";
import type { EmailTheme } from "./theme";
import { defaultTheme } from "./theme";

export interface PasswordResetEmailProps {
  appName: string;
  user: { email: string; name?: string };
  resetUrl: string;
  theme?: EmailTheme;
  expiresInHours?: number;
  logoUrl?: string;
}

/**
 * Password reset email template
 */
export function createPasswordResetEmail({
  appName,
  user,
  resetUrl,
  theme = defaultTheme,
  expiresInHours = 1,
  logoUrl,
}: PasswordResetEmailProps): string {
  const greeting = user.name ? `Hi ${user.name},` : "Hi there,";

  const expiryText = `
    <table 
      role="presentation" 
      cellspacing="0" 
      cellpadding="0" 
      border="0" 
      width="100%"
      style="margin-top: ${theme.spacing.md};"
    >
      <tr>
        <td align="center" style="padding: 0;">
          <p style="
            font-size: 11px;
            color: ${theme.colors.textMuted};
            font-family: ${theme.fonts.primary};
            margin: 0;
            line-height: 1.4;
          ">
            This link will expire in ${expiresInHours} ${
    expiresInHours === 1 ? "hour" : "hours"
  }.
          </p>
        </td>
      </tr>
    </table>
  `;

  const content = `
    ${createEmailContent({
      title: "Reset your password",
      paragraphs: [
        `${greeting}`,
        `We received a request to reset your password for your ${appName} account. Click the button below to create a new password.`,
      ],
      theme,
    })}
    ${createEmailButton({
      text: "Reset Password",
      url: resetUrl,
      theme,
    })}
    ${createLinkFallback({
      url: resetUrl,
      theme,
    })}
    ${expiryText}
  `;

  return createBaseEmailTemplate({
    appName,
    title: `Reset your ${appName} password`,
    content,
    theme,
    footerText:
      "For security reasons, if you didn't request this password reset, please contact support immediately.",
    logoUrl,
  });
}

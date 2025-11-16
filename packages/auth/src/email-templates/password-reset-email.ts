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
}: PasswordResetEmailProps): string {
  const greeting = user.name ? `Hi ${user.name},` : "Hi there,";
  
  const content = `
    ${createEmailContent({
      title: "Reset your password",
      paragraphs: [
        `${greeting}`,
        `We received a request to reset your password for your ${appName} account. Click the button below to create a new password.`,
      ],
      theme,
    })}
    <div style="text-align: center;">
      ${createEmailButton({
        text: "Reset Password",
        url: resetUrl,
        theme,
      })}
    </div>
    ${createLinkFallback({
      url: resetUrl,
      theme,
    })}
    <p style="
      font-size: 12px;
      color: ${theme.colors.textMuted};
      font-family: ${theme.fonts.primary};
      text-align: center;
      margin-top: ${theme.spacing.xl};
    ">
      This link will expire in ${expiresInHours} ${expiresInHours === 1 ? "hour" : "hours"}.
    </p>
  `;

  return createBaseEmailTemplate({
    appName,
    title: `Reset your ${appName} password`,
    content,
    theme,
    footerText: "For security reasons, if you didn't request this password reset, please contact support immediately.",
  });
}


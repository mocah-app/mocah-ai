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
}: VerificationEmailProps): string {
  const greeting = user.name ? `Hi ${user.name},` : "Hi there,";
  
  const content = `
    ${createEmailContent({
      title: "Verify your email address",
      paragraphs: [
        `${greeting}`,
        `Thanks for signing up for ${appName}! Please verify your email address by clicking the button below.`,
      ],
      theme,
    })}
    <div style="text-align: center;">
      ${createEmailButton({
        text: "Verify Email Address",
        url: verificationUrl,
        theme,
      })}
    </div>
    ${createLinkFallback({
      url: verificationUrl,
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
    title: `Verify your ${appName} account`,
    content,
    theme,
    footerText: `If you didn't create an account with ${appName}, you can safely ignore this email.`,
  });
}


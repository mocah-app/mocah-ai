/**
 * Email templates module
 * 
 * Provides reusable email templates with consistent theming and structure
 */

export { createVerificationEmail } from "./verification-email";
export { createPasswordResetEmail } from "./password-reset-email";
export { createBaseEmailTemplate } from "./base-template";
export { defaultTheme, type EmailTheme } from "./theme";
export { createEmailHeader } from "./sections/header";
export { createEmailFooter } from "./sections/footer";
export { createEmailButton } from "./sections/button";
export { createEmailContent } from "./sections/content";
export { createLinkFallback } from "./sections/link-fallback";


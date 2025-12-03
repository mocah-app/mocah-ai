/**
 * Shared Constants
 * 
 * Constants used across the application.
 */

/**
 * Email-safe fonts that work across all major email clients.
 * These fonts are universally supported and provide consistent rendering.
 */
export const EMAIL_SAFE_FONTS = [
  "Arial, sans-serif",
  "Times New Roman, serif",
  "Verdana, sans-serif",
  "Georgia, serif",
  "Tahoma, sans-serif",
  "Helvetica, sans-serif",
  "Courier New, monospace",
  "Lucida Sans, Lucida Grande, sans-serif",
  "Trebuchet MS, sans-serif",
  "Palatino, Book Antiqua, serif",
] as const;

export type EmailSafeFont = (typeof EMAIL_SAFE_FONTS)[number];

/**
 * Brand voice options for email templates
 */
export const BRAND_VOICES = [
  "professional",
  "casual", 
  "playful",
  "luxury",
] as const;

export type BrandVoice = (typeof BRAND_VOICES)[number];


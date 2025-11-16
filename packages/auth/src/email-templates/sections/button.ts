import type { EmailTheme } from "../theme";

export interface ButtonProps {
  text: string;
  url: string;
  theme?: EmailTheme;
  variant?: "primary" | "secondary";
}

/**
 * Reusable email button component
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
    <a 
      href="${url}" 
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
        margin: ${t.spacing.lg} 0;
      "
    >
      ${text}
    </a>
  `;
}


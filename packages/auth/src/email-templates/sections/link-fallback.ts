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
  label = "If the button doesn't work, copy and paste this link into your browser:"
}: LinkFallbackProps): string {
  const t = theme || require("../theme").defaultTheme;
  
  return `
    <div style="margin-top: ${t.spacing.xl};">
      <p style="
        font-size: 14px;
        color: ${t.colors.textSecondary};
        font-family: ${t.fonts.primary};
        margin: 0 0 ${t.spacing.sm} 0;
      ">${label}</p>
      <p style="
        font-size: 12px;
        color: ${t.colors.textMuted};
        font-family: ${t.fonts.primary};
        word-break: break-all;
        margin: 0;
        padding: ${t.spacing.sm};
        background-color: ${t.colors.surface};
        border-radius: ${t.borderRadius};
      ">${url}</p>
    </div>
  `;
}


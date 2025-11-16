import type { EmailTheme } from "../theme";

export interface HeaderProps {
  appName: string;
  theme?: EmailTheme;
}

/**
 * Email header section with app branding
 */
export function createEmailHeader({ appName, theme }: HeaderProps): string {
  const t = theme || require("../theme").defaultTheme;
  
  return `
    <div style="text-align: center; padding: ${t.spacing.xl} 0; border-bottom: 1px solid ${t.colors.border};">
      <h1 style="
        color: ${t.colors.primary};
        font-family: ${t.fonts.primary};
        font-size: 24px;
        font-weight: 600;
        margin: 0;
        padding: 0;
      ">${appName}</h1>
    </div>
  `;
}


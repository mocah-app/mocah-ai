/**
 * Email theme configuration for consistent styling across all email templates
 */
export interface EmailTheme {
  colors: {
    primary: string;
    primaryHover: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
  };
  fonts: {
    primary: string;
    fallback: string[];
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: string;
  maxWidth: string;
}

export const defaultTheme: EmailTheme = {
  colors: {
    primary: "#010309",
    primaryHover: "#010309",
    background: "#ffffff",
    surface: "#ffffff",
    text: "#333333",
    textSecondary: "#666666",
    textMuted: "#999999",
    border: "#e5e7eb",
  },
  fonts: {
    primary: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fallback: ["Arial", "sans-serif"],
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
  },
  borderRadius: "4px",
  maxWidth: "600px",
};


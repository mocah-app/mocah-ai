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
    primary: "#2563eb",
    primaryHover: "#1d4ed8",
    background: "#ffffff",
    surface: "#f8f9fa",
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
    xs: "8px",
    sm: "12px",
    md: "16px",
    lg: "20px",
    xl: "30px",
  },
  borderRadius: "8px",
  maxWidth: "600px",
};


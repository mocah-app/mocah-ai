import { colord, extend } from "colord";
import a11yPlugin from "colord/plugins/a11y";

// Extend colord with accessibility plugin for contrast calculations
extend([a11yPlugin]);

/**
 * Determines if a color is light or dark
 * @param color - Color string (hex, rgb, hsl, etc.)
 * @returns true if color is light, false if dark
 */
export function isLightColor(color: string): boolean {
  return colord(color).isLight();
}

/**
 * Determines if a color is dark
 * @param color - Color string (hex, rgb, hsl, etc.)
 * @returns true if color is dark, false if light
 */
export function isDarkColor(color: string): boolean {
  return colord(color).isDark();
}

/**
 * Gets the appropriate text color (black or white) for a given background color
 * Ensures WCAG contrast compliance
 * @param backgroundColor - Background color string
 * @returns "#000000" for light backgrounds, "#FFFFFF" for dark backgrounds
 */
export function getContrastTextColor(backgroundColor: string): string {
  const color = colord(backgroundColor);
  
  // Check if background is light or dark
  if (color.isLight()) {
    return "#000000"; // Use black text on light backgrounds
  } else {
    return "#FFFFFF"; // Use white text on dark backgrounds
  }
}

/**
 * Gets the appropriate text color with custom light/dark options
 * @param backgroundColor - Background color string
 * @param lightTextColor - Color to use for light backgrounds (default: "#000000")
 * @param darkTextColor - Color to use for dark backgrounds (default: "#FFFFFF")
 * @returns Appropriate text color based on background
 */
export function getContrastTextColorCustom(
  backgroundColor: string,
  lightTextColor: string = "#000000",
  darkTextColor: string = "#FFFFFF"
): string {
  const color = colord(backgroundColor);
  return color.isLight() ? lightTextColor : darkTextColor;
}

/**
 * Calculates the contrast ratio between two colors
 * @param color1 - First color string
 * @param color2 - Second color string
 * @returns Contrast ratio (1-21, where 4.5+ is WCAG AA, 7+ is WCAG AAA)
 */
export function getContrastRatio(color1: string, color2: string): number {
  return colord(color1).contrast(color2);
}

/**
 * Checks if two colors meet WCAG AA contrast requirements (4.5:1 for normal text)
 * @param foreground - Foreground/text color
 * @param background - Background color
 * @returns true if contrast meets WCAG AA standards
 */
export function meetsWCAGAA(foreground: string, background: string): boolean {
  return colord(foreground).isReadable(background, { level: "AA" });
}

/**
 * Checks if two colors meet WCAG AAA contrast requirements (7:1 for normal text)
 * @param foreground - Foreground/text color
 * @param background - Background color
 * @returns true if contrast meets WCAG AAA standards
 */
export function meetsWCAGAAA(foreground: string, background: string): boolean {
  return colord(foreground).isReadable(background, { level: "AAA" });
}


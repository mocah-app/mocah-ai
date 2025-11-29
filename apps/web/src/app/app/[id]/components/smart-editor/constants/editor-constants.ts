/**
 * Editor Design Tokens
 * Centralized constants for consistent design scales
 */

// Font Family Options
export const FONT_FAMILIES = [
  { value: 'inherit', label: 'Default', stack: 'inherit' },
  { value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', label: 'Sans Serif', stack: 'system-ui' },
  { value: 'Georgia, "Times New Roman", Times, serif', label: 'Serif', stack: 'serif' },
  { value: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace', label: 'Monospace', stack: 'mono' },
] as const;

// Font Size Scale (Tailwind-inspired)
export const FONT_SIZES = [
  { value: '12px', label: 'XS' },
  { value: '14px', label: 'SM' },
  { value: '16px', label: 'Base' },
  { value: '18px', label: 'LG' },
  { value: '20px', label: 'XL' },
  { value: '24px', label: '2XL' },
  { value: '30px', label: '3XL' },
  { value: '36px', label: '4XL' },
  { value: '48px', label: '5XL' },
] as const;

// Font Weight Options
export const FONT_WEIGHTS = [
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semibold' },
  { value: '700', label: 'Bold' },
] as const;

// Line Height Scale
export const LINE_HEIGHTS = [
  { value: '1', label: 'None' },
  { value: '1.25', label: 'Tight' },
  { value: '1.5', label: 'Normal' },
  { value: '1.75', label: 'Relaxed' },
  { value: '2', label: 'Loose' },
] as const;

// Letter Spacing Scale
export const LETTER_SPACINGS = [
  { value: '-0.05em', label: 'Tighter' },
  { value: '-0.025em', label: 'Tight' },
  { value: '0em', label: 'Normal' },
  { value: '0.025em', label: 'Wide' },
  { value: '0.05em', label: 'Wider' },
  { value: '0.1em', label: 'Widest' },
] as const;

// Spacing Scale (Tailwind-inspired) - for padding, margin
export const SPACING_SCALE = [
  { value: '0px', label: '0' },
  { value: '4px', label: '1' },
  { value: '8px', label: '2' },
  { value: '12px', label: '3' },
  { value: '16px', label: '4' },
  { value: '20px', label: '5' },
  { value: '24px', label: '6' },
  { value: '32px', label: '8' },
  { value: '40px', label: '10' },
  { value: '48px', label: '12' },
  { value: '64px', label: '16' },
] as const;

// Text Alignment Options
export const TEXT_ALIGNMENTS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
  { value: 'justify', label: 'Justify' },
] as const;

// Text Decoration Options  
export const TEXT_DECORATIONS = [
  { value: 'none', label: 'None' },
  { value: 'underline', label: 'Underline' },
  { value: 'line-through', label: 'Strikethrough' },
  { value: 'overline', label: 'Overline' },
] as const;

// Font Style Options
export const FONT_STYLES = [
  { value: 'normal', label: 'Normal' },
  { value: 'italic', label: 'Italic' },
] as const;

// Border Radius Scale
export const BORDER_RADIUS = [
  { value: '0px', label: 'None' },
  { value: '4px', label: 'SM' },
  { value: '8px', label: 'MD' },
  { value: '12px', label: 'LG' },
  { value: '16px', label: 'XL' },
  { value: '24px', label: '2XL' },
  { value: '9999px', label: 'Full' },
] as const;

// Width presets
export const WIDTH_PRESETS = [
  { value: 'auto', label: 'Auto' },
  { value: '100%', label: 'Full' },
  { value: '50%', label: 'Half' },
  { value: '33.333%', label: '1/3' },
  { value: '66.666%', label: '2/3' },
  { value: '25%', label: '1/4' },
  { value: '75%', label: '3/4' },
] as const;

// Common colors for quick selection
export const COLOR_PRESETS = [
  '#ffffff',
  '#000000',
  '#6b7280', // gray-500
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#eab308', // yellow-500
  '#22c55e', // green-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
] as const;

// Background color presets (includes transparent)
export const BACKGROUND_COLOR_PRESETS = [
  'transparent',
  '#ffffff',
  '#000000',
  '#6b7280', // gray-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#3b82f6', // blue-500
  '#22c55e', // green-500
  '#eab308', // yellow-500
] as const;

// Type helpers
export type FontFamily = typeof FONT_FAMILIES[number]['value'];
export type FontSize = typeof FONT_SIZES[number]['value'];
export type FontWeight = typeof FONT_WEIGHTS[number]['value'];
export type LineHeight = typeof LINE_HEIGHTS[number]['value'];
export type LetterSpacing = typeof LETTER_SPACINGS[number]['value'];
export type Spacing = typeof SPACING_SCALE[number]['value'];
export type TextAlign = typeof TEXT_ALIGNMENTS[number]['value'];
export type TextDecoration = typeof TEXT_DECORATIONS[number]['value'];
export type BorderRadius = typeof BORDER_RADIUS[number]['value'];


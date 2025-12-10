/**
 * Computed Styles Extraction & Normalization
 * Extract computed styles from DOM and normalize values for editor controls
 */

import { colord } from 'colord';

/**
 * CSS properties we extract from computed styles
 */
const EXTRACTED_PROPERTIES = [
  // Typography
  'color',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'lineHeight',
  'letterSpacing',
  'textAlign',
  'textDecoration',
  'textTransform',
  // Background
  'backgroundColor',
  'backgroundImage',
  'backgroundSize',
  'backgroundPosition',
  'backgroundRepeat',
  // Layout / Spacing
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  // Size
  'width',
  'height',
  'maxWidth',
  'minWidth',
  // Border
  'borderRadius',
  'borderWidth',
  'borderColor',
  'borderStyle',
] as const;

type ExtractedProperty = typeof EXTRACTED_PROPERTIES[number];

/**
 * Extract computed styles from a DOM element
 */
export function extractComputedStyles(element: Element): React.CSSProperties {
  const computed = window.getComputedStyle(element);
  const styles: Partial<Record<ExtractedProperty, string>> = {};

  for (const prop of EXTRACTED_PROPERTIES) {
    const value = computed.getPropertyValue(camelToKebab(prop));
    
    // Special handling for backgroundImage - include even if 'none'
    if (prop === 'backgroundImage') {
      if (value && value !== 'initial' && value !== 'inherit') {
        styles[prop] = value;
      }
    } else if (value && value !== 'none' && value !== 'normal' && value !== 'auto') {
      styles[prop] = value;
    }
  }

  // Normalize extracted values
  return normalizeStyles(styles);
}

/**
 * Convert camelCase to kebab-case
 */
function camelToKebab(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

/**
 * Normalize CSS values to match editor control formats
 */
export function normalizeStyles(styles: Record<string, any>): React.CSSProperties {
  const normalized: Record<string, any> = {};

  for (const [key, value] of Object.entries(styles)) {
    if (value === undefined || value === null) continue;

    const normalizer = VALUE_NORMALIZERS[key as keyof typeof VALUE_NORMALIZERS];
    normalized[key] = normalizer ? normalizer(String(value)) : value;
  }

  return normalized;
}

/**
 * Value normalizers for specific CSS properties
 */
const VALUE_NORMALIZERS: Record<string, (value: string) => string> = {
  // Color normalization - convert to hex
  color: normalizeColor,
  backgroundColor: normalizeColor,
  borderColor: normalizeColor,

  // Font size - convert to px and round to scale
  fontSize: normalizeFontSize,

  // Font weight - convert named weights to numbers
  fontWeight: normalizeFontWeight,

  // Line height - normalize to unitless or match scale
  lineHeight: normalizeLineHeight,

  // Letter spacing - normalize to em
  letterSpacing: normalizeLetterSpacing,

  // Text align - already standard values
  textAlign: (v) => v,

  // Text decoration - normalize multi-value to simple
  textDecoration: normalizeTextDecoration,

  // Background image properties
  backgroundImage: (v) => v, // Keep as-is
  backgroundSize: (v) => v, // Keep as-is
  backgroundPosition: (v) => v, // Keep as-is
  backgroundRepeat: (v) => v, // Keep as-is

  // Spacing - normalize to px shorthand
  padding: normalizeSpacing,
  paddingTop: normalizeSpacingValue,
  paddingRight: normalizeSpacingValue,
  paddingBottom: normalizeSpacingValue,
  paddingLeft: normalizeSpacingValue,
  margin: normalizeSpacing,
  marginTop: normalizeSpacingValue,
  marginRight: normalizeSpacingValue,
  marginBottom: normalizeSpacingValue,
  marginLeft: normalizeSpacingValue,

  // Border radius
  borderRadius: normalizeSpacingValue,

  // Dimensions
  width: normalizeDimension,
  height: normalizeDimension,
  maxWidth: normalizeDimension,
  minWidth: normalizeDimension,
};

/**
 * Normalize color values to hex format
 */
function normalizeColor(value: string): string {
  if (!value || value === 'transparent' || value === 'inherit' || value === 'initial') {
    return value;
  }

  try {
    const parsed = colord(value);
    if (parsed.isValid()) {
      // Return hex, but handle transparency
      if (parsed.alpha() === 0) {
        return 'transparent';
      }
      return parsed.toHex();
    }
  } catch {
    // If parsing fails, return original
  }

  return value;
}

/**
 * Normalize font size to px
 */
function normalizeFontSize(value: string): string {
  const px = parsePixelValue(value);
  if (px !== null) {
    // Round to nearest scale value
    const scale = [12, 14, 16, 18, 20, 24, 30, 36, 48];
    const closest = scale.reduce((prev, curr) =>
      Math.abs(curr - px) < Math.abs(prev - px) ? curr : prev
    );
    return `${closest}px`;
  }
  return value;
}

/**
 * Normalize font weight to numeric value
 */
function normalizeFontWeight(value: string): string {
  const weightMap: Record<string, string> = {
    'normal': '400',
    'bold': '700',
    'lighter': '300',
    'bolder': '700',
  };

  if (weightMap[value]) {
    return weightMap[value];
  }

  // If already numeric, round to nearest standard weight
  const num = parseInt(value, 10);
  if (!isNaN(num)) {
    const weights = [400, 500, 600, 700];
    const closest = weights.reduce((prev, curr) =>
      Math.abs(curr - num) < Math.abs(prev - num) ? curr : prev
    );
    return String(closest);
  }

  return value;
}

/**
 * Normalize line height to unitless or scale value
 */
function normalizeLineHeight(value: string): string {
  // If already unitless number
  if (/^[\d.]+$/.test(value)) {
    const num = parseFloat(value);
    // Round to nearest scale value
    const scale = [1, 1.25, 1.5, 1.75, 2];
    const closest = scale.reduce((prev, curr) =>
      Math.abs(curr - num) < Math.abs(prev - num) ? curr : prev
    );
    return String(closest);
  }

  // If 'normal', return 1.5 (common default)
  if (value === 'normal') {
    return '1.5';
  }

  // If px value, convert to unitless based on common font size
  const px = parsePixelValue(value);
  if (px !== null) {
    // Assume 16px base, convert to ratio
    const ratio = px / 16;
    const scale = [1, 1.25, 1.5, 1.75, 2];
    const closest = scale.reduce((prev, curr) =>
      Math.abs(curr - ratio) < Math.abs(prev - ratio) ? curr : prev
    );
    return String(closest);
  }

  return value;
}

/**
 * Normalize letter spacing to em
 */
function normalizeLetterSpacing(value: string): string {
  if (value === 'normal' || value === '0' || value === '0px') {
    return '0em';
  }

  // If already em, normalize
  if (value.endsWith('em')) {
    const num = parseFloat(value);
    // Round to scale
    const scale = [-0.05, -0.025, 0, 0.025, 0.05, 0.1];
    const closest = scale.reduce((prev, curr) =>
      Math.abs(curr - num) < Math.abs(prev - num) ? curr : prev
    );
    return `${closest}em`;
  }

  // If px, convert to em (assuming 16px base)
  const px = parsePixelValue(value);
  if (px !== null) {
    const em = px / 16;
    const scale = [-0.05, -0.025, 0, 0.025, 0.05, 0.1];
    const closest = scale.reduce((prev, curr) =>
      Math.abs(curr - em) < Math.abs(prev - em) ? curr : prev
    );
    return `${closest}em`;
  }

  return value;
}

/**
 * Normalize text decoration
 */
function normalizeTextDecoration(value: string): string {
  // Computed style returns full value like "none solid rgb(0, 0, 0)"
  if (value.includes('underline')) return 'underline';
  if (value.includes('line-through')) return 'line-through';
  if (value.includes('overline')) return 'overline';
  return 'none';
}

/**
 * Normalize spacing shorthand (padding/margin)
 */
function normalizeSpacing(value: string): string {
  const parts = value.split(/\s+/).map(normalizeSpacingValue);
  
  // Simplify if possible
  if (parts.length === 4) {
    // All same
    if (parts[0] === parts[1] && parts[1] === parts[2] && parts[2] === parts[3]) {
      return parts[0];
    }
    // Vertical/horizontal same
    if (parts[0] === parts[2] && parts[1] === parts[3]) {
      return `${parts[0]} ${parts[1]}`;
    }
  }

  return parts.join(' ');
}

/**
 * Normalize individual spacing value to px
 */
function normalizeSpacingValue(value: string): string {
  const px = parsePixelValue(value);
  if (px !== null) {
    // Round to spacing scale
    const scale = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64];
    const closest = scale.reduce((prev, curr) =>
      Math.abs(curr - px) < Math.abs(prev - px) ? curr : prev
    );
    return `${closest}px`;
  }
  return value;
}

/**
 * Normalize dimension values
 */
function normalizeDimension(value: string): string {
  // Handle percentage values
  if (value.endsWith('%')) {
    return value;
  }

  // Handle auto
  if (value === 'auto' || value === 'none') {
    return 'auto';
  }

  // Convert to px
  const px = parsePixelValue(value);
  if (px !== null) {
    return `${Math.round(px)}px`;
  }

  return value;
}

/**
 * Parse any CSS length value to pixels
 */
function parsePixelValue(value: string): number | null {
  if (!value) return null;

  // Already px
  if (value.endsWith('px')) {
    return parseFloat(value);
  }

  // rem (assuming 16px base)
  if (value.endsWith('rem')) {
    return parseFloat(value) * 16;
  }

  // em (assuming 16px base for computed styles)
  if (value.endsWith('em')) {
    return parseFloat(value) * 16;
  }

  // pt
  if (value.endsWith('pt')) {
    return parseFloat(value) * 1.333;
  }

  // Plain number (assumed px)
  const num = parseFloat(value);
  if (!isNaN(num)) {
    return num;
  }

  return null;
}

/**
 * Merge source styles with computed styles
 * Source styles take precedence for explicit values
 */
export function mergeStyles(
  sourceStyles: React.CSSProperties,
  computedStyles: React.CSSProperties
): React.CSSProperties {
  // Computed styles as base, source overrides
  return {
    ...computedStyles,
    ...sourceStyles,
  };
}

/**
 * Check if a value matches our predefined scale
 */
export function isScaleValue(property: string, value: string): boolean {
  const scales: Record<string, string[]> = {
    fontSize: ['12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px', '48px'],
    fontWeight: ['400', '500', '600', '700'],
    lineHeight: ['1', '1.25', '1.5', '1.75', '2'],
    letterSpacing: ['-0.05em', '-0.025em', '0em', '0.025em', '0.05em', '0.1em'],
    padding: ['0px', '4px', '8px', '12px', '16px', '20px', '24px', '32px', '40px', '48px', '64px'],
    margin: ['0px', '4px', '8px', '12px', '16px', '20px', '24px', '32px', '40px', '48px', '64px'],
    borderRadius: ['0px', '4px', '8px', '12px', '16px', '24px', '9999px'],
  };

  const scale = scales[property];
  return scale ? scale.includes(value) : true;
}


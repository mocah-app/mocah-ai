'use client';

import React, { useMemo } from 'react';
import { PropertySection, SelectControl, ToggleGroupControl } from '../controls';
import {
  FONT_FAMILIES,
  FONT_SIZES,
  FONT_WEIGHTS,
  LINE_HEIGHTS,
  LETTER_SPACINGS,
  TEXT_ALIGNMENTS,
  TEXT_DECORATIONS,
  WIDTH_PRESETS,
} from '../constants/editor-constants';

interface TypographySectionProps {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textAlign?: string;
  textDecoration?: string;
  maxWidth?: string;
  onChange: (property: string, value: string) => void;
  // Optional: hide certain controls
  showFontFamily?: boolean;
  showDecoration?: boolean;
  showMaxWidth?: boolean;
  // Brand font from organization's brand kit
  brandFont?: string | null;
}

export function TypographySection({
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  textAlign,
  textDecoration,
  maxWidth,
  onChange,
  showFontFamily = true,
  showDecoration = true,
  showMaxWidth = false,
  brandFont,
}: TypographySectionProps) {
  // Build font family options with brand font at the top
  const fontFamilyOptions = useMemo(() => {
    const options = [...FONT_FAMILIES];
    
    // If brand font exists, make it the first "Brand Font" option
    if (brandFont) {
      // Replace "Default" with "Brand Font" and use the actual brand font value
      options[0] = {
        value: brandFont,
        label: 'Brand Font',
        stack: brandFont,
      };
    }
    
    return options;
  }, [brandFont]);

  // Determine the default font value (brand font or first option)
  const defaultFontValue = brandFont || FONT_FAMILIES[0].value;
  
  // Use brand font as default if fontFamily is undefined or 'inherit'
  const currentFontFamily = fontFamily && fontFamily !== 'inherit' 
    ? fontFamily 
    : defaultFontValue;
  
  // Pass actual values to let SelectControl show custom values if needed
  const currentFontSize = fontSize;
  const currentFontWeight = fontWeight;
  const currentLineHeight = lineHeight;
  const currentLetterSpacing = letterSpacing;

  return (
    <PropertySection label="Typography">
      <div className="grid grid-cols-2 gap-2">
        {/* Font Family Dropdown */}
        {showFontFamily && (
          <SelectControl
            label="Font Family"
            value={currentFontFamily}
            options={fontFamilyOptions}
            onChange={(v) => onChange("fontFamily", v)}
            placeholder="Select font..."
          />
        )}

        {/* Max Width */}
        {showMaxWidth && (
          <SelectControl
            label="Max Width"
            value={maxWidth}
            options={WIDTH_PRESETS}
            onChange={(v) => onChange("maxWidth", v)}
            placeholder="None"
          />
        )}
      </div>

      {/* Font Weight & Size Row */}
      <div className="grid grid-cols-2 gap-2">
        <SelectControl
          label="Weight"
          value={currentFontWeight}
          options={FONT_WEIGHTS}
          onChange={(v) => onChange("fontWeight", v)}
          placeholder="Default"
        />
        <SelectControl
          label="Size"
          value={currentFontSize}
          options={FONT_SIZES}
          onChange={(v) => onChange("fontSize", v)}
          placeholder="Default"
        />
      </div>

      {/* Line Height & Letter Spacing Row */}
      <div className="grid grid-cols-2 gap-2">
        <SelectControl
          label="Line Height"
          value={currentLineHeight}
          options={LINE_HEIGHTS}
          onChange={(v) => onChange("lineHeight", v)}
          placeholder="Default"
        />
        <SelectControl
          label="Letter Spacing"
          value={currentLetterSpacing}
          options={LETTER_SPACINGS}
          onChange={(v) => onChange("letterSpacing", v)}
          placeholder="Default"
        />
      </div>

      {/* Alignment */}
      <ToggleGroupControl
        label="Alignment"
        value={textAlign}
        options={TEXT_ALIGNMENTS}
        onChange={(v) => onChange("textAlign", v)}
      />

      {/* Decoration */}
      {showDecoration && (
        <ToggleGroupControl
          label="Decoration"
          value={textDecoration}
          options={TEXT_DECORATIONS}
          onChange={(v) => onChange("textDecoration", v)}
          allowReset={false}
        />
      )}
    </PropertySection>
  );
}


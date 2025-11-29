'use client';

import React from 'react';
import { PropertySection, SelectControl, ToggleGroupControl } from '../controls';
import {
  FONT_FAMILIES,
  FONT_SIZES,
  FONT_WEIGHTS,
  LINE_HEIGHTS,
  LETTER_SPACINGS,
  TEXT_ALIGNMENTS,
  TEXT_DECORATIONS,
} from '../constants/editor-constants';

interface TypographySectionProps {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textAlign?: string;
  textDecoration?: string;
  onChange: (property: string, value: string) => void;
  // Optional: hide certain controls
  showFontFamily?: boolean;
  showDecoration?: boolean;
}

export function TypographySection({
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  textAlign,
  textDecoration,
  onChange,
  showFontFamily = true,
  showDecoration = true,
}: TypographySectionProps) {
  // Find current values in options to display correctly
  const currentFontFamily = FONT_FAMILIES.find(f => f.value === fontFamily) 
    ? fontFamily 
    : FONT_FAMILIES[0].value;
  
  const currentFontSize = FONT_SIZES.find(f => f.value === fontSize)
    ? fontSize
    : undefined;
    
  const currentFontWeight = FONT_WEIGHTS.find(f => f.value === fontWeight)
    ? fontWeight
    : undefined;
    
  const currentLineHeight = LINE_HEIGHTS.find(l => l.value === lineHeight)
    ? lineHeight
    : undefined;
    
  const currentLetterSpacing = LETTER_SPACINGS.find(l => l.value === letterSpacing)
    ? letterSpacing
    : undefined;

  return (
    <PropertySection label="Typography">
      {/* Font Family Dropdown */}
      {showFontFamily && (
        <SelectControl
          value={currentFontFamily}
          options={FONT_FAMILIES}
          onChange={(v) => onChange('fontFamily', v)}
          placeholder="Select font..."
        />
      )}

      {/* Font Weight & Size Row */}
      <div className="grid grid-cols-2 gap-2">
        <SelectControl
          label="Weight"
          value={currentFontWeight}
          options={FONT_WEIGHTS}
          onChange={(v) => onChange('fontWeight', v)}
          placeholder="Default"
        />
        <SelectControl
          label="Size"
          value={currentFontSize}
          options={FONT_SIZES}
          onChange={(v) => onChange('fontSize', v)}
          placeholder="Default"
        />
      </div>

      {/* Line Height & Letter Spacing Row */}
      <div className="grid grid-cols-2 gap-2">
        <SelectControl
          label="Line Height"
          value={currentLineHeight}
          options={LINE_HEIGHTS}
          onChange={(v) => onChange('lineHeight', v)}
          placeholder="Default"
        />
        <SelectControl
          label="Letter Spacing"
          value={currentLetterSpacing}
          options={LETTER_SPACINGS}
          onChange={(v) => onChange('letterSpacing', v)}
          placeholder="Default"
        />
      </div>

      {/* Alignment */}
      <ToggleGroupControl
        label="Alignment"
        value={textAlign}
        options={TEXT_ALIGNMENTS}
        onChange={(v) => onChange('textAlign', v)}
      />

      {/* Decoration */}
      {showDecoration && (
        <ToggleGroupControl
          label="Decoration"
          value={textDecoration}
          options={TEXT_DECORATIONS}
          onChange={(v) => onChange('textDecoration', v)}
          allowReset={false}
        />
      )}
    </PropertySection>
  );
}


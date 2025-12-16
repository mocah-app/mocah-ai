'use client';

import React, { useMemo } from 'react';
import { PropertySection, SelectControl, ColorControl } from '../controls';
import { BORDER_WIDTH_PRESETS } from '../constants/editor-constants';
import type { BrandColors } from '../EditorShell';

interface BorderSectionProps {
  borderWidth?: string;
  borderColor?: string;
  onChange: (property: string, value: string) => void;
  brandColors?: BrandColors;
}

export function BorderSection({
  borderWidth,
  borderColor,
  onChange,
  brandColors,
}: BorderSectionProps) {
  // Build color presets with brand colors
  const colorPresets = useMemo(() => {
    const brandColorList = [...new Set(
      [brandColors?.primary, brandColors?.accent].filter((c): c is string => !!c)
    )];
    
    if (brandColorList.length > 0) {
      const basePresets = ['#000000', '#ffffff', '#ef4444', '#3b82f6', '#8b5cf6'].filter(
        c => !brandColorList.includes(c)
      );
      return [...brandColorList, ...basePresets];
    }
    
    return ['#000000', '#ffffff', '#ef4444', '#3b82f6', '#8b5cf6'];
  }, [brandColors]);

  const handleBorderWidthChange = (value: string) => {
    onChange('borderWidth', value);
    // Automatically set borderStyle to 'solid' when width is set (CSS requires style for border to show)
    if (value && value !== '0px') {
      onChange('borderStyle', 'solid');
    } else {
      // Remove border style when width is 0
      onChange('borderStyle', 'none');
    }
  };

  return (
    <PropertySection label="Border">
        <div className="grid grid-cols-[90px_1fr] gap-2">
      <SelectControl
        label="Width"
        value={borderWidth}
        options={BORDER_WIDTH_PRESETS}
        onChange={handleBorderWidthChange}
        placeholder="None"
      />

        <ColorControl
          label="Color"
          value={borderColor}
          onChange={(v) => onChange('borderColor', v)}
          showPresets={false}
          presets={colorPresets}
          placeholder="#000000"
        />

      </div>
    </PropertySection>
  );
}


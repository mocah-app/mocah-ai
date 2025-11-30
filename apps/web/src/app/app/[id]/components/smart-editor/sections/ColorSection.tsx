'use client';

import React, { useMemo } from 'react';
import { PropertySection, ColorControl } from '../controls';
import { COLOR_PRESETS } from '../constants/editor-constants';
import type { BrandColors } from '../EditorShell';

interface ColorSectionProps {
  value: string | undefined;
  onChange: (value: string) => void;
  label?: string;
  defaultValue?: string;
  showPresets?: boolean;
  showAlpha?: boolean;
  brandColors?: BrandColors;
}

export function ColorSection({
  value,
  onChange,
  label = 'Color',
  defaultValue,
  showPresets = true,
  showAlpha = false,
  brandColors,
}: ColorSectionProps) {
  // Build presets with brand colors at the front
  const colorPresets = useMemo(() => {
    const brandColorList = [
      brandColors?.primary,
      brandColors?.secondary,
      brandColors?.accent,
    ].filter((c): c is string => !!c);
    
    // If we have brand colors, prepend them (avoiding duplicates)
    if (brandColorList.length > 0) {
      const basePresets = COLOR_PRESETS.filter(c => !brandColorList.includes(c));
      return [...brandColorList, ...basePresets];
    }
    
    return [...COLOR_PRESETS];
  }, [brandColors]);

  return (
    <PropertySection label={label}>
      <ColorControl
        value={value}
        onChange={onChange}
        defaultValue={defaultValue}
        showPresets={showPresets}
        showAlpha={showAlpha}
        presets={colorPresets}
      />
    </PropertySection>
  );
}

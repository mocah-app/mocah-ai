'use client';

import React, { useMemo } from 'react';
import { PropertySection, ColorControl } from '../controls';
import { BACKGROUND_COLOR_PRESETS } from '../constants/editor-constants';
import type { BrandColors } from '../EditorShell';

interface BackgroundSectionProps {
  value: string | undefined;
  onChange: (value: string) => void;
  brandColors?: BrandColors;
}

export function BackgroundSection({
  value,
  onChange,
  brandColors,
}: BackgroundSectionProps) {
  // Build presets with brand colors after transparent
  const bgPresets = useMemo(() => {
    // Deduplicate brand colors (primary and accent might be the same)
    const brandColorList = [...new Set(
      [brandColors?.primary, brandColors?.accent].filter((c): c is string => !!c)
    )];
    
    // If we have brand colors, insert them after 'transparent'
    if (brandColorList.length > 0) {
      const [transparent, ...rest] = BACKGROUND_COLOR_PRESETS;
      const filteredRest = rest.filter(c => !brandColorList.includes(c));
      return [transparent, ...brandColorList, ...filteredRest];
    }
    
    return [...BACKGROUND_COLOR_PRESETS];
  }, [brandColors]);

  return (
    <PropertySection label="Background">
      <ColorControl
        value={value}
        onChange={onChange}
        showPresets={true}
        presets={bgPresets}
      />
    </PropertySection>
  );
}


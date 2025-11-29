'use client';

import React from 'react';
import { PropertySection, ColorControl } from '../controls';
import { BACKGROUND_COLOR_PRESETS } from '../constants/editor-constants';

interface BackgroundSectionProps {
  value: string | undefined;
  onChange: (value: string) => void;
}

export function BackgroundSection({
  value,
  onChange,
}: BackgroundSectionProps) {
  return (
    <PropertySection label="Background">
      <ColorControl
        value={value}
        onChange={onChange}
        showPresets={true}
        presets={BACKGROUND_COLOR_PRESETS}
      />
    </PropertySection>
  );
}


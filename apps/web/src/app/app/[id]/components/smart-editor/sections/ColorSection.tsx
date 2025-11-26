'use client';

import React from 'react';
import { PropertySection, ColorControl } from '../controls';

interface ColorSectionProps {
  value: string | undefined;
  onChange: (value: string) => void;
  label?: string;
  showPresets?: boolean;
}

export function ColorSection({
  value,
  onChange,
  label = 'Color',
  showPresets = true,
}: ColorSectionProps) {
  return (
    <PropertySection label={label}>
      <ColorControl
        value={value}
        onChange={onChange}
        showPresets={showPresets}
      />
    </PropertySection>
  );
}


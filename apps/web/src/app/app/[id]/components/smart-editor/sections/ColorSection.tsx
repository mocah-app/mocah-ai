'use client';

import React from 'react';
import { PropertySection, ColorControl } from '../controls';

interface ColorSectionProps {
  value: string | undefined;
  onChange: (value: string) => void;
  label?: string;
  defaultValue?: string;
  showPresets?: boolean;
  showAlpha?: boolean;
}

export function ColorSection({
  value,
  onChange,
  label = 'Color',
  defaultValue,
  showPresets = true,
  showAlpha = false,
}: ColorSectionProps) {
  return (
    <PropertySection label={label}>
      <ColorControl
        value={value}
        onChange={onChange}
        defaultValue={defaultValue}
        showPresets={showPresets}
        showAlpha={showAlpha}
      />
    </PropertySection>
  );
}

'use client';

import React from 'react';
import { PropertySection, ColorControl } from '../controls';

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
      />
    </PropertySection>
  );
}


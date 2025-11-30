'use client';

import React from 'react';
import { PropertySection, SelectControl, SpacingControl } from '../controls';
import { SPACING_SCALE, BORDER_RADIUS } from '../constants/editor-constants';

interface LayoutSectionProps {
  padding?: string;
  margin?: string;
  borderRadius?: string;
  onChange: (property: string, value: string) => void;
  showBorderRadius?: boolean;
}

export function LayoutSection({
  padding,
  margin,
  borderRadius,
  onChange,
  showBorderRadius = false,
}: LayoutSectionProps) {
  // Pass through actual values - controls will handle custom values
  return (
    <PropertySection label="Layout">
      <SpacingControl
        label="Padding"
        value={padding}
        options={SPACING_SCALE}
        onChange={(v) => onChange('padding', v)}
      />
      <SpacingControl
        label="Margin"
        value={margin}
        options={SPACING_SCALE}
        onChange={(v) => onChange('margin', v)}
      />
      {showBorderRadius && (
        <SelectControl
          label="Border Radius"
          value={borderRadius}
          options={BORDER_RADIUS}
          onChange={(v) => onChange('borderRadius', v)}
          placeholder="Default"
        />
      )}
    </PropertySection>
  );
}


'use client';

import React from 'react';
import { PropertySection, SelectControl } from '../controls';
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
  // Find current values
  const currentPadding = SPACING_SCALE.find(s => s.value === padding)
    ? padding
    : undefined;
    
  const currentMargin = SPACING_SCALE.find(s => s.value === margin)
    ? margin
    : undefined;
    
  const currentBorderRadius = BORDER_RADIUS.find(r => r.value === borderRadius)
    ? borderRadius
    : undefined;

  return (
    <PropertySection label="Layout">
      <div className="grid grid-cols-2 gap-2">
        <SelectControl
          label="Padding"
          value={currentPadding}
          options={SPACING_SCALE}
          onChange={(v) => onChange('padding', v)}
          placeholder="Default"
        />
        <SelectControl
          label="Margin"
          value={currentMargin}
          options={SPACING_SCALE}
          onChange={(v) => onChange('margin', v)}
          placeholder="Default"
        />
      </div>
      {showBorderRadius && (
        <SelectControl
          label="Border Radius"
          value={currentBorderRadius}
          options={BORDER_RADIUS}
          onChange={(v) => onChange('borderRadius', v)}
          placeholder="Default"
        />
      )}
    </PropertySection>
  );
}


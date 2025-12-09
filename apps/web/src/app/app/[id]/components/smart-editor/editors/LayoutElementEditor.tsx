'use client';

import React from 'react';
import type { ElementData, ElementUpdates } from '@/lib/react-email';
import type { BrandColors } from '../EditorShell';
import { PropertySection, ToggleGroupControl, SelectControl } from '../controls';
import { BackgroundSection, LayoutSection } from '../sections';
import { TEXT_ALIGNMENTS, WIDTH_PRESETS } from '../constants/editor-constants';

interface LayoutElementEditorProps {
  elementData: ElementData;
  currentStyles: React.CSSProperties;
  onUpdate: (updates: ElementUpdates) => void;
  brandFont?: string | null;
  brandColors?: BrandColors;
}

/**
 * Editor for layout elements: Section, Container, Row, Column
 */
export function LayoutElementEditor({
  elementData,
  currentStyles,
  onUpdate,
  brandColors,
}: LayoutElementEditorProps) {
  const handleStyleChange = (property: string, value: string) => {
    onUpdate({
      styles: { [property]: value },
    });
  };

  const isContainer = elementData.type === 'Container';
  const isColumn = elementData.type === 'Column';
  const isSection = elementData.type === 'Section';
  const isRow = elementData.type === 'Row';

  // Determine which width property to use
  const widthProperty = isContainer ? 'maxWidth' : 'width';
  const widthLabel = isContainer ? 'Max Width' : 'Width';

  return (
    <div className="space-y-0">
      {/* Info about layout element */}
      <PropertySection label="Element">
        <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
          <p>
            <strong className="text-foreground">{elementData.type}</strong> is a
            structural element used for layout.
          </p>
          <p className="mt-1">
            You can adjust spacing and background properties.
          </p>
        </div>
      </PropertySection>

      {/* Width for all layout elements */}
      <PropertySection label="Size">
        <SelectControl
          label={widthLabel}
          value={(isContainer ? currentStyles.maxWidth : currentStyles.width) as string}
          options={WIDTH_PRESETS}
          onChange={(v) => handleStyleChange(widthProperty, v)}
          placeholder="Auto"
        />
      </PropertySection>

      {/* Text Alignment */}
      <PropertySection label="Content Alignment">
        <ToggleGroupControl
          value={currentStyles.textAlign as string}
          options={TEXT_ALIGNMENTS}
          onChange={(v) => handleStyleChange('textAlign', v)}
        />
      </PropertySection>

      {/* Background */}
      <BackgroundSection
        value={currentStyles.backgroundColor as string}
        onChange={(v) => handleStyleChange('backgroundColor', v)}
        brandColors={brandColors}
      />

      {/* Layout (padding, margin) */}
      <LayoutSection
        padding={currentStyles.padding as string}
        margin={currentStyles.margin as string}
        onChange={handleStyleChange}
      />
    </div>
  );
}

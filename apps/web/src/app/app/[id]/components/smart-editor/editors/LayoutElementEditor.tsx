'use client';

import React from 'react';
import type { ElementData, ElementUpdates } from '@/lib/react-email';
import type { BrandColors } from '../EditorShell';
import { PropertySection, ToggleGroupControl, SelectControl, TextInputControl } from '../controls';
import { BackgroundSection, LayoutSection, BorderSection } from '../sections';
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
     

      {/* Width/Max Width for all layout elements */}
      <PropertySection label="Size">
        <div className="grid grid-cols-2 w-full gap-4">

        <SelectControl
          label={widthLabel}
          value={(isContainer ? currentStyles.maxWidth : currentStyles.width) as string}
          options={WIDTH_PRESETS}
          onChange={(v) => handleStyleChange(widthProperty, v)}
          placeholder="Auto"
          />
       
        {/* Max Width for non-Container elements */}
        {!isContainer && (
          <SelectControl
          label="Max Width"
          value={currentStyles.maxWidth as string}
          options={WIDTH_PRESETS}
          onChange={(v) => handleStyleChange('maxWidth', v)}
          placeholder="None"
          />
        )}

         {/* Height control for Section elements */}
         {isSection && (
          <TextInputControl
          label="Height"
          value={currentStyles.height as string}
          onChange={(v) => handleStyleChange('height', v)}
          placeholder="auto"
          />
        )}
        </div>
      </PropertySection>

      {/* Text Alignment */}
      <PropertySection label="Content Alignment">
        <ToggleGroupControl
          value={currentStyles.textAlign as string}
          options={TEXT_ALIGNMENTS}
          onChange={(v) => handleStyleChange('textAlign', v)}
        />
      </PropertySection>
{/* Layout (padding, margin, border-radius) */}
      <LayoutSection
        padding={currentStyles.padding as string}
        margin={currentStyles.margin as string}
        borderRadius={currentStyles.borderRadius as string}
        onChange={handleStyleChange}
        showBorderRadius={true}
      />
      {/* Background */}
      <BackgroundSection
        value={currentStyles.backgroundColor as string}
        onChange={handleStyleChange}
        brandColors={brandColors}
        currentStyles={currentStyles}
      />
      {/* Border */}
      <BorderSection
        borderWidth={currentStyles.borderWidth as string}
        borderColor={currentStyles.borderColor as string}
        onChange={handleStyleChange}
        brandColors={brandColors}
      />
    </div>
  );
}

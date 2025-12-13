'use client';

import React, { useMemo } from 'react';
import type { ElementData, ElementUpdates } from '@/lib/react-email';
import type { BrandColors } from '../EditorShell';
import {
  ContentSection,
  TypographySection,
  ColorSection,
  LayoutSection,
} from '../sections';
import { PropertySection, ColorControl } from '../controls';
import { BACKGROUND_COLOR_PRESETS } from '../constants/editor-constants';

interface TextElementEditorProps {
  elementData: ElementData;
  currentStyles: React.CSSProperties;
  onUpdate: (updates: ElementUpdates) => void;
  brandFont?: string | null;
  brandColors?: BrandColors;
  onOpenChat?: (text: string) => void;
}

/**
 * Editor for Heading and Text elements
 */
export function TextElementEditor({
  elementData,
  currentStyles,
  onUpdate,
  brandFont,
  brandColors,
  onOpenChat,
}: TextElementEditorProps) {
  const handleStyleChange = (property: string, value: string) => {
    onUpdate({
      styles: { [property]: value },
    });
  };

  const handleContentChange = (content: string) => {
    onUpdate({ content });
  };

  // Build background color presets with brand colors
  const bgPresets = useMemo(() => {
    const brandColorList = [...new Set(
      [brandColors?.primary, brandColors?.accent].filter((c): c is string => !!c)
    )];
    
    if (brandColorList.length > 0) {
      const [transparent, ...rest] = BACKGROUND_COLOR_PRESETS;
      const filteredRest = rest.filter(c => !brandColorList.includes(c));
      return [transparent, ...brandColorList, ...filteredRest];
    }
    
    return [...BACKGROUND_COLOR_PRESETS];
  }, [brandColors]);

  return (
    <div className="space-y-0">
      {/* Content Section */}
      <ContentSection
        content={elementData.content}
        onChange={handleContentChange}
        hasNestedFormatting={elementData.hasNestedFormatting}
        onOpenChat={onOpenChat}
      />

      {/* Typography Section */}
      <TypographySection
        fontFamily={currentStyles.fontFamily as string}
        fontSize={currentStyles.fontSize as string}
        fontWeight={currentStyles.fontWeight as string}
        lineHeight={currentStyles.lineHeight as string}
        letterSpacing={currentStyles.letterSpacing as string}
        textAlign={currentStyles.textAlign as string}
        textDecoration={currentStyles.textDecoration as string}
        maxWidth={currentStyles.maxWidth as string}
        onChange={handleStyleChange}
        showDecoration={true}
        showMaxWidth={true}
        brandFont={brandFont}
      />

      {/* Color Section */}
      <ColorSection
        value={currentStyles.color as string}
        onChange={(v) => handleStyleChange('color', v)}
        brandColors={brandColors}
      />

      {/* Background Color */}
      <PropertySection label="Background">
        <ColorControl
          value={currentStyles.backgroundColor as string}
          onChange={(v) => handleStyleChange('backgroundColor', v)}
          showPresets={true}
          presets={bgPresets}
        />
      </PropertySection>

      {/* Layout Section */}
      <LayoutSection
        padding={currentStyles.padding as string}
        margin={currentStyles.margin as string}
        onChange={handleStyleChange}
        showBorderRadius={false}
      />
    </div>
  );
}

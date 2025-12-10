'use client';

import React from 'react';
import type { ElementData, ElementUpdates } from '@/lib/react-email';
import type { BrandColors } from '../EditorShell';
import {
  ContentSection,
  TypographySection,
  ColorSection,
  BackgroundSection,
  LayoutSection,
} from '../sections';

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
        onChange={handleStyleChange}
        showDecoration={true}
        brandFont={brandFont}
      />

      {/* Color Section */}
      <ColorSection
        value={currentStyles.color as string}
        onChange={(v) => handleStyleChange('color', v)}
        brandColors={brandColors}
      />

      {/* Background Section */}
      <BackgroundSection
        value={currentStyles.backgroundColor as string}
        onChange={(v) => handleStyleChange('backgroundColor', v)}
        brandColors={brandColors}
      />

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

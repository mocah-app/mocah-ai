'use client';

import React from 'react';
import type { ElementData, ElementUpdates } from '@/lib/react-email';
import {
  ContentSection,
  TypographySection,
  ColorSection,
  BackgroundSection,
} from '../sections';

interface TextElementEditorProps {
  elementData: ElementData;
  currentStyles: React.CSSProperties;
  onUpdate: (updates: ElementUpdates) => void;
}

/**
 * Editor for Heading and Text elements
 */
export function TextElementEditor({
  elementData,
  currentStyles,
  onUpdate,
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
      />

      {/* Color Section */}
      <ColorSection
        value={currentStyles.color as string}
        onChange={(v) => handleStyleChange('color', v)}
      />

      {/* Background Section */}
      <BackgroundSection
        value={currentStyles.backgroundColor as string}
        onChange={(v) => handleStyleChange('backgroundColor', v)}
      />
    </div>
  );
}


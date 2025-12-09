'use client';

import React from 'react';
import type { ElementData, ElementUpdates } from '@/lib/react-email';
import type { BrandColors } from '../EditorShell';
import {
  ContentSection,
  TypographySection,
  ColorSection,
  LinkSection,
} from '../sections';

interface LinkElementEditorProps {
  elementData: ElementData;
  currentStyles: React.CSSProperties;
  onUpdate: (updates: ElementUpdates) => void;
  brandFont?: string | null;
  brandColors?: BrandColors;
  onOpenChat?: (text: string) => void;
}

/**
 * Editor for Link elements
 */
export function LinkElementEditor({
  elementData,
  currentStyles,
  onUpdate,
  brandColors,
  onOpenChat,
}: LinkElementEditorProps) {
  const handleStyleChange = (property: string, value: string) => {
    onUpdate({
      styles: { [property]: value },
    });
  };

  const handleContentChange = (content: string) => {
    onUpdate({ content });
  };

  const handleAttributeChange = (key: string, value: string) => {
    onUpdate({
      attributes: { [key]: value },
    });
  };

  return (
    <div className="space-y-0">
      {/* Content (Link Text) */}
      <ContentSection
        content={elementData.content}
        onChange={handleContentChange}
        label="Link Text"
        hasNestedFormatting={elementData.hasNestedFormatting}
        onOpenChat={onOpenChat}
      />

      {/* Link URL */}
      <LinkSection
        href={(elementData.attributes?.href as string) ?? ''}
        onChange={(href) => handleAttributeChange('href', href)}
      />

      {/* Typography (simplified for links) */}
      <TypographySection
        fontSize={currentStyles.fontSize as string}
        fontWeight={currentStyles.fontWeight as string}
        textDecoration={currentStyles.textDecoration as string}
        onChange={handleStyleChange}
        showFontFamily={false}
      />

      {/* Color Section */}
      <ColorSection
        value={currentStyles.color as string}
        onChange={(v) => handleStyleChange('color', v)}
        brandColors={brandColors}
      />
    </div>
  );
}

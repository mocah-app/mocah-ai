'use client';

import React from 'react';
import type { ElementData, ElementUpdates } from '@/lib/react-email';
import {
  ContentSection,
  TypographySection,
  ColorSection,
  BackgroundSection,
  LinkSection,
  LayoutSection,
} from '../sections';

interface ButtonElementEditorProps {
  elementData: ElementData;
  currentStyles: React.CSSProperties;
  onUpdate: (updates: ElementUpdates) => void;
}

/**
 * Editor for Button elements
 */
export function ButtonElementEditor({
  elementData,
  currentStyles,
  onUpdate,
}: ButtonElementEditorProps) {
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
      {/* Content (Button Text) */}
      <ContentSection
        content={elementData.content}
        onChange={handleContentChange}
        label="Button Text"
      />

      {/* Link URL */}
      <LinkSection
        href={(elementData.attributes?.href as string) ?? ''}
        onChange={(href) => handleAttributeChange('href', href)}
      />

      {/* Typography (simplified for buttons) */}
      <TypographySection
        fontFamily={(currentStyles.fontFamily as string) ?? ''}
        fontSize={(currentStyles.fontSize as string) ?? ''}
        fontWeight={(currentStyles.fontWeight as string) ?? ''}
        textAlign={(currentStyles.textAlign as string) ?? ''}
        onChange={handleStyleChange}
        showFontFamily={false}
        showDecoration={false}
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

      {/* Layout (padding, border-radius) */}
      <LayoutSection
        padding={(currentStyles.padding as string) ?? ''}
        borderRadius={(currentStyles.borderRadius as string) ?? ''}
        onChange={handleStyleChange}
        showBorderRadius={true}
      />
    </div>
  );
}


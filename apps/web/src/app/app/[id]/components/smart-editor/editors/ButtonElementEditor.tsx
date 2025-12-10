'use client';

import React, { useMemo } from 'react';
import type { ElementData, ElementUpdates } from '@/lib/react-email';
import type { BrandColors } from '../EditorShell';
import {
  ContentSection,
  TypographySection,
  ColorSection,
  LinkSection,
  LayoutSection,
} from '../sections';
import { PropertySection, ColorControl } from '../controls';
import { BACKGROUND_COLOR_PRESETS } from '../constants/editor-constants';

interface ButtonElementEditorProps {
  elementData: ElementData;
  currentStyles: React.CSSProperties;
  onUpdate: (updates: ElementUpdates) => void;
  brandFont?: string | null;
  brandColors?: BrandColors;
  onOpenChat?: (text: string) => void;
}

/**
 * Editor for Button elements
 */
export function ButtonElementEditor({
  elementData,
  currentStyles,
  onUpdate,
  brandColors,
  onOpenChat,
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
      {/* Content (Button Text) */}
      <ContentSection
        content={elementData.content}
        onChange={handleContentChange}
        label="Button Text"
        hasNestedFormatting={elementData.hasNestedFormatting}
        onOpenChat={onOpenChat}
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

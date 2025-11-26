'use client';

import React from 'react';
import type { ElementData, ElementUpdates } from '@/lib/react-email';
import { ImageSection, LayoutSection } from '../sections';

interface ImageElementEditorProps {
  elementData: ElementData;
  currentStyles: React.CSSProperties;
  onUpdate: (updates: ElementUpdates) => void;
}

/**
 * Editor for Img elements
 */
export function ImageElementEditor({
  elementData,
  currentStyles,
  onUpdate,
}: ImageElementEditorProps) {
  const handleStyleChange = (property: string, value: string) => {
    onUpdate({
      styles: { [property]: value },
    });
  };

  const handleAttributeChange = (property: string, value: string) => {
    // src and alt are attributes, width/height are styles
    if (property === 'src' || property === 'alt') {
      onUpdate({
        attributes: { [property]: value },
      });
    } else {
      handleStyleChange(property, value);
    }
  };

  return (
    <div className="space-y-0">
      {/* Image Source & Alt (includes size controls) */}
      <ImageSection
        src={elementData.attributes?.src as string}
        alt={elementData.attributes?.alt as string}
        width={currentStyles.width as string}
        height={currentStyles.height as string}
        onChange={handleAttributeChange}
      />

      {/* Layout (margin) */}
      <LayoutSection
        margin={currentStyles.margin as string}
        onChange={handleStyleChange}
      />
    </div>
  );
}


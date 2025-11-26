'use client';

import React from 'react';
import { PropertySection, TextInputControl, SelectControl } from '../controls';
import { WIDTH_PRESETS } from '../constants/editor-constants';

interface ImageSectionProps {
  src: string | undefined;
  alt: string | undefined;
  width?: string;
  height?: string;
  onChange: (property: string, value: string) => void;
}

export function ImageSection({
  src,
  alt,
  width,
  height,
  onChange,
}: ImageSectionProps) {
  return (
    <>
      <PropertySection label="Image">
        <TextInputControl
          label="URL"
          value={src}
          onChange={(v) => onChange('src', v)}
          type="url"
          placeholder="https://example.com/image.jpg"
        />
        <TextInputControl
          label="Alt Text"
          value={alt}
          onChange={(v) => onChange('alt', v)}
          placeholder="Image description"
        />
        {/* Preview */}
        {src && (
          <div className="mt-2 rounded-md overflow-hidden border border-border bg-muted/50">
            <img
              src={src}
              alt={alt || ''}
              className="w-full h-auto max-h-32 object-contain"
            />
          </div>
        )}
      </PropertySection>

      <PropertySection label="Size">
        <div className="grid grid-cols-2 gap-2">
          <SelectControl
            label="Width"
            value={width}
            options={WIDTH_PRESETS}
            onChange={(v) => onChange('width', v)}
            placeholder="Auto"
          />
          <TextInputControl
            label="Height"
            value={height}
            onChange={(v) => onChange('height', v)}
            placeholder="auto"
          />
        </div>
      </PropertySection>
    </>
  );
}


'use client';

import React, { useMemo, useCallback } from 'react';
import { X } from 'lucide-react';
import { PropertySection, ColorControl, SelectControl, ToggleGroupControl } from '../controls';
import { BACKGROUND_COLOR_PRESETS } from '../constants/editor-constants';
import type { BrandColors } from '../EditorShell';
import { ImageSection } from './ImageSection';
import { Button } from '@/components/ui/button';
import { AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd, AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd } from 'lucide-react';

interface BackgroundSectionProps {
  value: string | undefined;
  onChange: (property: string, value: string) => void;
  brandColors?: BrandColors;
  currentStyles: React.CSSProperties;
}

const BACKGROUND_SIZE_OPTIONS = [
  { value: 'cover', label: 'Cover' },
  { value: 'contain', label: 'Contain' },
  { value: 'auto', label: 'Auto' },
];

const BACKGROUND_REPEAT_OPTIONS = [
  { value: 'no-repeat', label: 'No Repeat' },
  { value: 'repeat', label: 'Repeat' },
  { value: 'repeat-x', label: 'Repeat X' },
  { value: 'repeat-y', label: 'Repeat Y' },
];

const HORIZONTAL_POSITION_OPTIONS = [
  { value: 'left', label: 'Left', icon: <AlignHorizontalJustifyStart className="h-4 w-4" /> },
  { value: 'center', label: 'Center', icon: <AlignHorizontalJustifyCenter className="h-4 w-4" /> },
  { value: 'right', label: 'Right', icon: <AlignHorizontalJustifyEnd className="h-4 w-4" /> },
];

const VERTICAL_POSITION_OPTIONS = [
  { value: 'top', label: 'Top', icon: <AlignVerticalJustifyStart className="h-4 w-4" /> },
  { value: 'center', label: 'Center', icon: <AlignVerticalJustifyCenter className="h-4 w-4" /> },
  { value: 'bottom', label: 'Bottom', icon: <AlignVerticalJustifyEnd className="h-4 w-4" /> },
];

export function BackgroundSection({
  value,
  onChange,
  brandColors,
  currentStyles,
}: BackgroundSectionProps) {
  // Extract background image URL from backgroundImage style
  const currentBackgroundImage = currentStyles.backgroundImage as string | undefined;
  const backgroundImageUrl = currentBackgroundImage
    ? currentBackgroundImage.match(/url\(['"]?(.*?)['"]?\)/)?.[1]
    : undefined;

  // Build presets with brand colors after transparent
  const bgPresets = useMemo(() => {
    // Deduplicate brand colors (primary and accent might be the same)
    const brandColorList = [...new Set(
      [brandColors?.primary, brandColors?.accent].filter((c): c is string => !!c)
    )];
    
    // If we have brand colors, insert them after 'transparent'
    if (brandColorList.length > 0) {
      const [transparent, ...rest] = BACKGROUND_COLOR_PRESETS;
      const filteredRest = rest.filter(c => !brandColorList.includes(c));
      return [transparent, ...brandColorList, ...filteredRest];
    }
    
    return [...BACKGROUND_COLOR_PRESETS];
  }, [brandColors]);

  // Handle image selection from upload or AI generation
  const handleImageSelect = useCallback(
    (url: string) => {
      onChange('backgroundImage', `url(${url})`);
      // Set default background properties if not already set
      if (!currentStyles.backgroundSize) {
        onChange('backgroundSize', 'cover');
      }
      if (!currentStyles.backgroundPosition) {
        onChange('backgroundPosition', 'center');
      }
      if (!currentStyles.backgroundRepeat) {
        onChange('backgroundRepeat', 'no-repeat');
      }
    },
    [onChange, currentStyles.backgroundSize, currentStyles.backgroundPosition, currentStyles.backgroundRepeat]
  );

  // Handle background image URL change
  const handleBackgroundImageUrlChange = useCallback(
    (url: string) => {
      if (url) {
        onChange('backgroundImage', `url(${url})`);
      } else {
        onChange('backgroundImage', 'none');
      }
    },
    [onChange]
  );

  // Remove background image
  const handleRemoveImage = useCallback(() => {
    onChange('backgroundImage', 'none');
  }, [onChange]);

  // Parse background position
  const backgroundPosition = (currentStyles.backgroundPosition as string) || 'center center';
  const [horizontalPos, verticalPos] = backgroundPosition.split(' ');

  return (
    <>
      {/* Background Color */}
      <PropertySection label="Background">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Color</label>
          <ColorControl
            value={value}
            onChange={(v) => onChange('backgroundColor', v)}
            showPresets={true}
            presets={bgPresets}
          />
        </div>
      </PropertySection>

      {/* Background Image */}
      <ImageSection
        src={backgroundImageUrl}
        onImageSelect={handleImageSelect}
        onSrcChange={handleBackgroundImageUrlChange}
        showAltText={false}
        label="Background Image"
      />

      {/* Background Image Properties (only show if image exists) */}
      {backgroundImageUrl && backgroundImageUrl !== 'none' && (
        <>
          <PropertySection label="Background Size">
            <SelectControl
              label="Size"
              value={currentStyles.backgroundSize as string}
              options={BACKGROUND_SIZE_OPTIONS}
              onChange={(v) => onChange('backgroundSize', v)}
              placeholder="Cover"
            />
          </PropertySection>

          <PropertySection label="Background Position">
            <div className="space-y-2">
              <ToggleGroupControl
                value={horizontalPos || 'center'}
                options={HORIZONTAL_POSITION_OPTIONS}
                onChange={(v) => onChange('backgroundPosition', `${v} ${verticalPos || 'center'}`)}
              />
              <ToggleGroupControl
                value={verticalPos || 'center'}
                options={VERTICAL_POSITION_OPTIONS}
                onChange={(v) => onChange('backgroundPosition', `${horizontalPos || 'center'} ${v}`)}
              />
            </div>
          </PropertySection>

          <PropertySection label="Background Repeat">
            <SelectControl
              label="Repeat"
              value={currentStyles.backgroundRepeat as string}
              options={BACKGROUND_REPEAT_OPTIONS}
              onChange={(v) => onChange('backgroundRepeat', v)}
              placeholder="No Repeat"
            />
          </PropertySection>
        </>
      )}
    </>
  );
}


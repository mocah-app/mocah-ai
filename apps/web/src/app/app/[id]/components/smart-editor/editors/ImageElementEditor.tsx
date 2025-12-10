"use client";

import React, { useCallback } from "react";
import type { ElementData, ElementUpdates } from "@/lib/react-email";
import type { BrandColors } from "../EditorShell";
import { ImageSection, LayoutSection } from "../sections";
import { PropertySection, SelectControl, TextInputControl } from "../controls";

// ============================================================================
// Types & Constants
// ============================================================================

interface ImageElementEditorProps {
  elementData: ElementData;
  currentStyles: React.CSSProperties;
  onUpdate: (updates: ElementUpdates) => void;
  brandFont?: string | null;
  brandColors?: BrandColors;
}

const WIDTH_PRESETS = [
  { value: "auto", label: "Auto" },
  { value: "100%", label: "100%" },
  { value: "75%", label: "75%" },
  { value: "50%", label: "50%" },
  { value: "200px", label: "200px" },
  { value: "300px", label: "300px" },
  { value: "400px", label: "400px" },
  { value: "600px", label: "600px" },
];

// ============================================================================
// Component
// ============================================================================

export function ImageElementEditor({
  elementData,
  currentStyles,
  onUpdate,
}: ImageElementEditorProps) {
  const currentSrc = elementData.attributes?.src as string | undefined;
  const currentAlt = elementData.attributes?.alt as string | undefined;

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleImageSelect = useCallback(
    (url: string, width?: number, height?: number) => {
      const styleUpdates: Record<string, string> = {};
      
      // Only apply generated image dimensions if element doesn't already have them set
      // This preserves existing layout and prevents breaking the template
      const hasExistingWidth = currentStyles.width && currentStyles.width !== 'auto';
      const hasExistingHeight = currentStyles.height && currentStyles.height !== 'auto';
      
      if (width && !hasExistingWidth) {
        // Cap width at 600px (standard email width) to prevent layout breaks
        const cappedWidth = Math.min(width, 600);
        styleUpdates.width = `${cappedWidth}px`;
      }
      if (height && !hasExistingHeight) {
        styleUpdates.height = `${height}px`;
      }

      onUpdate({
        attributes: {
          src: url,
          alt: elementData.attributes?.alt || "Image",
        },
        ...(Object.keys(styleUpdates).length ? { styles: styleUpdates } : {}),
      });
    },
    [onUpdate, elementData.attributes?.alt, currentStyles.width, currentStyles.height]
  );

  const handleStyleChange = useCallback(
    (property: string, value: string) => {
      onUpdate({
        styles: { [property]: value },
      });
    },
    [onUpdate]
  );

  const handleSrcChange = useCallback(
    (value: string) => {
      onUpdate({
        attributes: { src: value },
      });
    },
    [onUpdate]
  );

  const handleAltChange = useCallback(
    (value: string) => {
      onUpdate({
        attributes: { alt: value },
      });
    },
    [onUpdate]
  );

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="space-y-0">
      {/* Image Upload Section */}
      <ImageSection
        src={currentSrc}
        alt={currentAlt}
        onImageSelect={handleImageSelect}
        onSrcChange={handleSrcChange}
        onAltChange={handleAltChange}
        showAltText={true}
        label="Image"
      />

      {/* Size Controls */}
      <PropertySection label="Size">
        <div className="grid grid-cols-2 gap-2">
          <SelectControl
            label="Width"
            value={currentStyles.width as string}
            options={WIDTH_PRESETS}
            onChange={(v) => handleStyleChange("width", v)}
            placeholder="Auto"
          />
          <TextInputControl
            label="Height"
            value={currentStyles.height as string}
            onChange={(v) => handleStyleChange("height", v)}
            placeholder="auto"
          />
        </div>
      </PropertySection>

      {/* Layout (margin) */}
      <LayoutSection
        margin={currentStyles.margin as string}
        onChange={handleStyleChange}
      />
    </div>
  );
}

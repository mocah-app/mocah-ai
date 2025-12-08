"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { ElementData, ElementUpdates } from "@/lib/react-email";
import type { BrandColors } from "../EditorShell";
import { LayoutSection } from "../sections";
import { PropertySection, SelectControl, TextInputControl } from "../controls";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, Upload } from "lucide-react";
import { useTemplate } from "../../providers/TemplateProvider";
import { useOrganization } from "@/contexts/organization-context";
import { trpc } from "@/utils/trpc";
import { useRouter, useSearchParams } from "next/navigation";
import { useImageStudio } from "../../image-studio/ImageStudioContext";
import { useImageUpload } from "../../image-studio/hooks";
import Loader from "@/components/loader";

// Check if URL is from an allowed domain for next/image optimization
function isAllowedImageDomain(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const allowedHosts = [
      "images.unsplash.com",
      "storage.mocah.ai",
      "fly.storage.tigris.dev",
    ];
    return allowedHosts.some((host) => parsedUrl.hostname === host);
  } catch {
    return false;
  }
}

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state: templateState } = useTemplate();
  const { activeOrganization } = useOrganization();
  const { setOnImageSelect, setInitialImageUrl } = useImageStudio();
  const templateId = templateState.currentTemplate?.id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentSrc = elementData.attributes?.src as string | undefined;

  // Library state
  const [libraryScope, setLibraryScope] = useState<"template" | "org">("template");

  const organizationId = useMemo(
    () =>
      templateState.currentTemplate?.organizationId || activeOrganization?.id,
    [templateState.currentTemplate?.organizationId, activeOrganization?.id]
  );

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleImageSelect = useCallback(
    (url: string, width?: number, height?: number) => {
      const styleUpdates: Record<string, string> = {};
      if (width) styleUpdates.width = `${width}px`;
      if (height) styleUpdates.height = `${height}px`;

      onUpdate({
        attributes: {
          src: url,
          alt: elementData.attributes?.alt || "Image",
        },
        ...(Object.keys(styleUpdates).length ? { styles: styleUpdates } : {}),
      });
    },
    [onUpdate, elementData.attributes?.alt]
  );

  // Presigned upload hook
  const { uploadFile, isUploading } = useImageUpload({
    organizationId,
    templateId,
    onSuccess: (image) => {
      handleImageSelect(image.url, image.width, image.height);
    },
  });

  // Fetch recent images
  const {
    data: recentImages,
    isLoading: imagesLoading,
    refetch: refetchImages,
  } = trpc.imageAsset.list.useQuery(
    libraryScope === "template" && templateId
      ? { templateId, limit: 12 }
      : { limit: 12 },
    {
      enabled: libraryScope === "org" ? !!organizationId : !!templateId,
    }
  );

  // Open Image Studio via URL param
  const handleOpenImageStudio = useCallback(() => {
    // Set the callback and initial image URL before opening
    setOnImageSelect(() => handleImageSelect);
    setInitialImageUrl(currentSrc);
    
    const params = new URLSearchParams(searchParams.toString());
    params.set("imageStudio", "open");
    router.push(`/app/${templateId}?${params.toString()}`, { scroll: false });
  }, [router, searchParams, templateId, setOnImageSelect, setInitialImageUrl, currentSrc, handleImageSelect]);

  const handleStyleChange = useCallback(
    (property: string, value: string) => {
      onUpdate({
        styles: { [property]: value },
      });
    },
    [onUpdate]
  );

  const handleAttributeChange = useCallback(
    (property: string, value: string) => {
      if (property === "src" || property === "alt") {
        onUpdate({
          attributes: { [property]: value },
        });
      } else {
        handleStyleChange(property, value);
      }
    },
    [onUpdate, handleStyleChange]
  );

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Use the presigned upload hook
      await uploadFile(file);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [uploadFile]
  );

  // ============================================================================
  // Render
  // ============================================================================

  const currentAlt = elementData.attributes?.alt as string | undefined;

  return (
    <div className="space-y-0">
      {/* Image Preview & URL */}
      <PropertySection label="Image">
        {/* Current Image Preview */}
        {currentSrc && (
          <div className="relative rounded-lg overflow-hidden border border-border bg-muted/50 mb-3 aspect-video">
            {isAllowedImageDomain(currentSrc) ? (
              <Image
                src={currentSrc}
                alt={currentAlt || "Image preview"}
                fill
                sizes="300px"
                className="object-contain"
              />
            ) : (
              // Fallback to img for external URLs not in allowed domains
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentSrc}
                alt={currentAlt || "Image preview"}
                className="w-full h-full object-contain"
              />
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader />
            ) : (
              <Upload className="size-3.5" />
            )}
            Upload
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={handleOpenImageStudio}
          >
            <Sparkles className="size-3.5 mr-1.5" />
            AI Generate
          </Button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* URL Input */}
        <TextInputControl
          label="Image URL"
          value={currentSrc}
          onChange={(v) => handleAttributeChange("src", v)}
          type="url"
          placeholder="https://example.com/image.jpg"
        />

        <TextInputControl
          label="Alt Text"
          value={currentAlt}
          onChange={(v) => handleAttributeChange("alt", v)}
          placeholder="Image description"
        />
      </PropertySection>

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

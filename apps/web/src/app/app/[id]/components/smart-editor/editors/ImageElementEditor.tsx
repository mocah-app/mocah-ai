"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ElementData, ElementUpdates } from "@/lib/react-email";
import type { BrandColors } from "../EditorShell";
import { LayoutSection } from "../sections";
import { PropertySection, SelectControl, TextInputControl } from "../controls";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Loader2,
  Sparkles,
  Upload,
  FolderOpen,
  Image as ImageIcon,
} from "lucide-react";
import { useTemplate } from "../../providers/TemplateProvider";
import { useOrganization } from "@/contexts/organization-context";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useImageStudio } from "../../image-studio/ImageStudioContext";
import Loader from "@/components/loader";

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

  // Upload state
  const [isUploading, setIsUploading] = useState(false);

  const organizationId = useMemo(
    () =>
      templateState.currentTemplate?.organizationId || activeOrganization?.id,
    [templateState.currentTemplate?.organizationId, activeOrganization?.id]
  );

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

  // Upload mutation
  const uploadMutation = trpc.storage.uploadImage.useMutation({
    onSuccess: (data: { url: string }) => {
      handleImageSelect(data.url);
      refetchImages();
      toast.success("Image uploaded successfully");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to upload image");
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

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

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }

      setIsUploading(true);

      // Convert to base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        uploadMutation.mutate({
          file: {
            name: file.name,
            type: file.type,
            size: file.size,
            base64Data: base64,
          },
          templateId,
        });
      };
      reader.onerror = () => {
        toast.error("Failed to read file");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [uploadMutation, templateId]
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
          <div className="relative rounded-lg overflow-hidden border border-border bg-muted/50 mb-3">
            <img
              src={currentSrc}
              alt={currentAlt || "Image preview"}
              className="w-full h-auto max-h-40 object-contain"
            />
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

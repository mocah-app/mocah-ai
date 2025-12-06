"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ElementData, ElementUpdates } from "@/lib/react-email";
import type { BrandColors } from "../EditorShell";
import { ImageSection, LayoutSection } from "../sections";
import { PropertySection, SelectControl, TextareaControl, TextInputControl } from "../controls";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { useTemplate } from "../../providers/TemplateProvider";
import { useOrganization } from "@/contexts/organization-context";
import { trpc } from "@/utils/trpc";

interface ImageElementEditorProps {
  elementData: ElementData;
  currentStyles: React.CSSProperties;
  onUpdate: (updates: ElementUpdates) => void;
  brandFont?: string | null;
  brandColors?: BrandColors;
}

/**
 * Editor for Img elements
 */
export function ImageElementEditor({
  elementData,
  currentStyles,
  onUpdate,
}: ImageElementEditorProps) {
  const { state: templateState } = useTemplate();
  const { activeOrganization } = useOrganization();
  const templateId = templateState.currentTemplate?.id;

  const [prompt, setPrompt] = useState("");
  const [referenceUrl, setReferenceUrl] = useState<string | undefined>(
    elementData.attributes?.src as string
  );
  const [aspectRatio, setAspectRatio] = useState<string | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [assetScope, setAssetScope] = useState<"template" | "org">("template");

  useEffect(() => {
    setReferenceUrl(elementData.attributes?.src as string);
  }, [elementData.attributes?.src]);

  const organizationId = useMemo(
    () =>
      templateState.currentTemplate?.organizationId || activeOrganization?.id,
    [templateState.currentTemplate?.organizationId, activeOrganization?.id]
  );

  const {
    data: assetData,
    isFetching: assetsLoading,
    refetch: refetchAssets,
  } = trpc.imageAsset.list.useQuery(
    assetScope === "template" && templateId
      ? { templateId, limit: 30 }
      : { limit: 30 },
    {
      enabled: assetScope === "org" ? !!organizationId : !!templateId,
    }
  );

  const handleGenerate = useCallback(
    async (mode: "generate" | "regenerate") => {
      if (!organizationId) {
        toast.error("Select an organization before generating images.");
        return;
      }

      if (!prompt.trim()) {
        toast.error("Add a prompt to generate an image.");
        return;
      }

      const useReference =
        mode === "regenerate" || (!!referenceUrl && referenceUrl.length > 0);

      if (useReference && !referenceUrl) {
        toast.error("Add a reference image URL to regenerate.");
        return;
      }

      const endpoint = useReference
        ? "/api/image/regenerate"
        : "/api/image/generate";

      const body: Record<string, unknown> = {
        prompt: prompt.trim(),
        organizationId,
        templateId: templateState.currentTemplate?.id,
        versionId: templateState.currentTemplate?.currentVersionId,
        ...(aspectRatio ? { aspectRatio } : {}),
      };

      if (useReference && referenceUrl) {
        body.imageUrls = [referenceUrl];
      }

      setIsGenerating(true);

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await response.json();
        if (!response.ok) {
          const message =
            typeof data?.error === "string"
              ? data.error
              : "Failed to generate image";
          throw new Error(message);
        }

        const first = data.images?.[0];
        if (!first?.url) {
          throw new Error("No image returned from Fal");
        }

        const styleUpdates: Record<string, string> = {};
        if (first.width) styleUpdates.width = `${first.width}px`;
        if (first.height) styleUpdates.height = `${first.height}px`;

        onUpdate({
          attributes: {
            src: first.url,
            alt: elementData.attributes?.alt || prompt.slice(0, 80),
          },
          ...(Object.keys(styleUpdates).length ? { styles: styleUpdates } : {}),
        });

        setReferenceUrl(first.url);
        refetchAssets();
        toast.success("Image updated");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to generate image";
        toast.error(message);
      } finally {
        setIsGenerating(false);
      }
    },
    [
      organizationId,
      prompt,
      referenceUrl,
      aspectRatio,
      templateState.currentTemplate?.id,
      templateState.currentTemplate?.currentVersionId,
      onUpdate,
      elementData.attributes?.alt,
      refetchAssets,
    ]
  );

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

      <PropertySection label="AI Image (Fal)">
        <TextareaControl
          label="Prompt"
          value={prompt}
          onChange={setPrompt}
          placeholder="Generate a hero image for this section..."
          rows={3}
        />

        <SelectControl
          label="Aspect Ratio"
          value={aspectRatio}
          options={[
            { value: "auto", label: "Auto" },
            { value: "16:9", label: "16:9" },
            { value: "4:3", label: "4:3" },
            { value: "1:1", label: "1:1" },
            { value: "9:16", label: "9:16" },
            { value: "3:4", label: "3:4" },
          ]}
          onChange={setAspectRatio}
          placeholder="Auto"
        />

        <TextInputControl
          label="Reference image (optional)"
          value={referenceUrl}
          onChange={setReferenceUrl}
          type="url"
          placeholder="Use current image or paste a reference URL"
        />

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => handleGenerate("generate")}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generate
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="flex-1"
            onClick={() => handleGenerate("regenerate")}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Regenerate
          </Button>
        </div>
      </PropertySection>

      <PropertySection label="Recent images">
        <div className="mb-2">
          <SelectControl
            label="Source"
            value={assetScope}
            options={[
              { value: "template", label: "This template" },
              { value: "org", label: "All org images" },
            ]}
            onChange={(value) =>
              setAssetScope(value as "template" | "org")
            }
          />
        </div>
        {assetsLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading images...
          </div>
        ) : assetData?.items?.length ? (
          <div className="grid grid-cols-3 gap-2">
            {assetData.items.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => {
                  onUpdate({
                    attributes: {
                      src: asset.url,
                      alt: elementData.attributes?.alt || prompt.slice(0, 80),
                    },
                  });
                  setReferenceUrl(asset.url);
                }}
                className="group relative rounded-md border border-border overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <img
                  src={asset.url}
                  alt={asset.id}
                  className="h-24 w-full object-cover transition-transform group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Generated images will appear here.
          </p>
        )}
      </PropertySection>
    </div>
  );
}


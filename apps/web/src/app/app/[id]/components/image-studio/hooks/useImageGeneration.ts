"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  GeneratedImage,
  ImageGenerationInput,
  ImageGenerationResponse,
} from "@mocah/shared";

// ============================================================================
// Types
// ============================================================================

interface UseImageGenerationOptions {
  organizationId: string | undefined;
  templateId: string | undefined;
  versionId?: string | null | undefined;
  onSuccess?: (images: GeneratedImage[]) => void;
  onError?: (error: Error) => void;
}

interface UseImageGenerationReturn {
  generate: (params: GenerateParams) => Promise<GeneratedImage[] | null>;
  cancel: () => void;
  isGenerating: boolean;
  error: string | null;
}

interface GenerateParams {
  prompt: string;
  model?: string;
  aspectRatio?: string;
  outputFormat?: string;
  imageUrls?: string[];
  numImages?: number;
  includeBrandGuide?: boolean;
}

// ============================================================================
// Hook
// ============================================================================

export function useImageGeneration({
  organizationId,
  templateId,
  versionId,
  onSuccess,
  onError,
}: UseImageGenerationOptions): UseImageGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
      toast.info("Image generation cancelled");
    }
  }, []);

  const generate = useCallback(
    async (params: GenerateParams): Promise<GeneratedImage[] | null> => {
      if (!organizationId) {
        const errorMsg = "Select an organization before generating images.";
        toast.error(errorMsg);
        onError?.(new Error(errorMsg));
        return null;
      }

      if (!params.prompt?.trim()) {
        const errorMsg = "Please enter a prompt to generate an image.";
        toast.error(errorMsg);
        onError?.(new Error(errorMsg));
        return null;
      }

      // Cancel any pending request
      cancel();

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      setIsGenerating(true);
      setError(null);

      try {
        const body: ImageGenerationInput = {
          prompt: params.prompt.trim(),
          organizationId,
          templateId,
          versionId: versionId ?? undefined,
          aspectRatio:
            params.aspectRatio && params.aspectRatio !== "auto"
              ? (params.aspectRatio as ImageGenerationInput["aspectRatio"])
              : undefined,
          outputFormat: params.outputFormat as
            | "png"
            | "jpeg"
            | "webp"
            | undefined,
          numImages: params.numImages ?? 1,
          includeBrandGuide: params.includeBrandGuide,
        };

        // Only pass model if explicitly selected (not "auto")
        if (params.model && params.model !== "__auto__") {
          body.model = params.model;
        }

        // Add reference images if provided
        if (params.imageUrls && params.imageUrls.length > 0) {
          body.imageUrls = params.imageUrls;
        }

        const response = await fetch("/api/image/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.error || `Failed to generate image (${response.status})`);
        }

        const data: ImageGenerationResponse = await response.json();

        if (!data.images || data.images.length === 0) {
          throw new Error("No images generated");
        }

        const generatedImages: GeneratedImage[] = data.images.map((img) => ({
          id: img.id,
          url: img.url,
          width: img.width ?? undefined,
          height: img.height ?? undefined,
        }));

        const countMsg =
          generatedImages.length > 1
            ? `${generatedImages.length} images generated successfully!`
            : "Image generated successfully!";
        toast.success(countMsg);

        onSuccess?.(generatedImages);
        return generatedImages;
      } catch (err) {
        // Don't show error for aborted requests
        if (err instanceof Error && err.name === "AbortError") {
          return null;
        }

        const errorMsg =
          err instanceof Error ? err.message : "Failed to generate image";
        setError(errorMsg);
        toast.error(errorMsg);
        onError?.(err instanceof Error ? err : new Error(errorMsg));
        return null;
      } finally {
        setIsGenerating(false);
        abortControllerRef.current = null;
      }
    },
    [organizationId, templateId, versionId, cancel, onSuccess, onError]
  );

  return {
    generate,
    cancel,
    isGenerating,
    error,
  };
}

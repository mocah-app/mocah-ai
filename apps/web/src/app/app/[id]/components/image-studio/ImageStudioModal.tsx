"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, X } from "lucide-react";
import { useTemplate } from "../providers/TemplateProvider";
import { useOrganization } from "@/contexts/organization-context";
import { trpc } from "@/utils/trpc";
import { useRouter, useSearchParams } from "next/navigation";
import { useImageStudio } from "./ImageStudioContext";
import { ImageStudioControls } from "./ImageStudioControls";
import { ImageStudioPreview } from "./ImageStudioPreview";
import {
  MODEL_AUTO,
  isWebpUnsupported,
  uploadFileSchema,
  type GeneratedImage,
} from "./types";

// ============================================================================
// Component
// ============================================================================

export function ImageStudioModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state: templateState } = useTemplate();
  const { activeOrganization } = useOrganization();
  const {
    onImageSelect,
    initialImageUrl,
    setOnImageSelect,
    setInitialImageUrl,
    initialPrompt,
    setInitialPrompt,
    initialReferenceImageUrl,
    setInitialReferenceImageUrl,
  } = useImageStudio();

  const isOpen = searchParams.get("imageStudio") === "open";

  // ============================================================================
  // State
  // ============================================================================

  // Generation settings
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<string>(MODEL_AUTO);
  const [aspectRatio, setAspectRatio] = useState<string>("auto");
  const [outputFormat, setOutputFormat] = useState<string>("png");
  const [isCopied, setIsCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Reference images
  const [useReferenceImages, setUseReferenceImages] = useState(false);
  const [referenceImageUrls, setReferenceImageUrls] = useState("");
  const [referenceImages, setReferenceImages] = useState<string[]>(
    initialImageUrl ? [initialImageUrl] : []
  );

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(
    null
  );
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  // Upload state
  const [isUploading, setIsUploading] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<string>("generate");

  const organizationId =
    templateState.currentTemplate?.organizationId || activeOrganization?.id;
  const templateId = templateState.currentTemplate?.id;

  // ============================================================================
  // Effects
  // ============================================================================

  // Close modal handler
  const handleClose = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("imageStudio");
    router.replace(
      `/app/${templateState.currentTemplate?.id || ""}?${params.toString()}`,
      { scroll: false }
    );
  }, [router, searchParams, templateState.currentTemplate?.id]);

  // Clear callback when modal closes
  useEffect(() => {
    if (!isOpen) {
      setOnImageSelect(null);
      setInitialImageUrl(undefined);
      setInitialPrompt(undefined);
      setInitialReferenceImageUrl(undefined);
    }
  }, [
    isOpen,
    setOnImageSelect,
    setInitialImageUrl,
    setInitialPrompt,
    setInitialReferenceImageUrl,
  ]);

  // Initialize prompt and reference images from context when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialPrompt) {
        setPrompt(initialPrompt);
      }
      if (initialReferenceImageUrl) {
        setReferenceImageUrls(initialReferenceImageUrl);
        setReferenceImages([initialReferenceImageUrl]);
        setUseReferenceImages(true);
        setSelectedImage({
          id: "initial-reference",
          url: initialReferenceImageUrl,
        });
      } else if (initialImageUrl) {
        setReferenceImageUrls(initialImageUrl);
        setReferenceImages([initialImageUrl]);
        setUseReferenceImages(true);
        setSelectedImage({
          id: "initial",
          url: initialImageUrl,
        });
      }
    }
  }, [isOpen, initialPrompt, initialReferenceImageUrl, initialImageUrl]);

  // Auto-switch to png if model doesn't support webp
  useEffect(() => {
    if (isWebpUnsupported(model) && outputFormat === "webp") {
      setOutputFormat("png");
    }
  }, [model, outputFormat]);

  // Reset isCopied and zoom when selectedImage changes
  useEffect(() => {
    setIsCopied(false);
    setZoomLevel(100);
  }, [selectedImage?.id]);

  // Reset isCopied after 2 seconds
  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  // ============================================================================
  // Upload Mutation
  // ============================================================================

  const uploadMutation = trpc.storage.uploadImage.useMutation({
    onSuccess: (data) => {
      const newImage: GeneratedImage = {
        id: data.id,
        url: data.url,
      };
      setLoadingImages((prev) => new Set(prev).add(newImage.id));
      setGeneratedImages((prev) => [newImage, ...prev]);
      setSelectedImage(newImage);
      toast.success("Image uploaded successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload image");
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleGenerate = useCallback(async () => {
    if (!organizationId) {
      toast.error("Select an organization before generating images.");
      return;
    }

    setIsGenerating(true);
    setSelectedImage(null);

    try {
      const body: Record<string, unknown> = {
        prompt: prompt.trim(),
        organizationId,
        templateId: templateState.currentTemplate?.id,
        versionId: templateState.currentTemplate?.currentVersionId,
        aspectRatio: aspectRatio !== "auto" ? aspectRatio : undefined,
        outputFormat,
        numImages: 1,
      };

      // Only pass model if explicitly selected (not "auto")
      if (model && model !== MODEL_AUTO) {
        body.model = model;
      }

      // Add reference images if enabled and provided
      if (useReferenceImages && referenceImages.length > 0) {
        body.imageUrls = referenceImages;
      }

      const response = await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate image");
      }

      const newImages: GeneratedImage[] = (data.images || []).map(
        (img: any) => ({
          id: img.id || crypto.randomUUID(),
          url: img.url,
          width: img.width,
          height: img.height,
        })
      );

      if (newImages.length === 0) {
        throw new Error("No images generated");
      }

      // Mark new images as loading
      setLoadingImages((prev) => {
        const next = new Set(prev);
        newImages.forEach((img) => next.add(img.id));
        return next;
      });

      setGeneratedImages((prev) => [...newImages, ...prev]);
      setSelectedImage(newImages[0]);
      toast.success(
        `${newImages.length} image${newImages.length > 1 ? "s" : ""} generated successfully!`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate image";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  }, [
    organizationId,
    prompt,
    model,
    aspectRatio,
    outputFormat,
    useReferenceImages,
    referenceImages,
    templateState.currentTemplate?.id,
    templateState.currentTemplate?.currentVersionId,
  ]);

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!organizationId) {
        toast.error("Select an organization before uploading images.");
        return;
      }

      // Validate with Zod
      const result = uploadFileSchema.safeParse({ file });
      if (!result.success) {
        toast.error(result.error.issues[0]?.message || "Invalid file");
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
    },
    [organizationId, templateId, uploadMutation]
  );

  const handleCopyImageUrl = useCallback(() => {
    if (!selectedImage) return;
    navigator.clipboard.writeText(selectedImage.url);
    setIsCopied(true);
    toast.success("Image URL copied to clipboard");
  }, [selectedImage]);

  const handleUseAsReference = useCallback((url: string) => {
    setUseReferenceImages(true);
    setReferenceImageUrls(url);
    setReferenceImages([url]);
    setActiveTab("generate");
  }, []);

  const handleUseImage = useCallback(() => {
    if (!selectedImage) {
      toast.error("Please select an image first");
      return;
    }
    if (onImageSelect) {
      onImageSelect(
        selectedImage.url,
        selectedImage.width,
        selectedImage.height
      );
    }
    handleClose();
  }, [selectedImage, onImageSelect, handleClose]);

  const handleImageLoad = useCallback((id: string) => {
    setLoadingImages((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleImageLoadStart = useCallback((id: string) => {
    setLoadingImages((prev) => new Set(prev).add(id));
  }, []);

  const handleImageError = useCallback((id: string) => {
    setLoadingImages((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="sm:max-w-full rounded-none h-dvh p-0 gap-0 flex flex-col"
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="px-4 py-1 border-b flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <Sparkles className="size-4 text-primary" />
            <div>
              <DialogTitle className="text-base font-medium">
                Image Studio
              </DialogTitle>
              <DialogDescription className="sr-only">
                Generate AI images for your email template
              </DialogDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="size-4" />
          </Button>
        </DialogHeader>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Controls */}
          <ImageStudioControls
            prompt={prompt}
            setPrompt={setPrompt}
            model={model}
            setModel={setModel}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            outputFormat={outputFormat}
            setOutputFormat={setOutputFormat}
            useReferenceImages={useReferenceImages}
            setUseReferenceImages={setUseReferenceImages}
            referenceImageUrls={referenceImageUrls}
            setReferenceImageUrls={setReferenceImageUrls}
            referenceImages={referenceImages}
            setReferenceImages={setReferenceImages}
            onGenerate={handleGenerate}
            onFileUpload={handleFileUpload}
            isGenerating={isGenerating}
            isUploading={isUploading}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />

          {/* Right Panel - Preview & Results */}
          <ImageStudioPreview
            selectedImage={selectedImage}
            generatedImages={generatedImages}
            loadingImages={loadingImages}
            isGenerating={isGenerating}
            isCopied={isCopied}
            zoomLevel={zoomLevel}
            onZoomLevelChange={setZoomLevel}
            onSelectImage={setSelectedImage}
            onUseAsReference={handleUseAsReference}
            onUseImage={handleUseImage}
            onCopyImageUrl={handleCopyImageUrl}
            onClearImages={() => setGeneratedImages([])}
            onImageLoad={handleImageLoad}
            onImageLoadStart={handleImageLoadStart}
            onImageError={handleImageError}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

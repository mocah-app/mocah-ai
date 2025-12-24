"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { UsageWarningBanner } from "@/components/billing/usage-warning-banner";
import { useTemplate } from "../providers/TemplateProvider";
import { useOrganization } from "@/contexts/organization-context";
import { useUpgradeModal } from "@/contexts/upgrade-modal-context";
import { useUsageTracking } from "@/hooks/use-usage-tracking";
import { useRouter, useSearchParams } from "next/navigation";
import { useImageStudio } from "./ImageStudioContext";
import { ImageStudioControls } from "./ImageStudioControls";
import { ImageStudioPreview } from "./ImageStudioPreview";
import { useImageUpload, useImageGeneration } from "./hooks";
import {
  MODEL_AUTO,
  isWebpUnsupported,
  uploadFileSchema,
  type GeneratedImage,
} from "./types";
import { trpc } from "@/utils/trpc";

// ============================================================================
// Component
// ============================================================================

export function ImageStudioModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state: templateState } = useTemplate();
  const { activeOrganization } = useOrganization();
  const { triggerUpgrade } = useUpgradeModal();
  const { checkQuota, isNearLimit, getUsagePercentage, plan, usage } =
    useUsageTracking();
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

  // Check if user is near or at image limit
  const isNearImageLimit = isNearLimit("image");
  const imageUsagePercentage = getUsagePercentage("image");
  const canGenerateImage = checkQuota("image");

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
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(
    null
  );
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  // Tab state
  const [activeTab, setActiveTab] = useState<string>("generate");

  // Brand awareness state
  const [includeBrandGuide, setIncludeBrandGuide] = useState(true);

  const organizationId =
    templateState.currentTemplate?.organizationId || activeOrganization?.id;
  const templateId = templateState.currentTemplate?.id;
  const versionId = templateState.currentTemplate?.currentVersionId;

  // Fetch brand guide preference
  const { data: brandGuidePreference } = trpc.brandGuide.getPreference.useQuery(
    undefined,
    {
      enabled: isOpen,
    }
  );

  // Upload hook (presigned URL flow)
  const { uploadFile, isUploading } = useImageUpload({
    organizationId,
    templateId,
    versionId,
    onSuccess: (image) => {
      setLoadingImages((prev) => new Set(prev).add(image.id));
      setGeneratedImages((prev) => [image, ...prev]);
      setSelectedImage(image);
    },
  });

  // Generation hook (with cancellation support)
  const {
    generate,
    cancel: cancelGeneration,
    isGenerating,
  } = useImageGeneration({
    organizationId,
    templateId,
    versionId,
    onSuccess: (images) => {
      // Mark new images as loading
      setLoadingImages((prev) => {
        const next = new Set(prev);
        images.forEach((img) => next.add(img.id));
        return next;
      });
      setGeneratedImages((prev) => [...images, ...prev]);
      setSelectedImage(images[0] ?? null);
    },
  });

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

  // Clear callback and cancel pending requests when modal closes
  useEffect(() => {
    if (!isOpen) {
      setOnImageSelect(null);
      setInitialImageUrl(undefined);
      setInitialPrompt(undefined);
      setInitialReferenceImageUrl(undefined);
      // Cancel any in-flight generation
      cancelGeneration();
    }
  }, [
    isOpen,
    setOnImageSelect,
    setInitialImageUrl,
    setInitialPrompt,
    setInitialReferenceImageUrl,
    cancelGeneration,
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

  // Update brand guide preference when fetched
  useEffect(() => {
    if (brandGuidePreference !== undefined) {
      setIncludeBrandGuide(brandGuidePreference);
    }
  }, [brandGuidePreference]);

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
  // Handlers
  // ============================================================================

  const handleGenerate = useCallback(async () => {
    // Check usage quota before generating
    if (!canGenerateImage) {
      triggerUpgrade("image", plan?.name);
      return;
    }

    setSelectedImage(null);

    await generate({
      prompt,
      model,
      aspectRatio,
      outputFormat,
      imageUrls:
        useReferenceImages && referenceImages.length > 0
          ? referenceImages
          : undefined,
      numImages: 1,
      includeBrandGuide,
    });
  }, [
    canGenerateImage,
    triggerUpgrade,
    plan?.name,
    generate,
    prompt,
    model,
    aspectRatio,
    outputFormat,
    useReferenceImages,
    referenceImages,
    includeBrandGuide,
  ]);

  const handleFileUpload = useCallback(
    async (file: File) => {
      // Validate with Zod
      const result = uploadFileSchema.safeParse({ file });
      if (!result.success) {
        toast.error(result.error.issues[0]?.message || "Invalid file");
        return;
      }

      // Use the presigned upload hook
      await uploadFile(file);
    },
    [uploadFile]
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

  const handleClearImages = useCallback(() => {
    setGeneratedImages([]);
    setSelectedImage(null);
  }, []);

  // Memoize control props to prevent unnecessary re-renders
  const controlProps = useMemo(
    () => ({
      prompt,
      setPrompt,
      model,
      setModel,
      aspectRatio,
      setAspectRatio,
      outputFormat,
      setOutputFormat,
      useReferenceImages,
      setUseReferenceImages,
      referenceImageUrls,
      setReferenceImageUrls,
      referenceImages,
      setReferenceImages,
      includeBrandGuide,
      onBrandGuideChange: setIncludeBrandGuide,
      onGenerate: handleGenerate,
      onFileUpload: handleFileUpload,
      isGenerating,
      isUploading,
      activeTab,
      setActiveTab,
    }),
    [
      prompt,
      model,
      aspectRatio,
      outputFormat,
      useReferenceImages,
      referenceImageUrls,
      referenceImages,
      includeBrandGuide,
      handleGenerate,
      handleFileUpload,
      isGenerating,
      isUploading,
      activeTab,
    ]
  );

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
          <ImageStudioControls {...controlProps} />

          <div className="flex-1 flex flex-col gap-2">
            {/* Usage Warning Banner */}
            <div className="flex justify-center h-auto">
            <UsageWarningBanner
              type="image"
              percentage={imageUsagePercentage}
              remaining={usage?.imagesRemaining}
              variant="alert"
              className="mx-4 mt-2"
              />
              </div>
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
              onClearImages={handleClearImages}
              onImageLoad={handleImageLoad}
              onImageLoadStart={handleImageLoadStart}
              onImageError={handleImageError}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

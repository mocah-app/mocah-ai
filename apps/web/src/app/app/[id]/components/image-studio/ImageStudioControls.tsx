"use client";

import React, { memo, useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Upload, Trash2, Plus, ImageIcon, X, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import Loader from "@/components/loader";
import {
  ASPECT_RATIOS,
  OUTPUT_FORMATS,
  AI_MODELS,
  PROMPT_TEMPLATES,
  MODEL_AUTO,
  isWebpUnsupported,
  isEditModel,
  requiresReferenceImages,
  generateFormSchema,
  type GenerateFormErrors,
} from "./types";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

// ============================================================================
// Types
// ============================================================================

interface ImageStudioControlsProps {
  // Form state
  prompt: string;
  setPrompt: (value: string) => void;
  model: string;
  setModel: (value: string) => void;
  aspectRatio: string;
  setAspectRatio: (value: string) => void;
  outputFormat: string;
  setOutputFormat: (value: string) => void;
  useReferenceImages: boolean;
  setUseReferenceImages: (value: boolean) => void;
  referenceImageUrls: string;
  setReferenceImageUrls: (value: string) => void;
  referenceImages: string[];
  setReferenceImages: React.Dispatch<React.SetStateAction<string[]>>;
  includeBrandGuide: boolean;
  onBrandGuideChange: (include: boolean) => void;
  // Actions
  onGenerate: () => void;
  onFileUpload: (file: File) => void;
  // State
  isGenerating: boolean;
  isUploading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export const ImageStudioControls = memo(function ImageStudioControls({
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
  onBrandGuideChange,
  onGenerate,
  onFileUpload,
  isGenerating,
  isUploading,
  activeTab,
  setActiveTab,
}: ImageStudioControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [formErrors, setFormErrors] = useState<GenerateFormErrors>({});
  const [newReferenceUrl, setNewReferenceUrl] = useState("");

  // Filter models based on reference images toggle
  const availableModels = useReferenceImages
    ? AI_MODELS.filter((m) => isEditModel(m.value))
    : AI_MODELS;

  // Brand guide preference mutation
  const utils = trpc.useUtils();
  const updatePreferenceMutation = trpc.brandGuide.setPreference.useMutation({
    onSuccess: () => {
      utils.brandGuide.getPreference.invalidate();
    },
  });

  // ============================================================================
  // Handlers
  // ============================================================================

  const isValidUrl = useCallback((url: string) => {
    return url.startsWith("http://") || url.startsWith("https://");
  }, []);

  const syncReferenceImageUrls = useCallback(
    (urls: string[]) => {
      setReferenceImageUrls(urls.join("\n"));
      setReferenceImages(urls);
    },
    [setReferenceImageUrls, setReferenceImages]
  );

  const handleAddReferenceUrl = useCallback(() => {
    const trimmed = newReferenceUrl.trim();
    if (!trimmed) return;

    if (!isValidUrl(trimmed)) {
      setFormErrors((prev) => ({
        ...prev,
        referenceImageUrls: "Please enter a valid URL (http:// or https://)",
      }));
      return;
    }

    if (referenceImages.includes(trimmed)) {
      setFormErrors((prev) => ({
        ...prev,
        referenceImageUrls: "This URL already exists",
      }));
      return;
    }

    if (referenceImages.length >= 4) {
      setFormErrors((prev) => ({
        ...prev,
        referenceImageUrls: "Maximum 4 reference images allowed",
      }));
      return;
    }

    const updatedUrls = [...referenceImages, trimmed];
    syncReferenceImageUrls(updatedUrls);
    setNewReferenceUrl("");
    setFormErrors((prev) => ({ ...prev, referenceImageUrls: undefined }));
  }, [newReferenceUrl, referenceImages, isValidUrl, syncReferenceImageUrls]);

  const handleUpdateReferenceUrl = useCallback(
    (index: number, value: string) => {
      const trimmed = value.trim();

      // If empty, remove the URL
      if (!trimmed) {
        const updatedUrls = referenceImages.filter((_, i) => i !== index);
        syncReferenceImageUrls(updatedUrls);
        return;
      }

      if (!isValidUrl(trimmed)) {
        setFormErrors((prev) => ({
          ...prev,
          referenceImageUrls: "Please enter a valid URL (http:// or https://)",
        }));
        return;
      }

      // Check for duplicates (excluding current index)
      if (
        referenceImages.includes(trimmed) &&
        referenceImages.indexOf(trimmed) !== index
      ) {
        setFormErrors((prev) => ({
          ...prev,
          referenceImageUrls: "This URL already exists",
        }));
        return;
      }

      const updatedUrls = [...referenceImages];
      updatedUrls[index] = trimmed;
      syncReferenceImageUrls(updatedUrls);
      setFormErrors((prev) => ({ ...prev, referenceImageUrls: undefined }));
    },
    [referenceImages, isValidUrl, syncReferenceImageUrls]
  );

  const handleKeyDownReferenceUrl = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddReferenceUrl();
      }
    },
    [handleAddReferenceUrl]
  );

  const handleRemoveReferenceImage = useCallback(
    (url: string) => {
      const updatedUrls = referenceImages.filter((u) => u !== url);
      syncReferenceImageUrls(updatedUrls);
    },
    [referenceImages, syncReferenceImageUrls]
  );

  const handleUseReferenceImagesChange = useCallback(
    (checked: boolean) => {
      setUseReferenceImages(checked);
      // Clear error when toggling off
      if (!checked) {
        setFormErrors((prev) => ({ ...prev, referenceImageUrls: undefined }));
        // If turning off and current model requires reference images, switch to Auto
        if (requiresReferenceImages(model)) {
          setModel(MODEL_AUTO);
        }
      }
      if (checked) {
        // If enabling reference images and current model is not an edit model (and not auto), switch to first edit model
        const currentIsEdit =
          model === MODEL_AUTO ||
          model.includes("/edit") ||
          model.includes("/image-to-image");
        if (!currentIsEdit) {
          const firstEditModel = AI_MODELS.find(
            (m) =>
              m.value.includes("/edit") || m.value.includes("/image-to-image")
          );
          if (firstEditModel) {
            setModel(firstEditModel.value);
          }
        }
      }
    },
    [model, setModel, setUseReferenceImages]
  );

  const handleModelChange = useCallback(
    (newModel: string) => {
      setModel(newModel);
      // Auto-enable reference images when selecting an edit model
      if (requiresReferenceImages(newModel) && !useReferenceImages) {
        setUseReferenceImages(true);
      }
    },
    [setModel, useReferenceImages, setUseReferenceImages]
  );

  const handleApplyTemplate = useCallback(
    (template: string) => {
      setPrompt(template);
      // Clear prompt error when applying template
      if (formErrors.prompt) {
        setFormErrors((prev) => ({ ...prev, prompt: undefined }));
      }
    },
    [setPrompt, formErrors.prompt]
  );

  const handlePromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setPrompt(e.target.value);
      // Clear prompt error when user starts typing
      if (formErrors.prompt) {
        setFormErrors((prev) => ({ ...prev, prompt: undefined }));
      }
    },
    [setPrompt, formErrors.prompt]
  );

  const handleBrandGuideToggle = useCallback(
    (checked: boolean) => {
      // Optimistically update UI
      onBrandGuideChange(checked);

      // Save preference to backend
      const promise = updatePreferenceMutation.mutateAsync({
        includeBrandGuide: checked,
      });

      toast.promise(promise, {
        loading: checked ? "Enabling brand guide..." : "Disabling brand guide...",
        success: checked ? "Brand guide enabled" : "Brand guide disabled",
        error: (error) =>
          `Failed to update preference: ${error.message || "Unknown error"}`,
      });
    },
    [onBrandGuideChange, updatePreferenceMutation]
  );

  const handleGenerateClick = useCallback(() => {
    // Validate form with Zod before submitting
    const result = generateFormSchema.safeParse({
      prompt,
      model,
      aspectRatio,
      outputFormat,
      useReferenceImages,
      referenceImageUrls,
    });

    if (!result.success) {
      const errors: GenerateFormErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof GenerateFormErrors;
        if (field === "prompt" || field === "referenceImageUrls") {
          errors[field] = issue.message;
        }
      });
      setFormErrors(errors);
      return;
    }

    // Clear errors and proceed
    setFormErrors({});
    onGenerate();
  }, [
    prompt,
    model,
    aspectRatio,
    outputFormat,
    useReferenceImages,
    referenceImageUrls,
    onGenerate,
  ]);

  // File upload handlers
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileUpload(file);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [onFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        onFileUpload(file);
      }
    },
    [onFileUpload]
  );

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="w-[280px] border-r flex flex-col overflow-hidden relative">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col flex-1 min-h-0 relative"
      >
        <TabsList className="mx-4 mt-4 w-auto shrink-0">
          <TabsTrigger value="generate" className="flex-1">
            <Sparkles className="size-3.5 mr-1.5" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex-1">
            <Upload className="size-3.5 mr-1.5" />
            Upload
          </TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent
          value="generate"
          className="flex-1 overflow-y-auto p-4 space-y-5 m-0 min-h-0"
        >
          {/* Prompt */}
          <div className="space-y-2 pt-2">
            <Label className="text-xs font-medium">Describe your image</Label>
            <Textarea
              value={prompt}
              onChange={handlePromptChange}
              placeholder="A professional product photo of elegant..."
              className={cn(
                "min-h-[100px] max-h-[200px] text-sm bg-muted/50 border-border",
                formErrors.prompt && "border-destructive focus-visible:ring-destructive"
              )}
            />
            {formErrors.prompt && (
              <p className="text-xs text-destructive">{formErrors.prompt}</p>
            )}
            {/* Quick Templates */}
            <div
              className="flex overflow-x-auto gap-1.5"
              style={{ scrollbarWidth: "none" }}
            >
              {PROMPT_TEMPLATES.map((template) => (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  key={template.label}
                  onClick={() => handleApplyTemplate(template.prompt)}
                >
                  {template.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Brand Awareness */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-muted-foreground" />
                <Label className="text-xs font-medium">Include Brand Guide</Label>
              </div>
              <Switch
                checked={includeBrandGuide}
                onCheckedChange={handleBrandGuideToggle}
                disabled={updatePreferenceMutation.isPending}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Use your brand colors, fonts, and style in generated images
            </p>
          </div>

          {/* Reference Images */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">
                Reference Images
                {requiresReferenceImages(model) && (
                  <span className="text-destructive ml-1">(required)</span>
                )}
              </Label>
              <Switch
                checked={useReferenceImages}
                onCheckedChange={handleUseReferenceImagesChange}
              />
            </div>
            {useReferenceImages && (
              <div className="space-y-2">
                {/* Add URL Input */}
                <div className="flex gap-1.5">
                  <Input
                    value={newReferenceUrl}
                    onChange={(e) => {
                      setNewReferenceUrl(e.target.value);
                      if (formErrors.referenceImageUrls) {
                        setFormErrors((prev) => ({ ...prev, referenceImageUrls: undefined }));
                      }
                    }}
                    onKeyDown={handleKeyDownReferenceUrl}
                    placeholder="https://example.com/image.jpg"
                    disabled={referenceImages.length >= 4}
                    className={cn(
                      "flex-1 h-8 text-xs",
                      (formErrors.referenceImageUrls ||
                        (requiresReferenceImages(model) && referenceImages.length === 0)) &&
                        "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleAddReferenceUrl}
                    disabled={!newReferenceUrl.trim() || referenceImages.length >= 4}
                    className="h-8 px-2"
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </div>
                {formErrors.referenceImageUrls && (
                  <p className="text-xs text-destructive">
                    {formErrors.referenceImageUrls}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  {referenceImages.length}/4 URLs • Press Enter to add
                </p>

                {/* URL List with Previews */}
                {referenceImages.length > 0 && (
                  <div className="space-y-2">
                    {referenceImages.map((url, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="relative size-8 rounded overflow-hidden border border-border shrink-0 bg-muted">
                          <img
                            src={url}
                            alt={`Reference ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              e.currentTarget.nextElementSibling?.classList.remove("hidden");
                            }}
                          />
                          <ImageIcon className="hidden size-4 absolute inset-0 m-auto text-muted-foreground" />
                        </div>
                        <Input
                          value={url}
                          onChange={(e) => {
                            const updatedUrls = [...referenceImages];
                            updatedUrls[index] = e.target.value;
                            setReferenceImages(updatedUrls);
                          }}
                          onBlur={(e) => handleUpdateReferenceUrl(index, e.target.value)}
                          className="flex-1 h-8 text-xs"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveReferenceImage(url)}
                          className="size-8 shrink-0"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Model</Label>
            <Select value={model} onValueChange={handleModelChange}>
              <SelectTrigger className="h-9 w-full text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((m) => (
                  <SelectItem
                    key={m.value}
                    value={m.value}
                    displayValue={m.label}
                    className="flex flex-col items-start gap-0.5"
                  >
                    <span className="text-[10px] text-muted-foreground">
                      {m.description}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Aspect Ratio</Label>
            <Select value={aspectRatio} onValueChange={setAspectRatio}>
              <SelectTrigger className="h-9 w-full text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASPECT_RATIOS.map((ar) => (
                  <SelectItem key={ar.value} value={ar.value}>
                    {ar.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Output Format */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Output Format</Label>
            <Select value={outputFormat} onValueChange={setOutputFormat}>
              <SelectTrigger className="h-9 w-full text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OUTPUT_FORMATS.filter(
                  (f) => !(isWebpUnsupported(model) && f.value === "webp")
                ).map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent
          value="upload"
          className="flex-1 overflow-y-auto p-4 m-0 min-h-0"
        >
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "bg-dot flex flex-col items-center justify-center text-center border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/50"
            )}
          >
            {isUploading ? (
              <>
                <Loader2 className="size-10 text-primary mb-4 animate-spin" />
                <p className="text-sm font-medium mb-1">Uploading...</p>
                <p className="text-xs text-muted-foreground">
                  Please wait while your image is being uploaded
                </p>
              </>
            ) : (
              <>
                <Upload className="size-10 text-muted-foreground mb-4" />
                <p className="text-sm font-medium mb-1">Upload an image</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Drag and drop or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, WebP up to 5MB
                </p>
              </>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </TabsContent>
      </Tabs>

      {/* Generate Button */}
      <div className="p-4 border-t bg-background shrink-0">
        <Button
          className="w-full relative overflow-hidden"
          size="lg"
          onClick={handleGenerateClick}
          disabled={isGenerating || !prompt.trim()}
        >
          {isGenerating ? (
            <>
              <Loader />
              Generating...
              <div className="absolute inset-0 w-full h-12 bg-primary/10 -z-10 animate-pulse" />
            </>
          ) : (
            <>
              <Sparkles className="size-4 mr-2" />
              Generate Image
            </>
          )}
        </Button>
      </div>
    </div>
  );
});

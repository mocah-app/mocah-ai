"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Calendar,
  Check,
  ChevronDown,
  Copy,
  Download,
  ImageIcon,
  Maximize2,
  Minus,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useImageStudio } from "../image-studio/ImageStudioContext";
import { useTemplate } from "../providers/TemplateProvider";
import { Input } from "@/components/ui/input";

// ============================================================================
// Types
// ============================================================================

export type PreviewImageAsset = {
  id: string;
  url: string;
  prompt?: string | null;
  model?: string | null;
  width?: number | null;
  height?: number | null;
  aspectRatio?: string | null;
  contentType?: string | null;
  blurDataUrl?: string | null;
  createdAt: Date | string;
};

interface ImagePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: PreviewImageAsset[];
  initialImageId?: string;
  onCopyUrl?: (url: string) => void;
}

type ImageNodeData = {
  url: string;
  alt: string;
  width?: number | null;
  height?: number | null;
};

// ============================================================================
// Image Node Component for ReactFlow
// ============================================================================

const ImageNode = memo(({ data }: NodeProps<Node<ImageNodeData>>) => {
  // Brand kit images already use regular img tags in the canvas
  return (
    <div className="rounded-lg overflow-hidden shadow-2xl">
      <img
        src={data.url}
        alt={data.alt}
        className="block"
        style={{
          width: data.width || "auto",
          height: data.height || "auto",
          maxWidth: "none",
        }}
        draggable={false}
      />
    </div>
  );
});

ImageNode.displayName = "ImageNode";

const nodeTypes = {
  image: ImageNode,
};

// ============================================================================
// Zoom Controls Component
// ============================================================================

interface ZoomControlsProps {
  zoomLevel: number;
  onZoomLevelChange: (zoom: number) => void;
}

function ZoomControls({ zoomLevel, onZoomLevelChange }: ZoomControlsProps) {
  const { zoomIn, zoomOut, fitView, setViewport, getViewport } = useReactFlow();

  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 200 });
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 200 });
  }, [zoomOut]);

  const handleFitView = useCallback(() => {
    fitView({ duration: 200, padding: 0.1 });
  }, [fitView]);

  const handleZoomToPercent = useCallback(
    (percent: number) => {
      const viewport = getViewport();
      setViewport({ ...viewport, zoom: percent / 100 }, { duration: 200 });
      onZoomLevelChange(percent);
    },
    [setViewport, getViewport, onZoomLevelChange]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (!isCmdOrCtrl) return;

      switch (e.key) {
        case "+":
        case "=":
          e.preventDefault();
          handleZoomIn();
          break;
        case "-":
        case "_":
          e.preventDefault();
          handleZoomOut();
          break;
        case "0":
          e.preventDefault();
          handleZoomToPercent(100);
          break;
        case "1":
          e.preventDefault();
          handleFitView();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleZoomToPercent, handleFitView]);

  return (
    <div className="flex items-center gap-1 bg-secondary/80 backdrop-blur-sm rounded-lg p-1 border border-border/50 shadow-lg">
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={handleZoomOut}
      >
        <Minus className="size-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 px-2 text-sm font-medium min-w-[70px]"
          >
            {zoomLevel}%
            <ChevronDown className="ml-1 size-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-40">
          <DropdownMenuItem onClick={() => handleZoomToPercent(25)}>
            25%
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleZoomToPercent(50)}>
            50%
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleZoomToPercent(75)}>
            75%
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleZoomToPercent(100)}>
            100%
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleZoomToPercent(150)}>
            150%
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleZoomToPercent(200)}>
            200%
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleFitView}>
            Fit to view
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={handleZoomIn}
      >
        <Plus className="size-4" />
      </Button>

      <div className="h-5 w-px bg-border mx-1" />

      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={handleFitView}
        title="Fit to view (⌘1)"
      >
        <Maximize2 className="size-4" />
      </Button>
    </div>
  );
}

// ============================================================================
// Image Canvas Component (uses ReactFlow)
// ============================================================================

interface ImageCanvasProps {
  image: PreviewImageAsset;
  zoomLevel: number;
  onZoomLevelChange: (zoom: number) => void;
}

function ImageCanvasInner({
  image,
  zoomLevel,
  onZoomLevelChange,
}: ImageCanvasProps) {
  const { fitView } = useReactFlow();

  // Create node for the image
  const nodes = useMemo<Node<ImageNodeData>[]>(
    () => [
      {
        id: "preview-image",
        type: "image",
        position: { x: 0, y: 0 },
        data: {
          url: image.url,
          alt: image.prompt || "Image preview",
          width: image.width,
          height: image.height,
        },
        draggable: false,
        selectable: false,
      },
    ],
    [image.url, image.prompt, image.width, image.height]
  );

  // Handle viewport changes (zoom, pan)
  const handleMove = useCallback(
    (_: unknown, viewport: { zoom: number }) => {
      const newZoom = Math.round(viewport.zoom * 100);
      onZoomLevelChange(newZoom);
    },
    [onZoomLevelChange]
  );

  // Fit view when image changes
  useEffect(() => {
    // Small delay to ensure the image node is rendered
    const timer = setTimeout(() => {
      fitView({ duration: 0, padding: 0.1 });
    }, 50);
    return () => clearTimeout(timer);
  }, [image.id, fitView]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={[]}
        nodeTypes={nodeTypes}
        onMove={handleMove}
        proOptions={{ hideAttribution: true }}
        fitView
        minZoom={0.1}
        maxZoom={5}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        panOnScroll
        zoomOnScroll
        zoomOnPinch
        panOnDrag
        preventScrolling
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={42}
          size={2}
          bgColor="transparent"
          className="opacity-30"
        />
        <Controls
          position="bottom-center"
          orientation="horizontal"
          showZoom={false}
          showFitView={false}
          showInteractive={false}
          style={{
            border: "none",
            borderRadius: "var(--radius)",
            backdropFilter: "blur(10px)",
            background: "transparent",
          }}
        >
          <ZoomControls
            zoomLevel={zoomLevel}
            onZoomLevelChange={onZoomLevelChange}
          />
        </Controls>
      </ReactFlow>
    </div>
  );
}

function ImageCanvas(props: ImageCanvasProps) {
  return (
    <ReactFlowProvider>
      <ImageCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ImagePreviewModal({
  open,
  onOpenChange,
  images,
  initialImageId,
  onCopyUrl,
}: ImagePreviewModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state: templateState } = useTemplate();
  const { onImageSelect } = useImageStudio();
  const { setInitialPrompt, setInitialReferenceImageUrl, setInitialImageUrl } =
    useImageStudio();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Set initial index when modal opens
  useEffect(() => {
    if (open && initialImageId) {
      const index = images.findIndex((img) => img.id === initialImageId);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [open, initialImageId, images]);

  // Reset zoom when switching images
  useEffect(() => {
    setZoomLevel(100);
  }, [currentIndex]);

  const currentImage = images[currentIndex];

  // ============================================================================
  // Handlers
  // ============================================================================

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  const handleCopyUrl = useCallback(() => {
    if (!currentImage) return;
    navigator.clipboard.writeText(currentImage.url);
    toast.success("URL copied to clipboard");
    onCopyUrl?.(currentImage.url);
  }, [currentImage, onCopyUrl]);

  const handleInsertImage = useCallback(() => {
    if (!currentImage || !onImageSelect) return;
    onImageSelect(
      currentImage.url,
      currentImage.width ?? undefined,
      currentImage.height ?? undefined
    );
    toast.success("Image inserted");
    onOpenChange(false);
  }, [currentImage, onImageSelect, onOpenChange]);

  const handleDownload = useCallback(async () => {
    if (!currentImage) return;
    try {
      const response = await fetch(currentImage.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `image-${currentImage.id}.${
        currentImage.contentType?.split("/")[1] || "png"
      }`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch {
      toast.error("Failed to download image");
    }
  }, [currentImage]);

  const handleThumbnailClick = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const handleUseInStudio = useCallback(() => {
    if (!currentImage) return;

    const templateId = templateState.currentTemplate?.id;
    if (!templateId) {
      toast.error("Template not found");
      return;
    }

    // Set prompt, reference image, and initial image in context
    if (currentImage.prompt) {
      setInitialPrompt(currentImage.prompt);
    }
    setInitialReferenceImageUrl(currentImage.url);
    setInitialImageUrl(currentImage.url);

    // Close preview modal
    onOpenChange(false);

    // Open image studio via URL param
    const params = new URLSearchParams(searchParams.toString());
    params.set("imageStudio", "open");
    router.push(`/app/${templateId}?${params.toString()}`, { scroll: false });

    toast.success("Opened in Image Studio");
  }, [
    currentImage,
    templateState.currentTemplate?.id,
    setInitialPrompt,
    setInitialReferenceImageUrl,
    setInitialImageUrl,
    onOpenChange,
    searchParams,
    router,
  ]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handlePrevious, handleNext, onOpenChange]);

  if (!currentImage) return null;

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-full rounded-none backdrop-blur-2xl h-dvh p-0 gap-0 flex"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">
          Image Preview -{" "}
          {currentImage.prompt ||
            `Image ${currentIndex + 1} of ${images.length}`}
        </DialogTitle>
        {/* Left - Thumbnail Navigator */}
        <div className="w-16 border-r bg-card flex flex-col">
          <div className="p-2 border-b">
            <p className="text-[10px] text-muted-foreground text-center">
              {currentIndex + 1} / {images.length}
            </p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {images.map((image, index) => {
                const isBrandKitImage = image.id.startsWith("brandkit-");
                return (
                  <Button
                    variant="ghost"
                    size="icon"
                    key={image.id}
                    onClick={() => handleThumbnailClick(index)}
                    className={cn(
                      "w-full aspect-square rounded-md overflow-hidden border border-border transition-all relative",
                      index === currentIndex
                        ? "border-primary"
                        : "border-transparent hover:border-muted-foreground/30 opacity-40 hover:opacity-100"
                    )}
                  >
                    {isBrandKitImage ? (
                      // Use regular img tag for brand kit images
                      <img
                        src={image.url}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        loading={index < 5 ? "eager" : "lazy"}
                      />
                    ) : (
                      // Use Next.js Image for regular images
                      <Image
                        src={image.url}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                        loading={index < 5 ? "eager" : "lazy"}
                        placeholder={image.blurDataUrl ? "blur" : "empty"}
                        blurDataURL={image.blurDataUrl ?? undefined}
                      />
                    )}
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Center - Main Image with ReactFlow Canvas */}
        <div className="flex-1 flex flex-col relative">
          <ImageCanvas
            key={currentImage.id}
            image={currentImage}
            zoomLevel={zoomLevel}
            onZoomLevelChange={setZoomLevel}
          />
        </div>

        {/* Right - Details Panel */}
        <div className="w-60 border-l bg-card flex flex-col">
          {/* Header */}
          <div className="p-2 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="size-4 text-primary" />
              <h3 className="font-semibold text-sm">Image Details</h3>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {/* Details */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-5">
              {/* Prompt */}
              {currentImage.prompt && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="size-3" />
                    Prompt
                  </p>
                  <div className="space-y-2">
                    <Textarea
                      value={currentImage.prompt}
                      readOnly
                      className="text-sm"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="w-full mt-2"
                    onClick={handleUseInStudio}
                  >
                    <Sparkles className="size-3.5 mr-2" />
                    Use as Reference
                  </Button>
                  {onImageSelect && (
                    <Button
                      variant="secondary"
                      className="w-full"
                      size="sm"
                      onClick={handleInsertImage}
                    >
                      <Check className="size-3.5 mr-2" />
                      Insert Image
                    </Button>
                  )}
                </div>
              )}

              {/* Dimensions */}
              {(currentImage.width || currentImage.height) && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Dimensions
                  </p>
                  <p className="text-sm">
                    {currentImage.width} × {currentImage.height} px
                  </p>
                </div>
              )}

              {/* Aspect Ratio */}
              {currentImage.aspectRatio && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Aspect Ratio
                  </p>
                  <p className="text-sm">{currentImage.aspectRatio}</p>
                </div>
              )}

              {/* Format */}
              {currentImage.contentType && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Format
                  </p>
                  <p className="text-sm uppercase">
                    {currentImage.contentType.split("/")[1] ||
                      currentImage.contentType}
                  </p>
                </div>
              )}

              {/* Created */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                  <Calendar className="size-3" />
                  Created
                </p>
                <p className="text-sm">
                  {new Date(currentImage.createdAt).toLocaleDateString(
                    undefined,
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </p>
              </div>

              {/* URL */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  URL
                </p>
                <div className="flex gap-2">
                  <Input value={currentImage.url} readOnly />
                  <Button variant="outline" size="icon" onClick={handleCopyUrl}>
                    <Copy className="size-3" />
                  </Button>
                </div>
              </div>

              {!currentImage.prompt && (
                <div className="space-y-2">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={handleUseInStudio}
                  >
                    <Sparkles className="size-3.5 mr-2" />
                    Use as Reference
                  </Button>
                  {onImageSelect && (
                    <Button
                      variant="secondary"
                      className="w-full"
                      size="sm"
                      onClick={handleInsertImage}
                    >
                      <Check className="size-3.5 mr-2" />
                      Insert Image
                    </Button>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="p-4 border-t space-y-2">
            <Button
              className="w-full"
              variant="secondary"
              size="sm"
              onClick={handleCopyUrl}
            >
              <Copy className="size-3.5 mr-2" />
              Copy URL
            </Button>
            <Button
              variant="outline"
              className="w-full"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="size-3.5 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

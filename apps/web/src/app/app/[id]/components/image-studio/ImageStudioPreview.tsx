"use client";

import React, { memo, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyTitle,
  EmptyMedia,
  EmptyHeader,
} from "@/components/ui/empty";
import {
  Image as ImageIcon,
  Check,
  RefreshCw,
  Copy,
  Minus,
  Plus,
  ChevronDown,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import MocahLoadingIcon from "@/components/mocah-brand/MocahLoadingIcon";
import Loader from "@/components/loader";
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
import type { GeneratedImage, ImageNodeData } from "./types";

// ============================================================================
// ReactFlow Image Canvas Components
// ============================================================================

const PreviewImageNode = memo(({ data }: NodeProps<Node<ImageNodeData>>) => {
  return (
    <div className="rounded-lg overflow-hidden shadow-2xl bg-background">
      {data.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
          <Loader />
        </div>
      )}
      <img
        src={data.url}
        alt={data.alt}
        className={cn("block", data.isLoading && "opacity-0")}
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

PreviewImageNode.displayName = "PreviewImageNode";

const previewNodeTypes = {
  previewImage: PreviewImageNode,
};

// ============================================================================
// Zoom Controls
// ============================================================================

interface PreviewZoomControlsProps {
  zoomLevel: number;
  onZoomLevelChange: (zoom: number) => void;
}

function PreviewZoomControls({
  zoomLevel,
  onZoomLevelChange,
}: PreviewZoomControlsProps) {
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
// Preview Canvas
// ============================================================================

interface PreviewCanvasProps {
  image: GeneratedImage;
  isLoading: boolean;
  zoomLevel: number;
  onZoomLevelChange: (zoom: number) => void;
}

function PreviewCanvasInner({
  image,
  isLoading,
  zoomLevel,
  onZoomLevelChange,
}: PreviewCanvasProps) {
  const { fitView } = useReactFlow();

  const nodes = useMemo<Node<ImageNodeData>[]>(
    () => [
      {
        id: "preview-image",
        type: "previewImage",
        position: { x: 0, y: 0 },
        data: {
          url: image.url,
          alt: "Generated image",
          width: image.width,
          height: image.height,
          isLoading,
        },
        draggable: false,
        selectable: false,
      },
    ],
    [image.url, image.width, image.height, isLoading]
  );

  const handleMove = useCallback(
    (_: unknown, viewport: { zoom: number }) => {
      const newZoom = Math.round(viewport.zoom * 100);
      onZoomLevelChange(newZoom);
    },
    [onZoomLevelChange]
  );

  useEffect(() => {
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
        nodeTypes={previewNodeTypes}
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
          <PreviewZoomControls
            zoomLevel={zoomLevel}
            onZoomLevelChange={onZoomLevelChange}
          />
        </Controls>
      </ReactFlow>
    </div>
  );
}

function PreviewCanvas(props: PreviewCanvasProps) {
  return (
    <ReactFlowProvider>
      <PreviewCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

// ============================================================================
// Types
// ============================================================================

interface ImageStudioPreviewProps {
  selectedImage: GeneratedImage | null;
  generatedImages: GeneratedImage[];
  loadingImages: Set<string>;
  isGenerating: boolean;
  isCopied: boolean;
  zoomLevel: number;
  onZoomLevelChange: (zoom: number) => void;
  onSelectImage: (image: GeneratedImage) => void;
  onUseAsReference: (url: string) => void;
  onUseImage: () => void;
  onCopyImageUrl: () => void;
  onClearImages: () => void;
  onImageLoad: (id: string) => void;
  onImageLoadStart: (id: string) => void;
  onImageError: (id: string) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export const ImageStudioPreview = memo(function ImageStudioPreview({
  selectedImage,
  generatedImages,
  loadingImages,
  isGenerating,
  isCopied,
  zoomLevel,
  onZoomLevelChange,
  onSelectImage,
  onUseAsReference,
  onUseImage,
  onCopyImageUrl,
  onClearImages,
  onImageLoad,
  onImageLoadStart,
  onImageError,
}: ImageStudioPreviewProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Main Preview with ReactFlow Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {selectedImage ? (
          <>
            {/* Toolbar */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-secondary/80 backdrop-blur-sm rounded-lg p-1 border border-border/50 shadow-lg">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label="Use as Reference"
                    onClick={() => onUseAsReference(selectedImage.url)}
                  >
                    <RefreshCw className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Use as Reference</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label="Use this Image"
                    onClick={onUseImage}
                  >
                    <Check className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Use this Image</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={isCopied ? "Copied!" : "Copy Image URL"}
                    onClick={onCopyImageUrl}
                  >
                    {isCopied ? (
                      <Check className="size-4" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {isCopied ? "Copied!" : "Copy Image URL"}
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Image URL bar */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 max-w-xs">
              <Input
                value={selectedImage.url}
                readOnly
                className="text-xs bg-secondary/80 backdrop-blur-sm border-border/50"
              />
              {selectedImage.width && selectedImage.height && (
                <span className="text-xs text-muted-foreground whitespace-nowrap bg-secondary/80 backdrop-blur-sm px-2 py-1.5 rounded-md border border-border/50">
                  {selectedImage.width} × {selectedImage.height}
                </span>
              )}
            </div>

            {/* Canvas */}
            <PreviewCanvas
              key={selectedImage.id}
              image={selectedImage}
              isLoading={loadingImages.has(selectedImage.id)}
              zoomLevel={zoomLevel}
              onZoomLevelChange={onZoomLevelChange}
            />
          </>
        ) : isGenerating ? (
          <div className="flex-1 flex items-center justify-center bg-dot">
            <Card className="flex flex-col items-center gap-4 text-muted-foreground min-h-1/2 max-w-md mx-auto w-full py-1">
              <CardHeader className="w-full border-b border-border px-4 [.border-b]:pb-0">
                <CardTitle className="text-sm flex justify-between items-center gap-2 p-0 font-light">
                  <ImageIcon className="size-4 opacity-60" />
                  Generating Image
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center min-h-full w-full p-0">
                <MocahLoadingIcon isLoading={true} />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-dot">
            <Card className="flex flex-col items-center gap-4 text-muted-foreground min-h-1/2 max-w-md mx-auto w-full py-1">
              <CardHeader className="w-full border-b border-border px-4 [.border-b]:pb-0">
                <CardTitle className="text-sm flex justify-between items-center gap-2 p-0 font-light">
                  <ImageIcon className="size-4 opacity-60" />
                  Generate Image
                </CardTitle>
              </CardHeader>
              <CardContent className="items-center justify-center h-full">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ImageIcon className="size-6 opacity-60" />
                    </EmptyMedia>
                    <EmptyTitle>
                      Enter a prompt to generate an image
                    </EmptyTitle>
                    <EmptyDescription>
                      Describe the image you want to create using AI
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Generated Images Gallery */}
      {generatedImages.length > 0 && (
        <div className="border-t bg-background p-4 py-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground">
              Images ({generatedImages.length})
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearImages}
              className="h-7 text-xs"
            >
              Clear All
            </Button>
          </div>
          <div className="flex gap-2 overflow-x-auto p-1">
            {generatedImages.map((img) => {
              const isLoading = loadingImages.has(img.id);
              return (
                <Button
                  variant="ghost"
                  size="icon"
                  key={img.id}
                  onClick={() => onSelectImage(img)}
                  className={cn(
                    "relative shrink-0 w-20 h-20 rounded-md overflow-hidden transition-all",
                    selectedImage?.id === img.id
                      ? "border-primary ring-2 ring-primary"
                      : "border-transparent hover:border-muted-foreground/30"
                  )}
                >
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader />
                    </div>
                  )}
                  <img
                    src={img.url}
                    alt="Generated"
                    className={cn(
                      "w-full h-full object-cover",
                      isLoading && "opacity-0"
                    )}
                    onLoadStart={() => onImageLoadStart(img.id)}
                    onLoad={() => onImageLoad(img.id)}
                    onError={() => onImageError(img.id)}
                  />
                  {selectedImage?.id === img.id && !isLoading && (
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                      <Check className="size-5 text-primary" />
                    </div>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

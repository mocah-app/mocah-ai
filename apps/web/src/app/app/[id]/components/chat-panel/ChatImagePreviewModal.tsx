"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  Copy,
  Download,
  ImageIcon,
  Maximize2,
  Minus,
  Plus,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// ============================================================================
// Types
// ============================================================================

interface ChatImagePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[]; // Array of image URLs
  initialIndex?: number;
}

// ============================================================================
// Main Component
// ============================================================================

export function ChatImagePreviewModal({
  open,
  onOpenChange,
  images,
  initialIndex = 0,
}: ChatImagePreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Set initial index when modal opens
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setZoomLevel(100); // Reset zoom
    }
  }, [open, initialIndex]);

  // Reset zoom when switching images
  useEffect(() => {
    setZoomLevel(100);
  }, [currentIndex]);

  const currentImage = images[currentIndex];
  const hasMultipleImages = images.length > 1;

  // ============================================================================
  // Handlers
  // ============================================================================

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 25, 300));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 25, 50));
  }, []);

  const handleZoomToPercent = useCallback((percent: number) => {
    setZoomLevel(percent);
  }, []);

  const handleFitView = useCallback(() => {
    setZoomLevel(100);
  }, []);

  const handleCopyUrl = useCallback(() => {
    if (!currentImage) return;
    navigator.clipboard.writeText(currentImage);
    toast.success("URL copied to clipboard");
  }, [currentImage]);

  const handleDownload = useCallback(() => {
    if (!currentImage) return;

    // Extract filename from URL or use default
    const filename =
      currentImage.split("/").pop()?.split("?")[0] ||
      `image-${currentIndex + 1}.png`;

    // Use server-side proxy to download (bypasses CORS)
    const downloadUrl = `/api/download-image?url=${encodeURIComponent(currentImage)}`;
    
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success("Download started");
  }, [currentImage, currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (e.key === "ArrowLeft" && hasMultipleImages) {
        handlePrevious();
      } else if (e.key === "ArrowRight" && hasMultipleImages) {
        handleNext();
      } else if (e.key === "Escape") {
        onOpenChange(false);
      } else if (isCmdOrCtrl && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        handleZoomIn();
      } else if (isCmdOrCtrl && (e.key === "-" || e.key === "_")) {
        e.preventDefault();
        handleZoomOut();
      } else if (isCmdOrCtrl && e.key === "0") {
        e.preventDefault();
        handleZoomToPercent(100);
      } else if (isCmdOrCtrl && e.key === "1") {
        e.preventDefault();
        handleFitView();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    open,
    hasMultipleImages,
    handlePrevious,
    handleNext,
    handleZoomIn,
    handleZoomOut,
    handleZoomToPercent,
    handleFitView,
    onOpenChange,
  ]);

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
          Image Preview{" "}
          {hasMultipleImages && `- ${currentIndex + 1} of ${images.length}`}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Image Preview - {currentIndex + 1} of {images.length}
        </DialogDescription>
        {/* Left - Thumbnail Navigator (if multiple images) */}
        {hasMultipleImages && (
          <div className="w-16 border-r bg-card flex flex-col">
            <div className="p-2 border-b">
              <p className="text-[10px] text-muted-foreground text-center">
                {currentIndex + 1} / {images.length}
              </p>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {images.map((url, index) => (
                  <Button
                    variant="ghost"
                    size="icon"
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={cn(
                      "w-full aspect-square rounded-md overflow-hidden border border-border transition-all relative",
                      index === currentIndex
                        ? "border-primary"
                        : "border-transparent hover:border-muted-foreground/30 opacity-40 hover:opacity-100"
                    )}
                  >
                    <Image
                      src={url}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                      loading={index < 5 ? "eager" : "lazy"}
                      unoptimized
                    />
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Center - Main Image */}
        <div className="flex-1 flex flex-col relative bg-muted/30">
          {/* Image Container with Zoom */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            <div
              className="relative transition-transform duration-200 ease-out"
              style={{
                transform: `scale(${zoomLevel / 100})`,
              }}
            >
              <Image
                src={currentImage}
                alt={`Preview ${currentIndex + 1}`}
                width={1200}
                height={800}
                className="object-contain max-h-[80vh] w-auto h-auto"
                unoptimized
                priority
              />
            </div>
          </div>

          {/* Zoom Controls (bottom center) */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            <div className="flex items-center gap-1 bg-secondary/80 backdrop-blur-sm rounded-lg p-1 border border-border/50 shadow-lg">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 50}
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
                disabled={zoomLevel >= 300}
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
          </div>
        </div>

        {/* Right - Actions Panel */}
        <div className="w-60 border-l bg-card flex flex-col">
          {/* Header */}
          <div className="p-2 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="size-4 text-primary" />
              <h3 className="font-semibold text-sm">Image Preview</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Details */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-5">
              {/* Image count for multiple images */}
              {hasMultipleImages && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Image
                  </p>
                  <p className="text-sm">
                    {currentIndex + 1} of {images.length}
                  </p>
                </div>
              )}

              {/* URL */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  URL
                </p>
                <div className="flex gap-2">
                  <Input value={currentImage} readOnly className="text-xs" />
                  <Button variant="outline" size="icon" onClick={handleCopyUrl}>
                    <Copy className="size-3" />
                  </Button>
                </div>
              </div>
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

"use client";

import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useOrganization } from "@/contexts/organization-context";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import {
  Copy,
  FolderOpen,
  Image as ImageIcon,
  Maximize2,
  Plus,
  Search,
  Sparkles,
  X
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useImageStudio } from "../image-studio/ImageStudioContext";
import { useTemplate } from "../providers/TemplateProvider";
import { ImagePreviewModal, type PreviewImageAsset } from "./ImagePreviewModal";

// ============================================================================
// Types
// ============================================================================

interface ImageLibraryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function ImageLibraryPanel({ isOpen, onClose }: ImageLibraryPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state: templateState } = useTemplate();
  const { activeOrganization } = useOrganization();
  const { onImageSelect } = useImageStudio();
  const templateId = templateState.currentTemplate?.id;
  const organizationId =
    templateState.currentTemplate?.organizationId || activeOrganization?.id;

  // Filters
  const [scope, setScope] = useState<"template" | "org" | "brandKit">("org");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  // Preview modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImageId, setPreviewImageId] = useState<string | undefined>();

  // Infinite scroll sentinel ref
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Open Image Studio via URL param
  const handleOpenImageStudio = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("imageStudio", "open");
    router.push(`/app/${templateId}?${params.toString()}`, { scroll: false });
  }, [router, searchParams, templateId]);

  // Fetch brand kit data
  // Note: Type assertion to prevent "Type instantiation is excessively deep" error
  const { data: brandKitData, isLoading: isBrandKitLoading } = trpc.brandKit.getActive.useQuery(
    undefined,
    {
      enabled: isOpen && scope === "brandKit" && !!organizationId,
    }
  ) as { data: any; isLoading: boolean };

  // Fetch images with server-side search (only when panel is open and not brandKit scope)
  const {
    data: imageData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.imageAsset.list.useInfiniteQuery(
    {
      templateId: scope === "template" ? templateId : undefined,
      search: debouncedSearch || undefined,
      limit: 30,
    },
    {
      enabled: isOpen && scope !== "brandKit" && (scope === "org" ? !!organizationId : !!templateId),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  // Map brand kit images to the same format as image assets
  const brandKitImages = React.useMemo(() => {
    if (scope !== "brandKit" || !brandKitData) return [];
    
    const images: PreviewImageAsset[] = [];
    
    if (brandKitData.logo) {
      images.push({
        id: "brandkit-logo",
        url: brandKitData.logo,
        prompt: "Brand Logo",
        model: null,
        width: null,
        height: null,
        aspectRatio: null,
        contentType: null,
        blurDataUrl: null,
        createdAt: brandKitData.createdAt,
      });
    }
    
    if (brandKitData.favicon) {
      images.push({
        id: "brandkit-favicon",
        url: brandKitData.favicon,
        prompt: "Brand Favicon",
        model: null,
        width: null,
        height: null,
        aspectRatio: null,
        contentType: null,
        blurDataUrl: null,
        createdAt: brandKitData.createdAt,
      });
    }
    
    if (brandKitData.ogImage) {
      images.push({
        id: "brandkit-ogimage",
        url: brandKitData.ogImage,
        prompt: "Brand OG Image",
        model: null,
        width: null,
        height: null,
        aspectRatio: null,
        contentType: null,
        blurDataUrl: null,
        createdAt: brandKitData.createdAt,
      });
    }
    
    return images;
  }, [scope, brandKitData]);

  const filteredImages = scope === "brandKit" 
    ? brandKitImages 
    : (imageData?.pages.flatMap((page) => page.items) ?? []);
  
  const isLoadingImages = scope === "brandKit" ? isBrandKitLoading : isLoading;

  // Infinite scroll: observe sentinel element
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "100px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleCopyUrl = useCallback((e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  }, []);

  const handleOpenPreview = useCallback(
    (e: React.MouseEvent, imageId: string) => {
      e.stopPropagation();
      setPreviewImageId(imageId);
      setPreviewOpen(true);
    },
    []
  );

  const handleInsertImage = useCallback(
    (e: React.MouseEvent, image: PreviewImageAsset) => {
      e.stopPropagation();
      if (onImageSelect) {
        onImageSelect(
          image.url,
          image.width ?? undefined,
          image.height ?? undefined
        );
        toast.success("Image inserted");
      } else {
        // Fallback to opening preview modal if onImageSelect is not available
        handleOpenPreview(e, image.id);
      }
    },
    [onImageSelect, handleOpenPreview]
  );

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      <div
        className={cn(
          "bg-card rounded-r-xl shadow-2xl border border-border overflow-hidden flex flex-col z-40 h-dvh transition-all duration-300 ease-in-out",
          isOpen
            ? "translate-x-0 opacity-100 w-80"
            : "-translate-x-full opacity-0 pointer-events-none w-0"
        )}
      >
        {/* Header */}
        <div className="p-2 border-b border-border flex justify-between items-center bg-muted">
          <div className="flex items-center gap-2">
            <FolderOpen className="size-3 text-primary" />
            <h3 className="font-semibold text-sm">Library</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              onClick={handleOpenImageStudio}
              variant="outline"
              size="sm"
              title="AI Image Studio"
            >
              <Sparkles size={14} />
              Studio
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <X size={14} />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-3 grid gap-2 border-b border-border">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Select
              value={scope}
              onValueChange={(v) => setScope(v as "template" | "org" | "brandKit")}
            >
              <SelectTrigger className="h-8 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="org">All Organization Images</SelectItem>
                <SelectItem value="template">This Template Only</SelectItem>
                <SelectItem value="brandKit">Brand Kit</SelectItem>
              </SelectContent>
            </Select>
          <span className="text-xs border border-border rounded-md p-1 flex items-center justify-center text-muted-foreground">
            {filteredImages.length} image
            {filteredImages.length !== 1 ? "s" : ""}
          </span>
          </div>
          <div className="relative h-8 w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by prompt..."
                className="pl-8 h-full text-xs"
              />
            </div>
        </div>

        {/* Image Grid */}
        <ScrollArea className="flex-1 min-h-0 overflow-hidden">
          <div className="p-3">
            {isLoadingImages ? (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-md" />
                ))}
              </div>
            ) : filteredImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <ImageIcon className="size-10 opacity-30 mb-2" />
                <p className="text-xs text-center">No images found</p>
                <p className="text-[10px] text-center">
                  {scope === "brandKit"
                    ? "No brand kit images available"
                    : searchQuery
                    ? "Try a different search"
                    : "Generate images to see them here"}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {filteredImages.map((image, index) => {
                    const isBrandKitImage = image.id.startsWith("brandkit-");
                    return (
                      <div
                        key={image.id}
                        role="button"
                        tabIndex={0}
                        className="group w-full h-auto relative aspect-square rounded-md overflow-hidden border border-border bg-muted cursor-pointer hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={(e) => handleOpenPreview(e, image.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleOpenPreview(e as unknown as React.MouseEvent, image.id);
                          }
                        }}
                      >
                        {isBrandKitImage ? (
                          // Use regular img tag for brand kit images to avoid Next.js hostname config issues
                          <img
                            src={image.url}
                            alt={image.prompt || "Brand image"}
                            className="absolute inset-0 w-full h-full object-contain transition-transform group-hover:scale-105"
                            loading={index < 4 ? "eager" : "lazy"}
                          />
                        ) : (
                          // Use Next.js Image for regular images
                          <Image
                            src={image.url}
                            alt={image.prompt || "Generated image"}
                            fill
                            sizes="(max-width: 768px) 50vw, 150px"
                            className="object-contain transition-transform group-hover:scale-105"
                            loading={index < 4 ? "eager" : "lazy"}
                            priority={index < 2}
                            placeholder={image.blurDataUrl ? "blur" : "empty"}
                            blurDataURL={image.blurDataUrl ?? undefined}
                          />
                        )}

                        {/* Hover/Focus Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 group-focus-within:bg-black/40 transition-colors" />

                      {/* Hover/Focus Actions */}
                      <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={(e) => handleCopyUrl(e, image.url)}
                              variant="secondary"
                              size="icon"
                            >
                              <Copy className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copy URL</p>
                          </TooltipContent>
                        </Tooltip>
                        {onImageSelect ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={(e) => handleInsertImage(e, image)}
                                variant="secondary"
                                size="icon"
                              >
                                <Plus className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Insert</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={(e) => handleOpenPreview(e, image.id)}
                                variant="secondary"
                                size="icon"
                              >
                                <Maximize2 className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Expand</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>

                        {/* Prompt hint at bottom */}
                        {image.prompt && (
                          <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-[9px] text-white line-clamp-1">
                              {image.prompt}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Infinite scroll sentinel & loading indicator */}
                <div ref={sentinelRef} className="h-4 flex justify-center mt-3">
                  {isFetchingNextPage && (
                    <Loader size="sm" />
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        images={filteredImages as PreviewImageAsset[]}
        initialImageId={previewImageId}
      />
    </>
  );
}

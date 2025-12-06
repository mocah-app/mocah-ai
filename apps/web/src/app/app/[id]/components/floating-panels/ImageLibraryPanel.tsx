"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import {
  Loader2,
  Search,
  Image as ImageIcon,
  X,
  Copy,
  Maximize2,
  FolderOpen,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTemplate } from "../providers/TemplateProvider";
import { useOrganization } from "@/contexts/organization-context";
import { ImagePreviewModal, type PreviewImageAsset } from "./ImagePreviewModal";
import { useRouter, useSearchParams } from "next/navigation";

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
  const templateId = templateState.currentTemplate?.id;
  const organizationId =
    templateState.currentTemplate?.organizationId || activeOrganization?.id;

  // Filters
  const [scope, setScope] = useState<"template" | "org">("org");
  const [searchQuery, setSearchQuery] = useState("");

  // Preview modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImageId, setPreviewImageId] = useState<string | undefined>();

  // Open Image Studio via URL param
  const handleOpenImageStudio = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("imageStudio", "open");
    router.push(`/app/${templateId}?${params.toString()}`, { scroll: false });
  }, [router, searchParams, templateId]);

  // Fetch images
  const {
    data: imageData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.imageAsset.list.useInfiniteQuery(
    {
      templateId: scope === "template" ? templateId : undefined,
      limit: 30,
    },
    {
      enabled: scope === "org" ? !!organizationId : !!templateId,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const allImages = imageData?.pages.flatMap((page) => page.items) ?? [];

  // Filter by search query (client-side for prompts)
  const filteredImages = searchQuery
    ? allImages.filter((img) =>
        img.prompt?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allImages;

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
              onValueChange={(v) => setScope(v as "template" | "org")}
            >
              <SelectTrigger className="h-8 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="org">All Organization Images</SelectItem>
                <SelectItem value="template">This Template Only</SelectItem>
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
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <ImageIcon className="size-10 opacity-30 mb-2" />
                <p className="text-xs text-center">No images found</p>
                <p className="text-[10px] text-center">
                  {searchQuery
                    ? "Try a different search"
                    : "Generate images to see them here"}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {filteredImages.map((image) => (
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
                      <img
                        src={image.url}
                        alt={image.prompt || "Generated image"}
                        className="absolute inset-0 w-full h-full object-contain transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                      {/* Hover/Focus Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 group-focus-within:bg-black/40 transition-colors" />

                      {/* Hover/Focus Actions */}
                      <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleCopyUrl(e, image.url)}
                          className="p-2 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          title="Copy URL"
                        >
                          <Copy className="size-4" />
                        </button>
                        <button
                          onClick={(e) => handleOpenPreview(e, image.id)}
                          className="p-2 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          title="Expand"
                        >
                          <Maximize2 className="size-4" />
                        </button>
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
                  ))}
                </div>
                {/* Load More */}
                {hasNextPage && (
                  <div className="flex justify-center mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="h-7 text-xs"
                    >
                      {isFetchingNextPage ? (
                        <>
                          <Loader2 className="size-3 mr-1.5 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Load More"
                      )}
                    </Button>
                  </div>
                )}
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

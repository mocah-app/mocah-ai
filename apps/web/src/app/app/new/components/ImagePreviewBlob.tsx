"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Loader from "@/components/loader";
import Image from "next/image";

export interface ImagePreviewBlobProps {
  id: string;
  previewUrl: string;
  status: "uploading" | "ready" | "error";
  fileName?: string;
  onRemove: (id: string) => void;
}

export default function ImagePreviewBlob({
  id,
  previewUrl,
  status,
  fileName,
  onRemove,
}: ImagePreviewBlobProps) {
  return (
    <div className="relative inline-flex items-center justify-center">
      <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-border bg-muted">
        {status === "error" ? (
          <div className="w-full h-full flex items-center justify-center text-destructive text-xs">
            !
          </div>
        ) : (
          <Image
            src={previewUrl}
            alt={fileName || "Attachment"}
            fill
            className="object-cover"
            unoptimized
          />
        )}

        {status === "uploading" && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Loader size="sm" />
          </div>
        )}
      </div>

      {status !== "uploading" && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-background border border-border hover:bg-destructive hover:text-destructive-foreground hover:border-destructive p-0"
          onClick={() => onRemove(id)}
          aria-label="Remove attachment"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

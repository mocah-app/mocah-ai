"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/utils/trpc";
import type { GeneratedImage } from "@mocah/shared";

// ============================================================================
// Types
// ============================================================================

interface UseImageUploadOptions {
  organizationId: string | undefined;
  templateId: string | undefined;
  versionId?: string | null | undefined;
  onSuccess?: (image: GeneratedImage) => void;
  onError?: (error: Error) => void;
}

export type UploadStage = "idle" | "preparing" | "uploading" | "processing" | "complete";

interface UseImageUploadReturn {
  uploadFile: (file: File) => Promise<GeneratedImage | null>;
  isUploading: boolean;
  progress: number;
  stage: UploadStage;
  error: string | null;
}

// ============================================================================
// Utility: Get image dimensions
// ============================================================================

async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error("Failed to load image for dimension detection"));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}

// ============================================================================
// Hook
// ============================================================================

export function useImageUpload({
  organizationId,
  templateId,
  versionId,
  onSuccess,
  onError,
}: UseImageUploadOptions): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<UploadStage>("idle");
  const [error, setError] = useState<string | null>(null);

  const utils = trpc.useUtils();

  // tRPC mutations
  const createUploadUrlMutation = trpc.storage.createUploadUrl.useMutation();
  const confirmUploadMutation = trpc.storage.confirmUpload.useMutation();

  const uploadFile = useCallback(
    async (file: File): Promise<GeneratedImage | null> => {
      if (!organizationId) {
        const errorMsg = "Select an organization before uploading images.";
        toast.error(errorMsg);
        onError?.(new Error(errorMsg));
        return null;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        const errorMsg = "Please select an image file";
        toast.error(errorMsg);
        onError?.(new Error(errorMsg));
        return null;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        const errorMsg = "Image must be less than 5MB";
        toast.error(errorMsg);
        onError?.(new Error(errorMsg));
        return null;
      }

      setIsUploading(true);
      setProgress(0);
      setStage("preparing");
      setError(null);

      try {
        // Step 1: Get image dimensions
        setProgress(10);
        let dimensions: { width: number; height: number } | undefined;
        try {
          dimensions = await getImageDimensions(file);
        } catch {
          // Continue without dimensions if detection fails
          console.warn("Failed to detect image dimensions");
        }

        // Step 2: Get presigned upload URL
        setProgress(20);
        console.log("[useImageUpload] Getting presigned URL for:", {
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        });

        const { uploadUrl, storageKey } =
          await createUploadUrlMutation.mutateAsync({
            fileName: file.name,
            contentType: file.type as
              | "image/png"
              | "image/jpeg"
              | "image/jpg"
              | "image/svg+xml"
              | "image/webp",
            fileSize: file.size,
            templateId,
            versionId: versionId ?? undefined,
          });

        // Parse URL for debugging
        const urlObj = new URL(uploadUrl);
        console.log("[useImageUpload] Presigned URL received:", {
          host: urlObj.host,
          pathname: urlObj.pathname,
          searchParams: Object.fromEntries(urlObj.searchParams.entries()),
        });

        // Step 3: Upload directly to S3
        setStage("uploading");
        setProgress(40);
        
        const headers: Record<string, string> = {
          "Content-Type": file.type,
        };
        
        console.log("[useImageUpload] Uploading to S3:", {
          method: "PUT",
          url: urlObj.origin + urlObj.pathname,
          headers,
          fileSize: file.size,
          fileType: file.type,
        });

        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers,
        });

        console.log("[useImageUpload] S3 response:", {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          ok: uploadResponse.ok,
        });

        if (!uploadResponse.ok) {
          // Try to get error details
          const errorText = await uploadResponse.text().catch(() => "");
          console.error("[useImageUpload] Upload error details:", {
            status: uploadResponse.status,
            statusText: uploadResponse.statusText,
            errorBody: errorText,
            responseHeaders: Object.fromEntries(uploadResponse.headers.entries()),
          });
          throw new Error(`Upload failed: ${uploadResponse.statusText} - ${errorText}`);
        }

        // Step 4: Confirm upload and process image (server-side optimization)
        setStage("processing");
        setProgress(70);
        const confirmed = await confirmUploadMutation.mutateAsync({
          storageKey,
          contentType: file.type,
          fileName: file.name,
          fileSize: file.size,
          width: dimensions?.width,
          height: dimensions?.height,
          templateId,
          versionId: versionId ?? undefined,
        });

        setStage("complete");
        setProgress(100);

        const result: GeneratedImage = {
          id: confirmed.id,
          url: confirmed.url,
          width: confirmed.width ?? undefined,
          height: confirmed.height ?? undefined,
        };

        // Invalidate image lists
        utils.imageAsset.list.invalidate();

        toast.success("Image uploaded successfully");
        onSuccess?.(result);

        return result;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to upload image";
        setError(errorMsg);
        setStage("idle");
        toast.error(errorMsg);
        onError?.(err instanceof Error ? err : new Error(errorMsg));
        return null;
      } finally {
        setIsUploading(false);
        // Reset stage after a short delay to allow UI to show completion
        setTimeout(() => setStage("idle"), 500);
      }
    },
    [
      organizationId,
      templateId,
      versionId,
      createUploadUrlMutation,
      confirmUploadMutation,
      utils.imageAsset.list,
      onSuccess,
      onError,
    ]
  );

  return {
    uploadFile,
    isUploading,
    progress,
    stage,
    error,
  };
}

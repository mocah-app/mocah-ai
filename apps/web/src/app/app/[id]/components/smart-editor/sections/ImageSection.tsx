'use client';

import Loader from '@/components/loader';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useOrganization } from '@/contexts/organization-context';
import { LibraryBig, Sparkles, Upload, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useMemo, useRef } from 'react';
import { useImageStudio } from '../../image-studio/ImageStudioContext';
import { useImageUpload } from '../../image-studio/hooks';
import { useTemplate } from '../../providers/TemplateProvider';
import { PropertySection, TextInputControl } from '../controls';

interface ImageSectionProps {
  /** Current image URL */
  src: string | undefined;
  /** Alt text (optional, mainly for img elements, not backgrounds) */
  alt?: string | undefined;
  /** Called when image is selected/uploaded */
  onImageSelect: (url: string, width?: number, height?: number) => void;
  /** Called when src URL is manually changed */
  onSrcChange?: (value: string) => void;
  /** Called when alt text is changed */
  onAltChange?: (value: string) => void;
  /** Show alt text input (default: true) */
  showAltText?: boolean;
  /** Label for the section (default: "Image") */
  label?: string;
  /** Called when image is removed */
  onRemoveImage?: () => void;
}

export function ImageSection({
  src,
  alt,
  onImageSelect,
  onSrcChange,
  onRemoveImage,
  onAltChange,
  showAltText = true,
  label = 'Image',
}: ImageSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state: templateState } = useTemplate();
  const { activeOrganization } = useOrganization();
  const { setOnImageSelect, setInitialImageUrl } = useImageStudio();
  const templateId = templateState.currentTemplate?.id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const organizationId = useMemo(
    () =>
      templateState.currentTemplate?.organizationId || activeOrganization?.id,
    [templateState.currentTemplate?.organizationId, activeOrganization?.id]
  );

  // Image upload hook
  const { uploadFile, isUploading } = useImageUpload({
    organizationId,
    templateId,
    onSuccess: (image) => {
      onImageSelect(image.url, image.width, image.height);
    },
  });

  // File upload handler
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      await uploadFile(file);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [uploadFile]
  );

  // Open Image Studio for AI generation
  const handleOpenImageStudio = useCallback(() => {
    setOnImageSelect(() => onImageSelect);
    setInitialImageUrl(src);
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('imageStudio', 'open');
    router.push(`/app/${templateId}?${params.toString()}`, { scroll: false });
  }, [router, searchParams, templateId, setOnImageSelect, setInitialImageUrl, src, onImageSelect]);

  // Open Image Library
  const handleOpenLibrary = useCallback(() => {
    setOnImageSelect(() => onImageSelect);
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('library', 'open');
    router.push(`/app/${templateId}?${params.toString()}`, { scroll: false });
  }, [router, searchParams, templateId, setOnImageSelect, onImageSelect]);

  return (
    <PropertySection label={label}>
      {/* Image Preview */}
      {src && (
        <div className="relative rounded-lg overflow-hidden border border-border bg-muted/50 mb-3 aspect-video">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt || "Image preview"}
            className="w-full h-full object-contain"
          />
          <Button
            variant="outline"
            size="icon"
            className="absolute top-2 right-2 h-9"
            onClick={onRemoveImage}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9"
                onClick={handleOpenLibrary}
                aria-label="Select from library"
              >
                <LibraryBig className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Select from library</TooltipContent>
          </Tooltip>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            aria-label="Upload image"
          >
            {isUploading ? <Loader /> : <Upload className="size-3.5" />}
            Upload
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={handleOpenImageStudio}
        >
          <Sparkles className="size-3.5 mr-1.5" />
          Generate Image
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* URL Input */}
      <TextInputControl
        label="Image URL"
        value={src}
        onChange={onSrcChange || (() => {})}
        type="url"
        placeholder="https://example.com/image.jpg"
      />

      {/* Alt Text Input (optional) */}
      {showAltText && (
        <TextInputControl
          label="Alt Text"
          value={alt}
          onChange={onAltChange || (() => {})}
          placeholder="Image description"
        />
      )}
    </PropertySection>
  );
}

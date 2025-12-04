"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { BrandKitData } from "../brand-configuration-modal";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { fileToApiFormat, validateImageFile } from "@/lib/file-utils";
import { trpcClient } from "@/utils/trpc";

interface BrandIdentitySectionProps {
  data: BrandKitData;
  onUpdate: (updates: Partial<BrandKitData>) => void;
  disabled?: boolean;
  organizationId?: string;
}

export function BrandIdentitySection({
  data,
  onUpdate,
  disabled,
  organizationId,
}: BrandIdentitySectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organizationId) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setIsUploading(true);
    try {
      // Preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate({ logo: reader.result as string });
      };
      reader.readAsDataURL(file);

      // Upload to storage
      const fileData = await fileToApiFormat(file);
      const result = await trpcClient.storage.uploadLogo.mutate({
        file: fileData,
        organizationId,
      });
      onUpdate({ logo: result.url });
      toast.success("Logo uploaded successfully");
    } catch (error) {
      console.error("Failed to upload logo:", error);
      toast.error("Failed to upload logo");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 px-6 pt-6">

      {/* OG Image Preview */}
      {data.ogImage && (
          <div className="rounded-lg border overflow-hidden bg-muted/50">
            <img
              src={data.ogImage}
              alt="OG Image preview"
              className="w-full h-24 object-top object-cover"
            />
        </div>
      )}
      {/* Section Header */}
      <div>
        <h3 className="text-base font-semibold">Brand Identity</h3>
        <p className="sr-only">
          Your core brand assets and messaging
        </p>
      </div>

      {/* Logo Section */}
      <div className="space-y-4">
        <Label>Logo</Label>
        <div className="flex items-start gap-6">
          <div className="relative group">
            <Avatar className="h-24 w-24 p-2 rounded-xl border-2 border-dashed border-muted-foreground/25">
              <AvatarImage src={data.logo || undefined} className="object-contain" />
              <AvatarFallback className="rounded-xl bg-muted text-2xl">
                {data.companyName?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            {data.logo && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onUpdate({ logo: null })}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "Uploading..." : data.logo ? "Change Logo" : "Upload Logo"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden"
              onChange={handleLogoUpload}
              disabled={disabled || isUploading}
            />
            <p className="text-xs text-muted-foreground">
              PNG, JPG, SVG or WebP. Recommended: 400x400px or larger.
            </p>
          </div>
        </div>
      </div>

      {/* Company Name */}
      <div className="space-y-2">
        <Label htmlFor="companyName">Company Name</Label>
        <Input
          id="companyName"
          value={data.companyName || ""}
          onChange={(e) => onUpdate({ companyName: e.target.value })}
          placeholder="Your company name"
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          The name that appears in your email templates
        </p>
      </div>

      {/* Tagline */}
      <div className="space-y-2">
        <Label htmlFor="tagline">Tagline</Label>
        <Input
          id="tagline"
          value={data.tagline || ""}
          onChange={(e) => onUpdate({ tagline: e.target.value })}
          placeholder="Your brand tagline or slogan"
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          A short phrase that captures your brand essence
        </p>
      </div>

      {/* Company Description */}
      <div className="space-y-2">
        <Label htmlFor="companyDescription">Description</Label>
        <Textarea
          id="companyDescription"
          value={data.companyDescription || ""}
          onChange={(e) => onUpdate({ companyDescription: e.target.value })}
          placeholder="Brief description of your company and what you do"
          rows={4}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Used by AI to generate contextually relevant email content
        </p>
      </div>

      
    </div>
  );
}


"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { BrandKitData } from "../brand-configuration-modal";
import {
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  Youtube,
  Globe,
  ExternalLink,
  Plus,
  X,
  GripVertical,
} from "lucide-react";
import { useState } from "react";

interface BrandSocialSectionProps {
  data: BrandKitData;
  onUpdate: (updates: Partial<BrandKitData>) => void;
  disabled?: boolean;
}

const SOCIAL_PLATFORMS = [
  {
    key: "twitter",
    label: "Twitter / X",
    icon: Twitter,
    placeholder: "https://twitter.com/yourcompany",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: Linkedin,
    placeholder: "https://linkedin.com/company/yourcompany",
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: Facebook,
    placeholder: "https://facebook.com/yourcompany",
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: Instagram,
    placeholder: "https://instagram.com/yourcompany",
  },
  {
    key: "youtube",
    label: "YouTube",
    icon: Youtube,
    placeholder: "https://youtube.com/@yourcompany",
  },
];

export function BrandSocialSection({
  data,
  onUpdate,
  disabled,
}: BrandSocialSectionProps) {
  const [addPopoverOpen, setAddPopoverOpen] = useState(false);
  const socialLinks = data.socialLinks || {};

  const updateSocialLink = (platform: string, value: string) => {
    const updated = { ...socialLinks };
    if (value) {
      updated[platform] = value;
    } else {
      delete updated[platform];
    }
    onUpdate({ socialLinks: Object.keys(updated).length > 0 ? updated : null });
  };

  const addSocialLink = (platformKey: string) => {
    const updated = { ...socialLinks, [platformKey]: "" };
    onUpdate({ socialLinks: updated });
    setAddPopoverOpen(false);
  };

  const removeSocialLink = (platform: string) => {
    const updated = { ...socialLinks };
    delete updated[platform];
    onUpdate({ socialLinks: Object.keys(updated).length > 0 ? updated : null });
  };

  // Get platforms that are currently being edited (including empty ones being added)
  const activePlatformKeys = Object.keys(socialLinks);
  const activePlatforms = SOCIAL_PLATFORMS.filter((p) =>
    activePlatformKeys.includes(p.key)
  );

  // Get platforms that can still be added
  const availablePlatforms = SOCIAL_PLATFORMS.filter(
    (p) => !activePlatformKeys.includes(p.key)
  );

  // Platforms with actual values (for preview)
  const platformsWithValues = activePlatforms.filter((p) =>
    socialLinks[p.key]?.trim()
  );

  return (
    <div className="space-y-6 px-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Social Links</h3>
          <p className="text-xs text-muted-foreground">
            Connect your social media profiles for email footers
          </p>
        </div>

        {/* Add Social Link Button */}
        {availablePlatforms.length > 0 && (
          <Popover open={addPopoverOpen} onOpenChange={setAddPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" disabled={disabled}>
                <Plus className="h-4 w-4 mr-2" />
                Add Link
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="end">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                  Choose a platform
                </p>
                {availablePlatforms.map((platform) => {
                  const Icon = platform.icon;
                  return (
                    <Button
                      key={platform.key}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => addSocialLink(platform.key)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {platform.label}
                    </Button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Active Social Links */}
      {activePlatforms.length > 0 && (
        <div className="space-y-3">
          {activePlatforms.map((platform) => {
            const Icon = platform.icon;
            const value = socialLinks[platform.key] || "";

            return (
              <div
                key={platform.key}
                className="group flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="flex-1 space-y-1.5 min-w-0">
                  <Label className="sr-only">{platform.label}</Label>
                  <Input
                    value={value}
                    onChange={(e) =>
                      updateSocialLink(platform.key, e.target.value)
                    }
                    placeholder={platform.placeholder}
                    disabled={disabled}
                    className="h-9"
                  />
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {value && (
                    <a
                      href={value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md p-2 hover:bg-muted transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeSocialLink(platform.key)}
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State with Quick Add Buttons */}
      {activePlatforms.length === 0 && (
        <div className="p-6 rounded-xl border-2 border-dashed text-center space-y-4">
          <div>
            <Globe className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No social links added yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Add your social media profiles to include them in email footers
            </p>
          </div>

          {/* Quick Add Buttons */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {SOCIAL_PLATFORMS.slice(0, 4).map((platform) => {
              const Icon = platform.icon;
              return (
                <Button
                  key={platform.key}
                  variant="outline"
                  size="sm"
                  onClick={() => addSocialLink(platform.key)}
                  disabled={disabled}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {platform.label}
                </Button>
              );
            })}
          </div>

          {availablePlatforms.length > 4 && (
            <Popover open={addPopoverOpen} onOpenChange={setAddPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" disabled={disabled}>
                  <Plus className="h-4 w-4 mr-1" />
                  More platforms...
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2">
                <div className="space-y-1">
                  {availablePlatforms.slice(4).map((platform) => {
                    const Icon = platform.icon;
                    return (
                      <Button
                        key={platform.key}
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => addSocialLink(platform.key)}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {platform.label}
                      </Button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      )}

      {/* Social Links Preview */}
      {platformsWithValues.length > 0 && (
        <div className="p-4 rounded-xl border bg-muted/30">
          <p className="text-xs text-muted-foreground mb-3 font-medium">
            Preview: Email Footer Social Icons
          </p>
          <div className="flex gap-3">
            {platformsWithValues.map((platform) => {
              const Icon = platform.icon;
              return (
                <a
                  key={platform.key}
                  href={socialLinks[platform.key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg border bg-background hover:bg-muted transition-colors"
                >
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

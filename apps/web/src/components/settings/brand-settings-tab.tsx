"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useOrganization } from "@/contexts/organization-context";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { Palette, Settings2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface BrandSettingsTabProps {
  onClose: () => void;
}

export function BrandSettingsTab({ onClose }: BrandSettingsTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeOrganization } = useOrganization();
  const utils = trpc.useUtils();
  const [includeBrandGuide, setIncludeBrandGuide] = useState(true);

  // Fetch brand guide preference
  const { data: brandGuidePreference, isLoading: isLoadingPreference } =
    trpc.brandGuide.getPreference.useQuery(undefined, {
      enabled: !!activeOrganization?.id,
      refetchOnWindowFocus: false,
    });

  // Update local state when preference is fetched
  useEffect(() => {
    if (brandGuidePreference !== undefined) {
      setIncludeBrandGuide(brandGuidePreference);
    }
  }, [brandGuidePreference]);

  const updatePreferenceMutation = trpc.brandGuide.setPreference.useMutation({
    onSuccess: () => {
      utils.brandGuide.getPreference.invalidate();
    },
  });

  const handleToggle = (checked: boolean) => {
    if (!activeOrganization?.id) {
      toast.error("Organization not found");
      return;
    }

    // Optimistically update UI
    setIncludeBrandGuide(checked);

    // Show loading toast and update to success/error
    const promise = updatePreferenceMutation.mutateAsync({
      includeBrandGuide: checked,
    });

    toast.promise(promise, {
      loading: checked ? "Enabling brand guide..." : "Disabling brand guide...",
      success: checked ? "Brand guide enabled" : "Brand guide disabled",
      error: (error) =>
        `Failed to update preference: ${error.message || "Unknown error"}`,
    });
  };

  const handleOpenBrandConfiguration = () => {
    // Close settings modal and open brand configuration
    const params = new URLSearchParams(searchParams.toString());
    // Remove settings-related params
    params.delete("settings");
    params.delete("tab");
    // Set brand configuration param
    params.set("brand", "configuration");
    router.replace(`/app?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-none border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Brand Guide</CardTitle>
          <CardDescription>
            Control whether your brand guidelines are included when generating
            templates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-0">
          {/* Brand Guide Toggle */}
          <div className="px-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor="brand-guide-toggle"
                  className="text-sm font-medium"
                >
                  Include Brand Guide
                </Label>
                <p className="text-xs text-muted-foreground">
                  When enabled, AI will use your brand colors, fonts, and style
                  when generating templates
                </p>
              </div>
            </div>
            {isLoadingPreference ? (
              <div className="h-6 w-11 bg-muted animate-pulse rounded-full" />
            ) : (
              <Switch
                id="brand-guide-toggle"
                checked={includeBrandGuide}
                onCheckedChange={handleToggle}
                disabled={updatePreferenceMutation.isPending}
              />
            )}
          </div>
          </div>

          {/* Configure Brand Button */}
          <div className="pt-4 border-t px-6">
            <Button onClick={handleOpenBrandConfiguration} variant="outline">
              <Settings2 className="h-4 w-4 mr-2" />
              Configure Brand Kit
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Customize your brand colors, fonts, logo, and more
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

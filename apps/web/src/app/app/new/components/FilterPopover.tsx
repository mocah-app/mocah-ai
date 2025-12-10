"use client";

import { Settings2, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { useOrganization } from "@/contexts/organization-context";
import { toast } from "sonner";

export interface FilterPopoverProps {
  disabled?: boolean;
  includeBrandGuide: boolean;
  onBrandGuideChange: (include: boolean) => void;
}

export default function FilterPopover({
  disabled = false,
  includeBrandGuide,
  onBrandGuideChange,
}: FilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const { activeOrganization } = useOrganization();
  const utils = trpc.useUtils();

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
    onBrandGuideChange(checked);

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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Settings and filters"
          disabled={disabled}
        >
          <Settings2 className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="start">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <div className="flex flex-col gap-0.5">
                <Label
                  htmlFor="brand-guide-toggle"
                  className="text-sm font-medium"
                >
                  Include Brand Guide
                </Label>
                <p className="text-xs text-muted-foreground">
                  Use your brand colors, fonts, and style
                </p>
              </div>
            </div>
            <Switch
              id="brand-guide-toggle"
              checked={includeBrandGuide}
              onCheckedChange={handleToggle}
              disabled={disabled || updatePreferenceMutation.isPending}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

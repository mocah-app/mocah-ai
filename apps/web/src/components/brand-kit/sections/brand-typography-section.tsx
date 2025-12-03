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
import { EMAIL_SAFE_FONTS } from "@mocah/shared";
import { Check } from "lucide-react";

interface BrandTypographySectionProps {
  data: BrandKitData;
  onUpdate: (updates: Partial<BrandKitData>) => void;
  disabled?: boolean;
}

const BORDER_RADIUS_OPTIONS = [
  { value: "0px", label: "None (Square)" },
  { value: "4px", label: "Small (4px)" },
  { value: "8px", label: "Medium (8px)" },
  { value: "12px", label: "Large (12px)" },
  { value: "16px", label: "Extra Large (16px)" },
  { value: "9999px", label: "Full (Pill)" },
];

export function BrandTypographySection({
  data,
  onUpdate,
  disabled,
}: BrandTypographySectionProps) {
  const currentFont = data.fontFamily || "Arial, sans-serif";
  
  return (
    <div className="space-y-8 px-6">
      {/* Section Header */}
      <div>
        <h3 className="text-base font-semibold">Typography & Styling</h3>
        <p className="sr-only">
          Configure fonts and visual styling for your email templates
        </p>
      </div>

      {/* Typography Preview */}
      <div className="p-6 rounded-xl border bg-muted/30">
        <p className="text-xs text-muted-foreground mb-4 font-medium">Preview</p>
        <div
          className="space-y-2"
          style={{ fontFamily: currentFont }}
        >
          <h4 className="text-2xl font-bold" style={{ color: data.primaryColor || "#000" }}>
            {data.companyName || "Your Brand"}
          </h4>
          <p className="text-base text-muted-foreground">
            The quick brown fox jumps over the lazy dog.
          </p>
          <div className="pt-2">
            <button
              className="px-4 py-2 text-white font-medium"
              style={{
                backgroundColor: data.primaryColor || "#3B82F6",
                borderRadius: data.borderRadius || "8px",
              }}
            >
              Sample Button
            </button>
          </div>
        </div>
      </div>

      {/* Font Family Selection */}
      <div className="space-y-3">
        <Label>Font Family</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Email-safe fonts that render consistently across all email clients
        </p>
        {currentFont && (
          <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
            <div className="flex-1">
              <p
                className="text-lg font-bold"
                style={{ fontFamily: currentFont }}
              >
                {currentFont.split(",")[0]}
              </p>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                >
                  Change
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">
                    Select Font
                  </h4>
                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    {EMAIL_SAFE_FONTS.map((font) => (
                      <Button
                        key={font}
                        type="button"
                        variant={
                          currentFont === font
                            ? "secondary"
                            : "ghost"
                        }
                        className="w-full justify-start"
                        onClick={() => onUpdate({ fontFamily: font })}
                      >
                        <span style={{ fontFamily: font }}>
                          {font.split(",")[0]}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Border Radius */}
      <div className="space-y-3">
        <Label>Border Radius</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Corner rounding for buttons and containers
        </p>
        <div className="grid grid-cols-3 gap-2">
          {BORDER_RADIUS_OPTIONS.map((option) => {
            const isSelected = data.borderRadius === option.value;
            
            return (
              <Button
                key={option.value}
                variant={isSelected ? "secondary" : "outline"}
                className="h-auto py-3 flex-col gap-2"
                onClick={() => onUpdate({ borderRadius: option.value })}
                disabled={disabled}
              >
                <div
                  className="w-12 h-8 border-2"
                  style={{
                    borderRadius: option.value,
                    backgroundColor: isSelected ? "hsl(var(--primary) / 0.1)" : "transparent",
                    borderColor: isSelected ? "hsl(var(--primary))" : "hsl(var(--border))",
                  }}
                />
                <span className="text-xs">{option.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Custom Border Radius */}
      <div className="space-y-2">
        <Label htmlFor="customBorderRadius">Custom Border Radius</Label>
        <Input
          id="customBorderRadius"
          value={data.borderRadius || ""}
          onChange={(e) => onUpdate({ borderRadius: e.target.value })}
          placeholder="8px"
          className="font-mono"
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Enter a custom value (e.g., 8px, 0.5rem)
        </p>
      </div>
    </div>
  );
}


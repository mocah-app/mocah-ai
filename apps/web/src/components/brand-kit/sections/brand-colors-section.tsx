"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import type { BrandKitData } from "../brand-configuration-modal";
import { RefreshCw } from "lucide-react";

interface BrandColorsSectionProps {
  data: BrandKitData;
  onUpdate: (updates: Partial<BrandKitData>) => void;
  disabled?: boolean;
}

interface ColorFieldProps {
  label: string;
  description: string;
  value: string | null;
  onChange: (value: string) => void;
  onClear?: () => void;
  disabled?: boolean;
}

function ColorField({ label, description, value, onChange, onClear, disabled }: ColorFieldProps) {
  const displayValue = value || "";
  
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <ColorPicker
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
        <Input
          type="text"
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 font-mono text-sm uppercase"
          disabled={disabled}
        />
        {value && onClear && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            disabled={disabled}
            className="shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground/80 text-pretty">{description}</p>
    </div>
  );
}

export function BrandColorsSection({
  data,
  onUpdate,
  disabled,
}: BrandColorsSectionProps) {
  return (
    <div className="space-y-8 px-6">
      {/* Section Header */}
      <div>
        <h3 className="text-base font-semibold">Brand Colors</h3>
        <p className="sr-only">
          Define your brand's color palette for consistent email templates
        </p>
      </div>

      {/* Color Preview */}
      <div className="p-4 rounded-xl border bg-muted/30">
        <p className="text-xs text-muted-foreground mb-3 font-medium">Preview</p>
        <div className="flex gap-3">
          {[
            { label: "Primary", color: data.primaryColor },
            { label: "Accent", color: data.accentColor },
            { label: "Background", color: data.backgroundColor },
            { label: "Text", color: data.textPrimaryColor },
          ].map((item) => (
            <div key={item.label} className="flex-1 text-center">
              <div
                className="h-16 rounded-lg border shadow-sm mb-2"
                style={{ backgroundColor: item.color || "#E5E7EB" }}
              />
              <div className="flex items-center justify-center gap-2">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-xs font-mono text-muted-foreground">{item.color || "—"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

<div className="grid grid-cols-2 gap-8">
      {/* Primary Color */}
      <ColorField
        label="Primary Color"
        description="Used for buttons, links, and key elements"
        value={data.primaryColor}
        onChange={(value) => onUpdate({ primaryColor: value })}
        disabled={disabled}
        
      />

      {/* Accent Color */}
      <ColorField
        label="Accent Color"
        description="Used for highlights and accents"
        value={data.accentColor}
        onChange={(value) => onUpdate({ accentColor: value })}
        onClear={() => onUpdate({ accentColor: null })}
        disabled={disabled}
      />

      {/* Background Color */}
      <ColorField
        label="Background Color"
        description="Used as the default background color"
        value={data.backgroundColor}
        onChange={(value) => onUpdate({ backgroundColor: value })}
        onClear={() => onUpdate({ backgroundColor: null })}
        disabled={disabled}
      />

      {/* Text Color */}
      <ColorField
        label="Text Color"
        description="Used as the primary text color"
        value={data.textPrimaryColor}
        onChange={(value) => onUpdate({ textPrimaryColor: value })}
        onClear={() => onUpdate({ textPrimaryColor: null })}
          disabled={disabled}
        />
      </div>
    </div>
  );
}


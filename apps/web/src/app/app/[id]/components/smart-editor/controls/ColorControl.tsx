"use client";

import React, { useState, useCallback, useEffect } from "react";
import { colord } from "colord";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ColorPickerContent } from "@/components/ui/color-picker";
import { cn } from "@/lib/utils";
import { COLOR_PRESETS } from "../constants/editor-constants";
import { RotateCcw, Pipette } from "lucide-react";

// Checkerboard pattern for transparent backgrounds
const CHECKERBOARD_STYLE = {
  backgroundImage:
    "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
  backgroundSize: "8px 8px",
  backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
};

interface ColorControlProps {
  label?: string;
  value: string | undefined;
  onChange: (value: string) => void;
  defaultValue?: string;
  placeholder?: string;
  showPresets?: boolean;
  showAlpha?: boolean;
  className?: string;
  presets?: readonly string[];
}

export function ColorControl({
  label,
  value,
  onChange,
  defaultValue,
  placeholder = "#000000",
  showPresets = false,
  className,
  presets,
}: ColorControlProps) {
  const [open, setOpen] = useState(false);
  const isTransparent = value === "transparent" || !value;
  const [inputValue, setInputValue] = useState(
    isTransparent ? "transparent" : value || ""
  );

  // Sync input value with prop value
  useEffect(() => {
    setInputValue(isTransparent ? "transparent" : value || "");
  }, [value, isTransparent]);

  // Validate color
  const isValidColor = useCallback((color: string): boolean => {
    if (color === "transparent" || !color) return true;
    return colord(color).isValid();
  }, []);

  // Handle input change with validation
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);

      if (newValue === "transparent" || !newValue) {
        onChange("transparent");
      } else if (isValidColor(newValue)) {
        onChange(colord(newValue).toHex());
      }
    },
    [onChange, isValidColor]
  );

  // Handle input blur - revert to valid value if invalid
  const handleInputBlur = useCallback(() => {
    if (!isValidColor(inputValue) && inputValue !== "transparent") {
      setInputValue(isTransparent ? "transparent" : value || "");
    }
  }, [inputValue, value, isValidColor, isTransparent]);

  // Handle reset
  const handleReset = useCallback(() => {
    onChange(defaultValue || "");
  }, [defaultValue, onChange]);

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label className="text-xs text-muted-foreground">{label}</Label>
      )}

      <div className="flex gap-2">
        {/* Color input with preview */}
        <div className="flex-1 relative">
          <div
            className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded border border-border overflow-hidden"
            style={CHECKERBOARD_STYLE}
          >
            <div
              className="w-full h-full"
              style={{
                backgroundColor: isTransparent ? "transparent" : value,
                ...(isTransparent ? CHECKERBOARD_STYLE : {}),
              }}
            />
          </div>
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            className={cn(
              "h-9 pl-9 w-full bg-muted/50 border-border font-mono text-xs",
              !isValidColor(inputValue) &&
                inputValue &&
                "border-destructive focus-visible:ring-destructive"
            )}
          />
        </div>

        {/* Color Picker Popover */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              aria-label="Pick color"
            >
              <Pipette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="end">
            <ColorPickerContent value={value} onChange={onChange} />
          </PopoverContent>
        </Popover>

        {/* Reset Button */}
        {(defaultValue || value) && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={handleReset}
            aria-label="Reset color"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Inline Presets */}
      {showPresets && (
        <div className="flex flex-wrap gap-1 pt-1">
          {(presets || COLOR_PRESETS).map((color, index) => {
            const isPresetTransparent = color === "transparent";
            const isSelected =
              value === color ||
              (isPresetTransparent && (!value || value === "transparent"));

            return (
              <button
                key={`${index}-${color}`}
                type="button"
                onClick={() => onChange(isPresetTransparent ? "transparent" : color)}
                className={cn(
                  "w-5 h-5 rounded border border-border hover:scale-110 transition-transform",
                  isSelected && "ring-2 ring-primary ring-offset-1"
                )}
                style={{
                  backgroundColor: isPresetTransparent ? "transparent" : color,
                  ...(isPresetTransparent ? CHECKERBOARD_STYLE : {}),
                }}
                aria-label={`Select ${isPresetTransparent ? "transparent" : color}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

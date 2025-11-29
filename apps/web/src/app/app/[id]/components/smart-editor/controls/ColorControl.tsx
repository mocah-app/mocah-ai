"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { colord, extend } from "colord";
import a11yPlugin from "colord/plugins/a11y";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { COLOR_PRESETS } from "../constants/editor-constants";
import { RotateCcw, Pipette } from "lucide-react";

// Extend colord with accessibility plugin
extend([a11yPlugin]);

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

interface HSLColor {
  h: number;
  s: number;
  l: number;
  a: number;
}

export function ColorControl({
  label,
  value,
  onChange,
  defaultValue,
  placeholder = "#000000",
  showPresets = false,
  showAlpha = false,
  className,
  presets,
}: ColorControlProps) {
  const [open, setOpen] = useState(false);
  const isTransparent = value === 'transparent' || !value;
  const [inputValue, setInputValue] = useState(isTransparent ? "transparent" : (value || ""));

  // Parse current color to HSL
  // When transparent, use a default color for the picker UI (but don't change the actual value)
  const hsl = useMemo((): HSLColor => {
    if (isTransparent) {
      // Use a default color for picker display (white with full opacity)
      return { h: 0, s: 0, l: 100, a: 1 };
    }
    const parsed = colord(value || "#000000");
    if (!parsed.isValid()) {
      return { h: 0, s: 0, l: 0, a: 1 };
    }
    const { h, s, l, a } = parsed.toHsl();
    return { h, s, l, a };
  }, [value, isTransparent]);

  // Sync input value with prop value
  useEffect(() => {
    setInputValue(isTransparent ? "transparent" : (value || ""));
  }, [value, isTransparent]);

  // Validate color
  const isValidColor = useCallback((color: string): boolean => {
    if (color === 'transparent' || !color) return true;
    return colord(color).isValid();
  }, []);

  // Handle HSL slider changes
  const handleHslChange = useCallback(
    (key: keyof HSLColor, newValue: number) => {
      // If currently transparent, convert to visible color when user interacts
      const baseHsl = isTransparent ? { h: 0, s: 0, l: 100, a: 1 } : hsl;
      const newHsl = { ...baseHsl, [key]: newValue };
      const newColor = colord({
        h: newHsl.h,
        s: newHsl.s,
        l: newHsl.l,
        a: newHsl.a,
      });
      onChange(newColor.toHex());
    },
    [hsl, onChange, isTransparent]
  );

  // Handle 2D color picker changes (updates both saturation and lightness)
  const handleColorPickerChange = useCallback(
    (s: number, l: number) => {
      // If currently transparent, convert to visible color when user interacts
      const baseHsl = isTransparent ? { h: 0, s: 0, l: 100, a: 1 } : hsl;
      const newHsl = { ...baseHsl, s, l };
      const newColor = colord({
        h: newHsl.h,
        s: newHsl.s,
        l: newHsl.l,
        a: newHsl.a,
      });
      onChange(newColor.toHex());
    },
    [hsl, onChange, isTransparent]
  );

  // Handle input change with validation
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);

      if (newValue === 'transparent' || !newValue) {
        onChange('transparent');
      } else if (isValidColor(newValue)) {
        onChange(colord(newValue).toHex());
      }
    },
    [onChange, isValidColor]
  );

  // Handle input blur - revert to valid value if invalid
  const handleInputBlur = useCallback(() => {
    if (!isValidColor(inputValue) && inputValue !== 'transparent') {
      setInputValue(isTransparent ? "transparent" : (value || ""));
    }
  }, [inputValue, value, isValidColor, isTransparent]);

  // Handle reset
  const handleReset = useCallback(() => {
    if (defaultValue) {
      onChange(defaultValue);
    } else {
      onChange("");
    }
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
            style={{
              backgroundImage:
                "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
              backgroundSize: "8px 8px",
              backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
            }}
          >
            <div
              className="w-full h-full"
              style={{ 
                backgroundColor: isTransparent ? "transparent" : (value || "transparent"),
                backgroundImage: isTransparent
                  ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                  : undefined,
                backgroundSize: isTransparent ? "8px 8px" : undefined,
                backgroundPosition: isTransparent ? "0 0, 0 4px, 4px -4px, -4px 0px" : undefined,
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
            <div className="space-y-3">
              {/* RGB Value Display */}
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded border border-border shrink-0"
                  style={{ 
                    backgroundColor: isTransparent ? "transparent" : (value || "transparent"),
                    backgroundImage: isTransparent
                      ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                      : undefined,
                    backgroundSize: isTransparent ? "8px 8px" : undefined,
                    backgroundPosition: isTransparent ? "0 0, 0 4px, 4px -4px, -4px 0px" : undefined,
                  }}
                />
                <Input
                  value={isTransparent ? "transparent" : colord(value || "#000000").toHex()}
                  onChange={(e) => {
                    const newValue = e.target.value.trim();
                    if (newValue === 'transparent' || !newValue) {
                      onChange('transparent');
                    } else if (isValidColor(newValue)) {
                      // Convert to hex format
                      const parsed = colord(newValue);
                      if (parsed.isValid()) {
                        onChange(parsed.toHex());
                      }
                    }
                  }}
                  className="font-mono text-xs h-8 flex-1"
                  placeholder="#000000"
                />
              </div>

              {/* 2D Color Picker */}
              <div className="relative">
                <div
                  className="w-full aspect-square max-h-40 rounded-lg border border-border overflow-hidden cursor-crosshair relative select-none"
                  style={{
                    background: `
                      linear-gradient(to top, hsl(${hsl.h}, 100%, 0%) 0%, transparent 50%, hsl(${hsl.h}, 100%, 100%) 100%),
                      linear-gradient(to right, hsl(${hsl.h}, 0%, 50%), hsl(${hsl.h}, 100%, 50%))
                    `,
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
                    const s = x * 100;
                    const l = (1 - y) * 100;
                    handleColorPickerChange(s, l);
                  }}
                  onMouseMove={(e) => {
                    if (e.buttons === 1) {
                      e.preventDefault();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
                      const s = x * 100;
                      const l = (1 - y) * 100;
                      handleColorPickerChange(s, l);
                    }
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
                    const y = Math.max(0, Math.min(1, (touch.clientY - rect.top) / rect.height));
                    const s = x * 100;
                    const l = (1 - y) * 100;
                    handleColorPickerChange(s, l);
                  }}
                  onTouchMove={(e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
                    const y = Math.max(0, Math.min(1, (touch.clientY - rect.top) / rect.height));
                    const s = x * 100;
                    const l = (1 - y) * 100;
                    handleColorPickerChange(s, l);
                  }}
                >
                  {/* Selector indicator */}
                  <div
                    className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${hsl.s}%`,
                      top: `${100 - hsl.l}%`,
                      backgroundColor: isTransparent 
                        ? colord({ h: hsl.h, s: hsl.s, l: hsl.l }).toHex()
                        : (value || "#000000"),
                    }}
                  />
                </div>
              </div>

              {/* Hue Slider */}
              <div className="relative">
                <div
                  className="h-4 rounded-full overflow-hidden cursor-pointer select-none"
                  style={{
                    background:
                      "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    handleHslChange("h", x * 360);
                  }}
                  onMouseMove={(e) => {
                    if (e.buttons === 1) {
                      e.preventDefault();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                      handleHslChange("h", x * 360);
                    }
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
                    handleHslChange("h", x * 360);
                  }}
                  onTouchMove={(e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
                    handleHslChange("h", x * 360);
                  }}
                >
                  {/* Hue selector indicator */}
                  <div
                    className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-1/2 top-1/2"
                    style={{
                      left: `${(hsl.h / 360) * 100}%`,
                      backgroundColor: colord({ h: hsl.h, s: 100, l: 50 }).toHex(),
                    }}
                  />
                </div>
              </div>

              
            </div>
          </PopoverContent>
        </Popover>

        {/* Reset Button (outside popover for quick access) */}
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

      {/* Inline Presets (when not in popover) */}
      {showPresets && (() => {
        const colorPresets = presets || COLOR_PRESETS;
        return (
          <div className="flex flex-wrap gap-1 pt-1">
            {colorPresets.map((color) => {
              const isTransparent = color === 'transparent';
              const isSelected = value === color || (isTransparent && (!value || value === 'transparent'));
              
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => onChange(isTransparent ? 'transparent' : color)}
                  className={cn(
                    "w-5 h-5 rounded border border-border hover:scale-110 transition-transform relative",
                    isSelected && "ring-2 ring-primary ring-offset-1"
                  )}
                  style={{
                    backgroundColor: isTransparent ? 'transparent' : color,
                    backgroundImage: isTransparent
                      ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                      : undefined,
                    backgroundSize: isTransparent ? "8px 8px" : undefined,
                    backgroundPosition: isTransparent ? "0 0, 0 4px, 4px -4px, -4px 0px" : undefined,
                  }}
                  aria-label={`Select ${isTransparent ? 'transparent' : color}`}
                />
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}

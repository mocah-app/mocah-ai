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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { COLOR_PRESETS } from "../constants/editor-constants";
import { RotateCcw, Pipette, Copy, Check } from "lucide-react";

// Extend colord with accessibility plugin
extend([a11yPlugin]);

type ColorFormat = "hex" | "rgb" | "hsl";

interface ColorControlProps {
  label?: string;
  value: string | undefined;
  onChange: (value: string) => void;
  defaultValue?: string;
  placeholder?: string;
  showPresets?: boolean;
  showAlpha?: boolean;
  className?: string;
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
}: ColorControlProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ColorFormat>("hex");
  const [copied, setCopied] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");

  // Parse current color to HSL
  const hsl = useMemo((): HSLColor => {
    const parsed = colord(value || "#000000");
    if (!parsed.isValid()) {
      return { h: 0, s: 0, l: 0, a: 1 };
    }
    const { h, s, l, a } = parsed.toHsl();
    return { h, s, l, a };
  }, [value]);

  // Sync input value with prop value
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  // Validate and format color
  const isValidColor = useCallback((color: string): boolean => {
    return colord(color).isValid();
  }, []);

  // Convert color to different formats
  const formatColor = useCallback((color: string, fmt: ColorFormat): string => {
    const c = colord(color);
    if (!c.isValid()) return color;

    switch (fmt) {
      case "hex":
        return c.toHex();
      case "rgb":
        return c.toRgbString();
      case "hsl":
        return c.toHslString();
      default:
        return c.toHex();
    }
  }, []);

  // Handle HSL slider changes
  const handleHslChange = useCallback(
    (key: keyof HSLColor, newValue: number) => {
      const newHsl = { ...hsl, [key]: newValue };
      const newColor = colord({
        h: newHsl.h,
        s: newHsl.s,
        l: newHsl.l,
        a: newHsl.a,
      });
      onChange(newColor.toHex());
    },
    [hsl, onChange]
  );

  // Handle input change with validation
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);

      if (isValidColor(newValue)) {
        onChange(colord(newValue).toHex());
      }
    },
    [onChange, isValidColor]
  );

  // Handle input blur - revert to valid value if invalid
  const handleInputBlur = useCallback(() => {
    if (!isValidColor(inputValue)) {
      setInputValue(value || "");
    }
  }, [inputValue, value, isValidColor]);

  // Handle reset
  const handleReset = useCallback(() => {
    if (defaultValue) {
      onChange(defaultValue);
    } else {
      onChange("");
    }
  }, [defaultValue, onChange]);

  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    if (value) {
      await navigator.clipboard.writeText(formatColor(value, format));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [value, format, formatColor]);

  // Get display value based on format
  const displayValue = useMemo(() => {
    if (!value) return "";
    return formatColor(value, format);
  }, [value, format, formatColor]);

  // Determine if text should be light or dark on the color swatch
  const swatchTextColor = useMemo(() => {
    if (!value) return "#000000";
    const c = colord(value);
    return c.isLight() ? "#000000" : "#ffffff";
  }, [value]);

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
              style={{ backgroundColor: value || "transparent" }}
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
          <PopoverContent className="w-72 p-3" align="end">
            <div className="space-y-4">
              {/* Color Preview */}
              <div
                className="h-20 rounded-lg border border-border overflow-hidden relative"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, #e0e0e0 25%, transparent 25%), linear-gradient(-45deg, #e0e0e0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e0e0e0 75%), linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)",
                  backgroundSize: "16px 16px",
                  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                }}
              >
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ backgroundColor: value || "transparent" }}
                >
                  <span
                    className="font-mono text-xs font-medium px-2 py-1 rounded bg-black/10 backdrop-blur-sm"
                    style={{ color: swatchTextColor }}
                  >
                    {displayValue || "No color"}
                  </span>
                </div>
              </div>

              {/* HSL Sliders */}
              <div className="space-y-3">
                {/* Hue Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Label className="text-xs text-muted-foreground">Hue</Label>
                    <span className="text-xs text-muted-foreground font-mono">
                      {Math.round(hsl.h)}°
                    </span>
                  </div>
                  <div
                    className="h-3 rounded-full overflow-hidden"
                    style={{
                      background:
                        "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
                    }}
                  >
                    <Slider
                      value={[hsl.h]}
                      min={0}
                      max={360}
                      step={1}
                      onValueChange={([v]) => handleHslChange("h", v)}
                      className="**:data-[slot=slider-track]:bg-transparent **:data-[slot=slider-range]:bg-transparent"
                    />
                  </div>
                </div>

                {/* Saturation Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Label className="text-xs text-muted-foreground">
                      Saturation
                    </Label>
                    <span className="text-xs text-muted-foreground font-mono">
                      {Math.round(hsl.s)}%
                    </span>
                  </div>
                  <div
                    className="h-3 rounded-full overflow-hidden"
                    style={{
                      background: `linear-gradient(to right, ${colord({ h: hsl.h, s: 0, l: hsl.l }).toHex()}, ${colord({ h: hsl.h, s: 100, l: hsl.l }).toHex()})`,
                    }}
                  >
                    <Slider
                      value={[hsl.s]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={([v]) => handleHslChange("s", v)}
                      className="**:data-[slot=slider-track]:bg-transparent **:data-[slot=slider-range]:bg-transparent"
                    />
                  </div>
                </div>

                {/* Lightness Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Label className="text-xs text-muted-foreground">
                      Lightness
                    </Label>
                    <span className="text-xs text-muted-foreground font-mono">
                      {Math.round(hsl.l)}%
                    </span>
                  </div>
                  <div
                    className="h-3 rounded-full overflow-hidden"
                    style={{
                      background: `linear-gradient(to right, #000000, ${colord({ h: hsl.h, s: hsl.s, l: 50 }).toHex()}, #ffffff)`,
                    }}
                  >
                    <Slider
                      value={[hsl.l]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={([v]) => handleHslChange("l", v)}
                      className="**:data-[slot=slider-track]:bg-transparent **:data-[slot=slider-range]:bg-transparent"
                    />
                  </div>
                </div>

                {/* Alpha Slider (optional) */}
                {showAlpha && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <Label className="text-xs text-muted-foreground">
                        Opacity
                      </Label>
                      <span className="text-xs text-muted-foreground font-mono">
                        {Math.round(hsl.a * 100)}%
                      </span>
                    </div>
                    <div
                      className="h-3 rounded-full overflow-hidden relative"
                      style={{
                        backgroundImage:
                          "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                        backgroundSize: "8px 8px",
                        backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
                      }}
                    >
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `linear-gradient(to right, transparent, ${colord({ h: hsl.h, s: hsl.s, l: hsl.l }).toHex()})`,
                        }}
                      />
                      <Slider
                        value={[hsl.a * 100]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={([v]) => handleHslChange("a", v / 100)}
                        className="relative **:data-[slot=slider-track]:bg-transparent **:data-[slot=slider-range]:bg-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Format Tabs */}
              <Tabs
                value={format}
                onValueChange={(v) => setFormat(v as ColorFormat)}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="hex" className="flex-1 text-xs">
                    HEX
                  </TabsTrigger>
                  <TabsTrigger value="rgb" className="flex-1 text-xs">
                    RGB
                  </TabsTrigger>
                  <TabsTrigger value="hsl" className="flex-1 text-xs">
                    HSL
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="hex" className="mt-2">
                  <Input
                    value={displayValue}
                    onChange={(e) => {
                      if (isValidColor(e.target.value)) {
                        onChange(colord(e.target.value).toHex());
                      }
                    }}
                    className="font-mono text-xs h-8"
                    placeholder="#000000"
                  />
                </TabsContent>
                <TabsContent value="rgb" className="mt-2">
                  <Input
                    value={displayValue}
                    onChange={(e) => {
                      if (isValidColor(e.target.value)) {
                        onChange(colord(e.target.value).toHex());
                      }
                    }}
                    className="font-mono text-xs h-8"
                    placeholder="rgb(0, 0, 0)"
                  />
                </TabsContent>
                <TabsContent value="hsl" className="mt-2">
                  <Input
                    value={displayValue}
                    onChange={(e) => {
                      if (isValidColor(e.target.value)) {
                        onChange(colord(e.target.value).toHex());
                      }
                    }}
                    className="font-mono text-xs h-8"
                    placeholder="hsl(0, 0%, 0%)"
                  />
                </TabsContent>
              </Tabs>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={handleCopy}
                  disabled={!value}
                >
                  {copied ? (
                    <Check className="h-3 w-3 mr-1" />
                  ) : (
                    <Copy className="h-3 w-3 mr-1" />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              </div>

              {/* Presets */}
              {showPresets && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Presets
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => onChange(color)}
                        className={cn(
                          "w-6 h-6 rounded border border-border hover:scale-110 transition-transform",
                          value === color && "ring-2 ring-primary ring-offset-1"
                        )}
                        style={{ backgroundColor: color }}
                        aria-label={`Select ${color}`}
                      />
                    ))}
                  </div>
                </div>
              )}
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
      {showPresets && (
        <div className="flex flex-wrap gap-1 pt-1">
          {COLOR_PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onChange(color)}
              className={cn(
                "w-5 h-5 rounded border border-border hover:scale-110 transition-transform",
                value === color && "ring-2 ring-primary ring-offset-1"
              )}
              style={{ backgroundColor: color }}
              aria-label={`Select ${color}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

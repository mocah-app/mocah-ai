"use client";

import * as React from "react";
import { colord } from "colord";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface HSL {
  h: number;
  s: number;
  l: number;
}

// Checkerboard pattern for transparent backgrounds
const CHECKERBOARD_STYLE = {
  backgroundImage:
    "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
  backgroundSize: "8px 8px",
  backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
};

/**
 * Hook to manage color picker state and handlers
 */
function useColorPicker(value: string | null | undefined, onChange: (value: string) => void) {
  const isTransparent = value === "transparent" || !value;
  const normalizedValue = isTransparent ? "#FFFFFF" : value;
  const parsed = colord(normalizedValue);
  const isValid = parsed.isValid();
  const displayColor = isValid ? parsed.toHex() : "#FFFFFF";

  const hsl = React.useMemo((): HSL => {
    if (!isValid) return { h: 0, s: 0, l: 100 };
    const { h, s, l } = parsed.toHsl();
    return { h, s, l };
  }, [normalizedValue, isValid]);

  const handlePickerChange = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      onChange(colord({ h: hsl.h, s: x * 100, l: (1 - y) * 100 }).toHex());
    },
    [hsl.h, onChange]
  );

  const handleHueChange = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onChange(colord({ h: x * 360, s: hsl.s, l: hsl.l }).toHex());
    },
    [hsl.s, hsl.l, onChange]
  );

  return { hsl, displayColor, isTransparent, handlePickerChange, handleHueChange };
}

/* -------------------------------------------------------------------------- */
/*                            ColorPickerContent                              */
/* -------------------------------------------------------------------------- */

interface ColorPickerContentProps {
  value: string | null | undefined;
  onChange: (value: string) => void;
  showInput?: boolean;
  className?: string;
}

/**
 * Standalone color picker content - can be used inside any popover/dialog
 */
export function ColorPickerContent({
  value,
  onChange,
  showInput = true,
  className,
}: ColorPickerContentProps) {
  const { hsl, displayColor, isTransparent, handlePickerChange, handleHueChange } =
    useColorPicker(value, onChange);

  const handlePickerDrag = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.buttons === 1) handlePickerChange(e);
    },
    [handlePickerChange]
  );

  const handleHueDrag = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.buttons === 1) handleHueChange(e);
    },
    [handleHueChange]
  );

  return (
    <div className={cn("space-y-3", className)}>
      {showInput && (
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded border border-border shrink-0"
            style={{
              backgroundColor: isTransparent ? "transparent" : displayColor,
              ...(isTransparent ? CHECKERBOARD_STYLE : {}),
            }}
          />
          <Input
            value={isTransparent ? "transparent" : displayColor.toUpperCase()}
            onChange={(e) => {
              const val = e.target.value.trim();
              if (val === "transparent" || !val) {
                onChange("transparent");
              } else if (colord(val).isValid()) {
                onChange(colord(val).toHex());
              }
            }}
            className="font-mono text-xs h-8 uppercase flex-1"
            placeholder="#000000"
          />
        </div>
      )}

      {/* 2D Saturation/Lightness picker */}
      <div
        className="w-full aspect-square max-h-40 rounded-lg border border-border overflow-hidden cursor-crosshair select-none relative"
        style={{
          background: `
            linear-gradient(to top, hsl(${hsl.h}, 100%, 0%) 0%, transparent 50%, hsl(${hsl.h}, 100%, 100%) 100%),
            linear-gradient(to right, hsl(${hsl.h}, 0%, 50%), hsl(${hsl.h}, 100%, 50%))
          `,
        }}
        onMouseDown={handlePickerChange}
        onMouseMove={handlePickerDrag}
        onTouchStart={handlePickerChange}
        onTouchMove={handlePickerChange}
      >
        <div
          className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${hsl.s}%`,
            top: `${100 - hsl.l}%`,
            backgroundColor: displayColor,
          }}
        />
      </div>

      {/* Hue slider */}
      <div
        className="h-4 rounded-full overflow-hidden cursor-pointer select-none relative"
        style={{
          background:
            "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
        }}
        onMouseDown={handleHueChange}
        onMouseMove={handleHueDrag}
        onTouchStart={handleHueChange}
        onTouchMove={handleHueChange}
      >
        <div
          className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none -translate-x-1/2 top-0"
          style={{
            left: `${(hsl.h / 360) * 100}%`,
            backgroundColor: colord({ h: hsl.h, s: 100, l: 50 }).toHex(),
          }}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               ColorPicker                                  */
/* -------------------------------------------------------------------------- */

interface ColorPickerProps {
  value: string | null | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Drop-in replacement for <input type="color" /> with a popover picker
 */
export function ColorPicker({ value, onChange, disabled, className }: ColorPickerProps) {
  const [open, setOpen] = React.useState(false);
  const { displayColor, isTransparent } = useColorPicker(value, onChange);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "w-14 h-10 rounded-md border border-input cursor-pointer transition-colors",
            "hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          style={{
            backgroundColor: isTransparent ? "transparent" : displayColor,
            ...(isTransparent ? CHECKERBOARD_STYLE : {}),
          }}
          aria-label="Pick color"
        />
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start">
        <ColorPickerContent value={value} onChange={onChange} />
      </PopoverContent>
    </Popover>
  );
}


'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { COLOR_PRESETS } from '../constants/editor-constants';

interface ColorControlProps {
  label?: string;
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  showPresets?: boolean;
  className?: string;
}

export function ColorControl({
  label,
  value,
  onChange,
  placeholder = '#000000',
  showPresets = false,
  className,
}: ColorControlProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label className="text-xs text-muted-foreground">{label}</Label>
      )}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <div
            className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded border border-border"
            style={{ backgroundColor: value || 'transparent' }}
          />
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="h-9 pl-9 w-full bg-muted/50 border-border font-mono text-xs"
          />
        </div>
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 rounded cursor-pointer border border-border bg-transparent"
        />
      </div>
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


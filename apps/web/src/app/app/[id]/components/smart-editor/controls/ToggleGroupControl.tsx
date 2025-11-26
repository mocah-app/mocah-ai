'use client';

import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Italic,
  Strikethrough,
  Underline,
  Undo2,
  Type,
  MoveUp,
} from 'lucide-react';

// Icon mapping for common toggle options
const ICON_MAP: Record<string, React.ReactNode> = {
  // Alignment
  left: <AlignLeft className="h-4 w-4" />,
  center: <AlignCenter className="h-4 w-4" />,
  right: <AlignRight className="h-4 w-4" />,
  justify: <AlignJustify className="h-4 w-4" />,
  // Text decoration
  none: <Undo2 className="h-4 w-4" />,
  underline: <Underline className="h-4 w-4" />,
  'line-through': <Strikethrough className="h-4 w-4" />,
  overline: <MoveUp className="h-4 w-4" />,
  // Font style
  normal: <Type className="h-4 w-4" />,
  italic: <Italic className="h-4 w-4" />,
};

interface ToggleOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface ToggleGroupControlProps {
  label?: string;
  value: string | undefined;
  options: readonly ToggleOption[] | ToggleOption[];
  onChange: (value: string) => void;
  className?: string;
  allowReset?: boolean; // If true, shows reset icon at start
}

export function ToggleGroupControl({
  label,
  value,
  options,
  onChange,
  className,
  allowReset = true,
}: ToggleGroupControlProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label className="text-xs text-muted-foreground">{label}</Label>
      )}
      <ToggleGroup
        type="single"
        value={value || ''}
        onValueChange={(v) => v && onChange(v)}
        className="justify-start bg-muted/50 p-1 rounded-md"
      >
        {allowReset && (
          <ToggleGroupItem
            value=""
            aria-label="Reset"
            className="h-8 w-8 data-[state=on]:bg-background"
          >
            <Undo2 className="h-4 w-4" />
          </ToggleGroupItem>
        )}
        {options.map((opt) => (
          <ToggleGroupItem
            key={opt.value}
            value={opt.value}
            aria-label={opt.label}
            className="h-8 w-8 data-[state=on]:bg-background"
          >
            {opt.icon || ICON_MAP[opt.value] || opt.label.charAt(0)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}


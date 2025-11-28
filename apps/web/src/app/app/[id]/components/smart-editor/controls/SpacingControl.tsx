'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Link2,
  Unlink2,
  Square,
  PanelTopDashed,
  PanelBottomDashed,
  PanelLeftDashed,
  PanelRightDashed,
  PanelTopBottomDashed,
  PanelLeftRightDashed,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SpacingOption {
  value: string;
  label: string;
}

type SpacingMode = 'linked' | 'axis' | 'individual';

interface SpacingValues {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

interface SpacingControlProps {
  label: string;
  value: string | undefined; // Shorthand value like "16px" or "16px 8px" or "16px 8px 24px 12px"
  options: readonly SpacingOption[] | SpacingOption[];
  onChange: (value: string) => void;
  className?: string;
}

// Parse CSS shorthand spacing value into individual values
function parseSpacing(value: string | undefined): SpacingValues {
  if (!value) return { top: undefined, right: undefined, bottom: undefined, left: undefined };
  
  const parts = value.trim().split(/\s+/);
  
  switch (parts.length) {
    case 1:
      // All sides same: "16px"
      return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
    case 2:
      // Vertical | Horizontal: "16px 8px"
      return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
    case 3:
      // Top | Horizontal | Bottom: "16px 8px 24px"
      return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
    case 4:
      // Top | Right | Bottom | Left: "16px 8px 24px 12px"
      return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
    default:
      return { top: undefined, right: undefined, bottom: undefined, left: undefined };
  }
}

// Convert individual values to CSS shorthand
function toShorthand(values: SpacingValues): string {
  const { top, right, bottom, left } = values;
  
  // If all undefined, return empty
  if (!top && !right && !bottom && !left) return '';
  
  // Use defaults for undefined
  const t = top || '0px';
  const r = right || '0px';
  const b = bottom || '0px';
  const l = left || '0px';
  
  // All same
  if (t === r && r === b && b === l) {
    return t;
  }
  
  // Vertical same, horizontal same
  if (t === b && r === l) {
    return `${t} ${r}`;
  }
  
  // Top, horizontal same, bottom different
  if (r === l) {
    return `${t} ${r} ${b}`;
  }
  
  // All different
  return `${t} ${r} ${b} ${l}`;
}

// Determine current mode from value
function detectMode(values: SpacingValues): SpacingMode {
  const { top, right, bottom, left } = values;
  
  // All same or all undefined -> linked
  if ((!top && !right && !bottom && !left) || 
      (top === right && right === bottom && bottom === left)) {
    return 'linked';
  }
  
  // Vertical same and horizontal same -> axis
  if (top === bottom && right === left) {
    return 'axis';
  }
  
  // Otherwise individual
  return 'individual';
}

// Compact select for spacing
function CompactSelect({
  value,
  options,
  onChange,
  icon,
  tooltip,
}: {
  value: string | undefined;
  options: readonly SpacingOption[] | SpacingOption[];
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  tooltip?: string;
}) {
  const content = (
    <Select value={value || ''} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-full bg-muted/50 border-border text-xs gap-1 px-2">
        {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
        <SelectValue placeholder="–" />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-xs">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export function SpacingControl({
  label,
  value,
  options,
  onChange,
  className,
}: SpacingControlProps) {
  const parsedValues = useMemo(() => parseSpacing(value), [value]);
  const detectedMode = useMemo(() => detectMode(parsedValues), [parsedValues]);
  const [mode, setMode] = useState<SpacingMode>(detectedMode);

  // Update value helper
  const updateValue = useCallback(
    (side: 'top' | 'right' | 'bottom' | 'left' | 'all' | 'x' | 'y', newVal: string) => {
      let newValues: SpacingValues;

      switch (side) {
        case 'all':
          newValues = { top: newVal, right: newVal, bottom: newVal, left: newVal };
          break;
        case 'x':
          newValues = { ...parsedValues, left: newVal, right: newVal };
          break;
        case 'y':
          newValues = { ...parsedValues, top: newVal, bottom: newVal };
          break;
        default:
          newValues = { ...parsedValues, [side]: newVal };
      }

      onChange(toShorthand(newValues));
    },
    [parsedValues, onChange]
  );

  // Cycle through modes
  const cycleMode = useCallback(() => {
    const modes: SpacingMode[] = ['linked', 'axis', 'individual'];
    const currentIndex = modes.indexOf(mode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setMode(nextMode);
  }, [mode]);

  const getModeIcon = () => {
    switch (mode) {
      case 'linked':
        return <Link2 className="h-3.5 w-3.5" />;
      case 'axis':
        return <Unlink2 className="h-3.5 w-3.5" />;
      case 'individual':
        return <Square className="h-3.5 w-3.5" />;
    }
  };

  const getModeTooltip = () => {
    switch (mode) {
      case 'linked':
        return 'All sides linked';
      case 'axis':
        return 'Horizontal & Vertical';
      case 'individual':
        return 'Individual sides';
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={cycleMode}
            >
              {getModeIcon()}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">
            {getModeTooltip()} (click to change)
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Linked Mode - Single Control */}
      {mode === 'linked' && (
        <CompactSelect
          value={parsedValues.top}
          options={options}
          onChange={(v) => updateValue('all', v)}
          icon={<Link2 className="h-3 w-3" />}
          tooltip="All sides"
        />
      )}

      {/* Axis Mode - X and Y Controls */}
      {mode === 'axis' && (
        <div className="grid grid-cols-2 gap-2">
          <CompactSelect
            value={parsedValues.left}
            options={options}
            onChange={(v) => updateValue('x', v)}
            icon={<PanelLeftRightDashed className="h-3 w-3" />}
            tooltip="Left & Right"
          />
          <CompactSelect
            value={parsedValues.top}
            options={options}
            onChange={(v) => updateValue('y', v)}
            icon={<PanelTopBottomDashed className="h-3 w-3" />}
            tooltip="Top & Bottom"
          />
        </div>
      )}

      {/* Individual Mode - 4 Controls */}
      {mode === 'individual' && (
        <div className="grid grid-cols-2 gap-2">
          <CompactSelect
            value={parsedValues.top}
            options={options}
            onChange={(v) => updateValue('top', v)}
            icon={<PanelTopDashed className="h-3 w-3" />}
            tooltip="Top"
          />
          <CompactSelect
            value={parsedValues.bottom}
            options={options}
            onChange={(v) => updateValue('bottom', v)}
            icon={<PanelBottomDashed className="h-3 w-3" />}
            tooltip="Bottom"
          />
          <CompactSelect
            value={parsedValues.left}
            options={options}
            onChange={(v) => updateValue('left', v)}
            icon={<PanelLeftDashed className="h-3 w-3" />}
            tooltip="Left"
          />
          <CompactSelect
            value={parsedValues.right}
            options={options}
            onChange={(v) => updateValue('right', v)}
            icon={<PanelRightDashed className="h-3 w-3" />}
            tooltip="Right"
          />
        </div>
      )}
    </div>
  );
}


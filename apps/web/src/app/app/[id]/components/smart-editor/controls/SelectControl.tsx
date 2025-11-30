'use client';

import React, { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectControlProps {
  label?: string;
  value: string | undefined;
  options: readonly SelectOption[] | SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Show custom value in options if not in predefined list */
  allowCustom?: boolean;
}

export function SelectControl({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select...',
  className,
  allowCustom = true,
}: SelectControlProps) {
  // Check if current value is in the predefined options
  const isKnownValue = useMemo(() => {
    if (!value) return true;
    return options.some(opt => opt.value === value);
  }, [value, options]);

  // If value exists but isn't in options, show it as custom
  const hasCustomValue = value && !isKnownValue;

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label className="text-xs text-muted-foreground">{label}</Label>
      )}
      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger 
          className={cn(
            "h-9 bg-muted/50 border-border",
            hasCustomValue && "border-amber-500/50"
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {/* Show custom value option if it exists and isn't in predefined list */}
          {allowCustom && hasCustomValue && (
            <SelectItem 
              key="custom" 
              value={value}
              className="text-amber-600 dark:text-amber-400"
            >
              Custom: {value}
            </SelectItem>
          )}
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}


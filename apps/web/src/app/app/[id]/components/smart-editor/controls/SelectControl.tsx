'use client';

import React from 'react';
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
}

export function SelectControl({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select...',
  className,
}: SelectControlProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label className="text-xs text-muted-foreground">{label}</Label>
      )}
      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger className="h-9 bg-muted/50 border-border">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
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


'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface TextInputControlProps {
  label?: string;
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'url' | 'email';
  className?: string;
}

export function TextInputControl({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  className,
}: TextInputControlProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label className="text-xs text-muted-foreground">{label}</Label>
      )}
      <Input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 bg-muted/50 border-border"
      />
    </div>
  );
}


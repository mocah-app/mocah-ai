'use client';

import React from 'react';
import { PropertySection, TextareaControl } from '../controls';

interface ContentSectionProps {
  content: string | undefined;
  onChange: (content: string) => void;
  label?: string;
}

export function ContentSection({
  content,
  onChange,
  label = 'Content',
}: ContentSectionProps) {
  return (
    <PropertySection label={label}>
      <TextareaControl
        value={content}
        onChange={onChange}
        placeholder="Enter text content..."
        rows={4}
      />
    </PropertySection>
  );
}


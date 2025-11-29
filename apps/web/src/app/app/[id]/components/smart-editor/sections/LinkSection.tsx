'use client';

import React from 'react';
import { PropertySection, TextInputControl } from '../controls';

interface LinkSectionProps {
  href: string | undefined;
  onChange: (href: string) => void;
  label?: string;
}

export function LinkSection({
  href,
  onChange,
  label = 'Link',
}: LinkSectionProps) {
  return (
    <PropertySection label={label}>
      <TextInputControl
        label="URL"
        value={href}
        onChange={onChange}
        type="url"
        placeholder="https://example.com"
      />
    </PropertySection>
  );
}


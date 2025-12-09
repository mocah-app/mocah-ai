'use client';

import React from 'react';
import { PropertySection, TextareaControl } from '../controls';
import { Sparkles, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@mocah/shared';

interface ContentSectionProps {
  content: string | undefined;
  onChange: (content: string) => void;
  label?: string;
  hasNestedFormatting?: boolean;
  onOpenChat?: (text: string) => void;
}

export function ContentSection({
  content,
  onChange,
  label = 'Content',
  hasNestedFormatting = false,
  onOpenChat,
}: ContentSectionProps) {
  const handleEditWithAI = async () => {
    if (!content) return;
    
    // Copy text to clipboard
    try {
      await navigator.clipboard.writeText(content);
    } catch (err) {
      logger.error('Failed to copy text to clipboard:', err as Error);
      // Continue anyway - we'll still open the chat
    }
    
    // Open chat panel with the text
    onOpenChat?.(content);
  };

  return (
    <PropertySection label={label}>
      {hasNestedFormatting ? (
        <div className="space-y-3">
          {/* Read-only display with formatting notice */}
          <div className="rounded-md bg-blue-500/10 border border-blue-500/20 p-3">
            <div className="flex gap-2 mb-2">
              <Lock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-blue-900 dark:text-blue-100 font-medium">
                  Protected Formatting
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                  This text has special formatting (bold, links, etc.) that would be lost if edited directly.
                </p>
              </div>
            </div>
          </div>

          {/* Read-only textarea showing the content */}
          <div className="relative">
            <TextareaControl
              value={content}
              onChange={() => {}} // No-op since it's disabled
              placeholder="Content with formatting..."
              rows={4}
              disabled={true}
            />
          </div>

          {/* AI Edit Button */}
          <Button
            onClick={handleEditWithAI}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Edit with AI Chat
          </Button>
        </div>
      ) : (
        <TextareaControl
          value={content}
          onChange={onChange}
          placeholder="Enter text content..."
          rows={4}
        />
      )}
    </PropertySection>
  );
}

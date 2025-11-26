'use client';

import React from 'react';
import { X, ChevronRight, Component } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EditorHeaderProps {
  breadcrumb: string[];
  elementType?: string;
  onClose: () => void;
}

export function EditorHeader({
  breadcrumb,
  elementType,
  onClose,
}: EditorHeaderProps) {
  return (
    <div className="px-3 py-2 border-b border-border bg-muted/50">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs">
          {breadcrumb.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              )}
              <Badge
                variant={index === breadcrumb.length - 1 ? 'default' : 'secondary'}
                className="text-xs font-normal px-2 py-0.5"
              >
                {index === 0 && <Component className="h-3 w-3 mr-1" />}
                {item}
              </Badge>
            </React.Fragment>
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-6 w-6"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}


'use client';

import React, { useState, useEffect } from 'react';
import { CodeEditor } from './CodeEditor';
import { logger } from '@mocah/shared';

interface HtmlCodeViewerProps {
  reactEmailCode: string;
  cachedHtml?: {
    code: string;
    html: string;
  } | null;
  onHtmlRendered?: (html: string) => void;
  onLoadingChange?: (loading: boolean) => void;
  onErrorChange?: (error: string | null) => void;
  refreshTrigger?: number;
}

export function HtmlCodeViewer({ 
  reactEmailCode, 
  cachedHtml, 
  onHtmlRendered,
  onLoadingChange,
  onErrorChange,
  refreshTrigger = 0,
}: HtmlCodeViewerProps) {
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync local state with parent callbacks
  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  useEffect(() => {
    onErrorChange?.(error);
  }, [error, onErrorChange]);

  // Fetch rendered HTML
  const fetchRenderedHtml = async (forceRefresh = false) => {
    if (!reactEmailCode) {
      setRenderedHtml('<!-- No React Email code to render -->');
      return;
    }

    // Check cache first - only fetch if code changed or forced refresh
    if (!forceRefresh && cachedHtml && cachedHtml.code === reactEmailCode) {
      setRenderedHtml(cachedHtml.html);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/template/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reactEmailCode,
          renderOptions: { pretty: true },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRenderedHtml(data.html);
        // Update cache via callback
        if (onHtmlRendered) {
          onHtmlRendered(data.html);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to render');
        setRenderedHtml(`<!-- Rendering failed: ${errorData.error} -->`);
      }
    } catch (err) {
      logger.error(`Failed to fetch rendered HTML: ${err}`);
      setError(String(err));
      setRenderedHtml(`<!-- Error: ${err} -->`);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch on mount and when code changes
  useEffect(() => {
    fetchRenderedHtml();
  }, [reactEmailCode]);

  // Handle refresh trigger from parent
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchRenderedHtml(true);
    }
  }, [refreshTrigger]);

  return (
    <div className="h-full w-full">
      <CodeEditor
        code={renderedHtml || '<!-- Rendering HTML... -->'}
        onChange={() => {}} // Read-only
        readOnly={true}
        language="html"
      />
    </div>
  );
}


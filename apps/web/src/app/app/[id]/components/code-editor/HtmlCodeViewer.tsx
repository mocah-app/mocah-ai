'use client';

import { 
  renderReactEmailClientSide, 
  clearRenderCache,
  RenderError, 
  RenderErrorCode 
} from '@/lib/react-email';
import { logger } from '@mocah/shared';
import { useEffect, useState } from 'react';
import { CodeEditor } from './CodeEditor';

/** Map error codes to user-friendly messages */
function getErrorMessage(error: unknown): string {
  if (error instanceof RenderError) {
    switch (error.code) {
      case RenderErrorCode.TIMEOUT:
        return "Render timeout - template too complex";
      case RenderErrorCode.COMPONENT_NOT_FOUND:
        return "No valid component found";
      case RenderErrorCode.BABEL_TRANSFORM_FAILED:
        return "Syntax error in code";
      default:
        return error.message;
    }
  }
  return String(error);
}

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

  // Render HTML client-side
  const fetchRenderedHtml = async (forceRefresh = false) => {
    if (!reactEmailCode) {
      setRenderedHtml('<!-- No React Email code to render -->');
      return;
    }

    // Check cache first - only render if code changed or forced refresh
    if (!forceRefresh && cachedHtml && cachedHtml.code === reactEmailCode) {
      setRenderedHtml(cachedHtml.html);
      return;
    }

    // Clear render cache on forced refresh
    if (forceRefresh) {
      clearRenderCache();
    }

    setIsLoading(true);
    setError(null);

    try {
      // Client-side rendering - runs in browser sandbox
      const html = await renderReactEmailClientSide(reactEmailCode);
      setRenderedHtml(html);
      // Update cache via callback
      if (onHtmlRendered) {
        onHtmlRendered(html);
      }
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      logger.error(`Failed to render HTML: ${errorMsg}`);
      setError(errorMsg);
      setRenderedHtml(`<!-- Error: ${errorMsg} -->`);
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


"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  injectElementIds,
  renderReactEmailClientSide,
  clearRenderCache,
  RenderError,
  RenderErrorCode,
} from "@/lib/react-email";
import type { ElementData } from "@/lib/react-email";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useErrorFix } from "../providers/ErrorFixProvider";
import { logger } from "@mocah/shared";
import MocahLoadingIcon from "@/components/mocah-brand/MocahLoadingIcon";

/** Map error codes to user-friendly messages */
function getErrorMessage(error: unknown): string {
  if (error instanceof RenderError) {
    switch (error.code) {
      case RenderErrorCode.TIMEOUT:
        return "Preview took too long to render. Try simplifying your template.";
      case RenderErrorCode.COMPONENT_NOT_FOUND:
        return "No valid component found. Make sure you export a default function.";
      case RenderErrorCode.BABEL_TRANSFORM_FAILED:
        return "Syntax error in your code. Check for typos or invalid JSX.";
      case RenderErrorCode.INPUT_TOO_LARGE:
        return "Template is too large to render. Try reducing the code size.";
      case RenderErrorCode.BABEL_UNAVAILABLE:
        return "Rendering engine not available. Please refresh the page.";
      default:
        return error.message;
    }
  }
  return error instanceof Error ? error.message : "Rendering failed";
}

interface ReactEmailPreviewProps {
  reactEmailCode: string;
  styleDefinitions?: Record<string, React.CSSProperties>;
  onElementSelect?: (elementData: ElementData | null) => void;
  enableSelection?: boolean;
  /** Force re-render key - change this to force a fresh render */
  renderKey?: number;
  /** Callback when rendering completes successfully */
  onRenderComplete?: () => void;
}

// Selection indicator styles to inject into iframe
const getSelectionStyles = (isSafari: boolean) => `
  ${isSafari ? `
  [data-element-id] {
    cursor: pointer !important;
    -webkit-tap-highlight-color: transparent;
  }
  ` : ''}
  
  .mocah-selection-label {
    position: absolute;
    top: -20px;
    left: -1px;
    background: #8b5cf6;
    color: white;
    font-size: 10px;
    font-weight: 500;
    padding: 2px 6px;
    border-radius: 3px 3px 0 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    z-index: 10000;
    pointer-events: none;
    white-space: nowrap;
    line-height: 1.4;
  }
  .mocah-selected-element {
    outline: 1.5px dashed #8b5cf6 !important;
    outline-offset: 0px;
    position: relative;
  }
  .mocah-hover-element {
    outline: 1.5px dashed #8b5cf6 !important;
    outline-offset: 0px;
    cursor: pointer;
  }
`;

export const ReactEmailPreview = ({
  reactEmailCode,
  styleDefinitions,
  onElementSelect,
  enableSelection = false,
  renderKey = 0,
  onRenderComplete,
}: ReactEmailPreviewProps) => {
  const [html, setHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawError, setRawError] = useState<unknown>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null
  );
  const [isSelectableReady, setIsSelectableReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const selectedElementIdRef = useRef<string | null>(null);
  const { onRequestErrorFix } = useErrorFix();

  // Keep ref in sync with state for event handlers
  useEffect(() => {
    selectedElementIdRef.current = selectedElementId;
  }, [selectedElementId]);

  // Reset selectable ready state when enableSelection changes
  useEffect(() => {
    if (enableSelection) {
      setIsSelectableReady(false);
    } else {
      setIsSelectableReady(true);
    }
  }, [enableSelection]);

  // Inject selection styles into iframe
  const injectStyles = useCallback((doc: Document, isSafari: boolean) => {
    if (doc.getElementById("mocah-selection-styles")) return;
    const style = doc.createElement("style");
    style.id = "mocah-selection-styles";
    style.textContent = getSelectionStyles(isSafari);
    doc.head.appendChild(style);
  }, []);

  // Update selection visual indicator
  const updateSelectionIndicator = useCallback(
    (doc: Document, element: Element | null, elementType: string | null) => {
      // Remove existing selection classes and labels
      doc.querySelectorAll(".mocah-selected-element").forEach((el) => {
        el.classList.remove("mocah-selected-element");
      });
      doc.querySelectorAll(".mocah-selection-label").forEach((el) => {
        el.remove();
      });

      if (!element || !elementType) return;

      // Add selection class
      element.classList.add("mocah-selected-element");

      // Create label
      const label = doc.createElement("div");
      label.className = "mocah-selection-label";
      label.textContent = elementType;

      // Make parent relative if needed for label positioning
      const htmlElement = element as HTMLElement;
      const computedStyle = doc.defaultView?.getComputedStyle(htmlElement);
      if (computedStyle?.position === "static") {
        htmlElement.style.position = "relative";
      }

      element.appendChild(label);
    },
    []
  );

  useEffect(() => {
    async function renderEmail() {
      if (!reactEmailCode) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setRawError(null);

      try {
        // If renderKey changed, clear cache to force fresh render
        if (renderKey > 0) {
          clearRenderCache();
        }

        // If selection is enabled, inject element IDs
        const codeToRender = enableSelection
          ? injectElementIds(reactEmailCode)
          : reactEmailCode;

        // Client-side rendering - runs in browser sandbox
        const renderedHtml = await renderReactEmailClientSide(codeToRender);
        setHtml(renderedHtml);
        
        // Notify parent that rendering completed successfully
        if (onRenderComplete) {
          onRenderComplete();
        }
      } catch (err) {
        console.error("Failed to render React Email:", err);
        setError(getErrorMessage(err));
        setRawError(err);
      } finally {
        setIsLoading(false);
      }
    }

    renderEmail();
  }, [reactEmailCode, enableSelection, renderKey]);

  // Handle iframe load for element selection - must be before conditional returns
  const handleIframeLoad = useCallback(() => {
    if (!enableSelection || !onElementSelect) return;

    const iframe = iframeRef.current;
    if (!iframe?.contentDocument) return;

    const doc = iframe.contentDocument;

    // Detect Safari
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    // Inject selection styles
    injectStyles(doc, isSafari);
    
    // Find all selectable elements
    const selectableElements = doc.querySelectorAll("[data-element-id]");
    
    // Attach click handlers to elements with data-element-id
    selectableElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const elementId = element.getAttribute("data-element-id");
      
      // Safari-specific: Ensure element is interactive 
      if (isSafari) {
        htmlElement.style.cursor = 'pointer';
        htmlElement.style.pointerEvents = 'auto';
        (htmlElement.style as any).webkitTouchCallout = 'none';
        (htmlElement.style as any).webkitUserSelect = 'none';
      }
      
      const clickHandler = async (e: Event) => {
        const clickEvent = e as MouseEvent;
        const clickTarget = clickEvent.target as Element;
        
        // Find the closest element with data-element-id from the click target
        const targetElement = clickTarget.closest('[data-element-id]');
        
        // Only handle if this click is meant for THIS specific element
        // In Safari with capture phase, parent elements catch child clicks
        if (targetElement !== element) {
          return;
        }
        
        e.stopPropagation();
        e.preventDefault();

        if (!elementId) return;

        try {
          // Import extractElementData dynamically to avoid circular deps
          const { extractElementData } = await import("@/lib/react-email");

          const elementData = extractElementData(
            element as Element,
            reactEmailCode,
            styleDefinitions || {}
          );

          setSelectedElementId(elementId);
          onElementSelect(elementData);

          // Update visual indicator with element type label
          updateSelectionIndicator(doc, element, elementData?.type || null);
        } catch (error) {
          logger.error("Failed to extract element data:", {
            error,
          });
        }
      };

      const mouseEnterHandler = () => {
        const currentSelectedId = selectedElementIdRef.current;
        if (element.getAttribute("data-element-id") !== currentSelectedId) {
          element.classList.add("mocah-hover-element");
        }
      };

      const mouseLeaveHandler = () => {
        element.classList.remove("mocah-hover-element");
      };
      
      // For Safari, try both normal and capture phase
      if (isSafari) {
        element.addEventListener("click", clickHandler, { capture: true });
        element.addEventListener("click", clickHandler, { capture: false });
      } else {
        element.addEventListener("click", clickHandler);
      }

      // Hover effects
      element.addEventListener("mouseenter", mouseEnterHandler);
      element.addEventListener("mouseleave", mouseLeaveHandler);
    });

    // Mark as ready after a short delay to ensure all handlers are attached
    setTimeout(() => {
      setIsSelectableReady(true);
    }, 100);
  }, [
    enableSelection,
    onElementSelect,
    reactEmailCode,
    styleDefinitions,
    injectStyles,
    updateSelectionIndicator,
  ]);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted/20">
        <div className="text-center">
          <Loader />
          <p className="mt-2 text-sm text-muted-foreground">
            Updating preview...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    const handleFixWithAI = () => {
      const errorDetails = rawError instanceof RenderError 
        ? rawError.message 
        : String(rawError);
      onRequestErrorFix(errorDetails, reactEmailCode);
    };

    return (
      <div className="flex h-full w-full items-center justify-center bg-muted/20">
        <div className="max-w-md rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="mb-2 font-semibold text-destructive">
            Failed to render preview
          </p>
          <p className="text-sm text-destructive/80 mb-4">{error}</p>
          <Button
            onClick={handleFixWithAI}
            variant="default"
            size="sm"
            className="gap-2"
          >
            <Sparkles className="size-4" />
            Fix with AI
          </Button>
        </div>
      </div>
    );
  }

  if (!html) {
    return (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground italic">
        No preview available
      </div>
    );
  }

  // Detect Safari
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  return (
    <div className="w-full h-full overflow-auto max-w-[600px] mx-auto p-2 relative">
      <iframe
        ref={iframeRef}
        srcDoc={html}
        className="w-full h-full border-0"
        sandbox={isSafari ? "allow-same-origin allow-scripts" : "allow-same-origin"}
        title="Email Preview"
        onLoad={enableSelection ? handleIframeLoad : undefined}
      />
      
      {/* Loading overlay while making elements selectable */}
      {enableSelection && !isSelectableReady && (
        <MocahLoadingIcon isLoading={true} size="sm" />
      )}
    </div>
  );
};

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
import { useErrorFix } from "../providers/ErrorFixProvider";
import { logger } from "@mocah/shared";
import MocahLoadingIcon from "@/components/mocah-brand/MocahLoadingIcon";
import { PreviewErrorCard } from "./PreviewErrorCard";

// ============================================================================
// Types
// ============================================================================

interface ValidationErrorProps {
  errors: string[];
  warnings: string[];
  attemptedCode: string;
}

interface ReactEmailPreviewProps {
  reactEmailCode: string;
  styleDefinitions?: Record<string, React.CSSProperties>;
  onElementSelect?: (elementData: ElementData | null) => void;
  enableSelection?: boolean;
  renderKey?: number;
  onRenderComplete?: () => void;
  validationError?: ValidationErrorProps | null;
  onFixValidationError?: (errorDetails: string, code: string) => void;
  onDismissValidationError?: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

/** Map render error codes to user-friendly messages */
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

/** Build prompt for AI to fix validation errors */
function buildValidationFixPrompt(validationError: ValidationErrorProps): string {
  const errorsList = validationError.errors
    .map((e, i) => `${i + 1}. ${e}`)
    .join("\n");

  const warningsList =
    validationError.warnings.length > 0
      ? `\n\n**Warnings (also fix if possible):**\n${validationError.warnings.map((w, i) => `${i + 1}. ${w}`).join("\n")}`
      : "";

  return `The AI generated code that failed validation. Please fix the following issues:

**Errors:**
${errorsList}${warningsList}

Please fix ALL these issues while:
1. Maintaining the exact same visual appearance and layout
2. Using only email-safe CSS properties and React Email components
3. Replacing any unsupported properties with email-compatible alternatives
4. Do NOT use any display, flex, grid, or positioning properties
5. Use <Section>, <Row>, <Column> for table-based layouts
6. Remove all 'as' props from Heading components

Fix all issues in a single pass.`;
}

/** Selection styles injected into the iframe */
const SELECTION_STYLES = `
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

const SAFARI_STYLES = `
  [data-element-id] {
    cursor: pointer !important;
    -webkit-tap-highlight-color: transparent;
  }
`;

function getSelectionStyles(isSafari: boolean): string {
  return isSafari ? SAFARI_STYLES + SELECTION_STYLES : SELECTION_STYLES;
}

function isSafariBrowser(): boolean {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

// ============================================================================
// Component
// ============================================================================

export const ReactEmailPreview = ({
  reactEmailCode,
  styleDefinitions,
  onElementSelect,
  enableSelection = false,
  renderKey = 0,
  onRenderComplete,
  validationError,
  onFixValidationError,
  onDismissValidationError,
}: ReactEmailPreviewProps) => {
  // State
  const [html, setHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawError, setRawError] = useState<unknown>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isSelectableReady, setIsSelectableReady] = useState(false);

  // Refs
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const selectedElementIdRef = useRef<string | null>(null);
  const selectableReadyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attachedHandlersRef = useRef<
    Array<{
      element: Element;
      type: string;
      handler: EventListener;
      options?: boolean | AddEventListenerOptions;
    }>
  >([]);

  // Context
  const { onRequestErrorFix } = useErrorFix();

  // Keep ref in sync with state for event handlers
  useEffect(() => {
    selectedElementIdRef.current = selectedElementId;
  }, [selectedElementId]);

  // Cleanup function to remove all attached event listeners
  const cleanupIframeListeners = useCallback(() => {
    // Clear the timeout
    if (selectableReadyTimeoutRef.current) {
      clearTimeout(selectableReadyTimeoutRef.current);
      selectableReadyTimeoutRef.current = null;
    }

    // Remove all attached event listeners
    attachedHandlersRef.current.forEach(({ element, type, handler, options }) => {
      try {
        element.removeEventListener(type, handler, options);
      } catch {
        // Element may have been removed from DOM
      }
    });
    attachedHandlersRef.current = [];
  }, []);

  // Reset selectable ready state when enableSelection changes
  useEffect(() => {
    setIsSelectableReady(!enableSelection);

    // Cleanup listeners when enableSelection is disabled
    if (!enableSelection) {
      cleanupIframeListeners();
    }
  }, [enableSelection, cleanupIframeListeners]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupIframeListeners();
    };
  }, [cleanupIframeListeners]);

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

      element.classList.add("mocah-selected-element");

      const label = doc.createElement("div");
      label.className = "mocah-selection-label";
      label.textContent = elementType;

      const htmlElement = element as HTMLElement;
      const computedStyle = doc.defaultView?.getComputedStyle(htmlElement);
      if (computedStyle?.position === "static") {
        htmlElement.style.position = "relative";
      }

      element.appendChild(label);
    },
    []
  );

  // Render email when code changes
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
        if (renderKey > 0) {
          clearRenderCache();
        }

        const codeToRender = enableSelection
          ? injectElementIds(reactEmailCode)
          : reactEmailCode;

        const renderedHtml = await renderReactEmailClientSide(codeToRender);
        setHtml(renderedHtml);
        onRenderComplete?.();
      } catch (err) {
        console.error("Failed to render React Email:", err);
        setError(getErrorMessage(err));
        setRawError(err);
      } finally {
        setIsLoading(false);
      }
    }

    renderEmail();
  }, [reactEmailCode, enableSelection, renderKey, onRenderComplete]);

  // Handle iframe load for element selection
  const handleIframeLoad = useCallback(() => {
    // Cleanup previous listeners before attaching new ones
    cleanupIframeListeners();

    if (!enableSelection || !onElementSelect) return;

    const iframe = iframeRef.current;
    if (!iframe?.contentDocument) return;

    const doc = iframe.contentDocument;
    const isSafari = isSafariBrowser();

    injectStyles(doc, isSafari);

    const selectableElements = doc.querySelectorAll("[data-element-id]");

    // Helper to track event listener attachment
    const addTrackedListener = (
      element: Element,
      type: string,
      handler: EventListener,
      options?: boolean | AddEventListenerOptions
    ) => {
      element.addEventListener(type, handler, options);
      attachedHandlersRef.current.push({ element, type, handler, options });
    };

    selectableElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const elementId = element.getAttribute("data-element-id");

      // Safari-specific interactivity
      if (isSafari) {
        htmlElement.style.cursor = "pointer";
        htmlElement.style.pointerEvents = "auto";
        (htmlElement.style as any).webkitTouchCallout = "none";
        (htmlElement.style as any).webkitUserSelect = "none";
      }

      const clickHandler = async (e: Event) => {
        const clickTarget = (e as MouseEvent).target as Element;
        const targetElement = clickTarget.closest("[data-element-id]");

        // Only handle if this click is for THIS specific element
        if (targetElement !== element) return;

        e.stopPropagation();
        e.preventDefault();

        if (!elementId) return;

        try {
          const { extractElementData } = await import("@/lib/react-email");
          const elementData = extractElementData(
            element as Element,
            reactEmailCode,
            styleDefinitions || {}
          );

          setSelectedElementId(elementId);
          onElementSelect(elementData);
          updateSelectionIndicator(doc, element, elementData?.type || null);
        } catch (err) {
          logger.error("Failed to extract element data:", { error: err });
        }
      };

      const mouseEnterHandler = () => {
        if (element.getAttribute("data-element-id") !== selectedElementIdRef.current) {
          element.classList.add("mocah-hover-element");
        }
      };

      const mouseLeaveHandler = () => {
        element.classList.remove("mocah-hover-element");
      };

      // Safari needs both capture phases
      if (isSafari) {
        addTrackedListener(element, "click", clickHandler, { capture: true });
        addTrackedListener(element, "click", clickHandler, { capture: false });
      } else {
        addTrackedListener(element, "click", clickHandler);
      }

      addTrackedListener(element, "mouseenter", mouseEnterHandler);
      addTrackedListener(element, "mouseleave", mouseLeaveHandler);
    });

    selectableReadyTimeoutRef.current = setTimeout(() => setIsSelectableReady(true), 100);
  }, [
    enableSelection,
    onElementSelect,
    reactEmailCode,
    styleDefinitions,
    injectStyles,
    updateSelectionIndicator,
    cleanupIframeListeners,
  ]);

  // ============================================================================
  // Render States
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted/20">
        <div className="text-center">
          <Loader />
          <p className="mt-2 text-sm text-muted-foreground">Updating preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <PreviewErrorCard
        title="Failed to load preview"
        errors={[error]}
        onFixWithAI={() => {
          const errorDetails =
            rawError instanceof RenderError ? rawError.message : String(rawError);
          onRequestErrorFix(errorDetails, reactEmailCode);
        }}
        variant="error"
      />
    );
  }

  if (validationError && onFixValidationError && onDismissValidationError) {
    return (
      <PreviewErrorCard
        title="Some issues were found"
        description={`${validationError.errors.length} issue${validationError.errors.length !== 1 ? "s" : ""} need fixing`}
        errors={validationError.errors}
        warnings={validationError.warnings}
        onFixWithAI={() => {
          const prompt = buildValidationFixPrompt(validationError);
          onFixValidationError(prompt, validationError.attemptedCode);
        }}
        onDismiss={onDismissValidationError}
        variant="warning"
      />
    );
  }

  if (!html) {
    return (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground italic">
        No preview available
      </div>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  const isSafari = isSafariBrowser();

  return (
    <div className="relative mx-auto h-full w-full max-w-[600px] overflow-auto p-2">
      <iframe
        ref={iframeRef}
        srcDoc={html}
        className="h-full w-full border-0"
        sandbox={isSafari ? "allow-same-origin allow-scripts" : "allow-same-origin"}
        title="Email Preview"
        onLoad={enableSelection ? handleIframeLoad : undefined}
      />

      {enableSelection && !isSelectableReady && (
        <MocahLoadingIcon isLoading={true} size="sm" />
      )}
    </div>
  );
};

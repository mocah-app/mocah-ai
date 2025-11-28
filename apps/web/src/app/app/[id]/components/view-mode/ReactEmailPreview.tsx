"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { injectElementIds } from "@/lib/react-email";
import type { ElementData } from "@/lib/react-email";
import Loader from "@/components/loader";

interface ReactEmailPreviewProps {
  reactEmailCode: string;
  styleDefinitions?: Record<string, React.CSSProperties>;
  onElementSelect?: (elementData: ElementData | null) => void;
  enableSelection?: boolean;
  /** Force re-render key - change this to force a fresh render */
  renderKey?: number;
}

// Selection indicator styles to inject into iframe
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

export const ReactEmailPreview = ({
  reactEmailCode,
  styleDefinitions,
  onElementSelect,
  enableSelection = false,
  renderKey = 0,
}: ReactEmailPreviewProps) => {
  const [html, setHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null
  );
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const selectedElementIdRef = useRef<string | null>(null);

  // Keep ref in sync with state for event handlers
  useEffect(() => {
    selectedElementIdRef.current = selectedElementId;
  }, [selectedElementId]);

  // Inject selection styles into iframe
  const injectStyles = useCallback((doc: Document) => {
    if (doc.getElementById("mocah-selection-styles")) return;
    const style = doc.createElement("style");
    style.id = "mocah-selection-styles";
    style.textContent = SELECTION_STYLES;
    doc.head.appendChild(style);
  }, []);

  // Update selection visual indicator
  const updateSelectionIndicator = useCallback((
    doc: Document,
    element: Element | null,
    elementType: string | null
  ) => {
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
  }, []);

  useEffect(() => {
    async function renderEmail() {
      if (!reactEmailCode) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // If selection is enabled, inject element IDs
        const codeToRender = enableSelection
          ? injectElementIds(reactEmailCode)
          : reactEmailCode;

        const response = await fetch("/api/template/render", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reactEmailCode: codeToRender,
            renderOptions: { pretty: true },
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to render email");
        }

        const data = await response.json();
        setHtml(data.html);
      } catch (err) {
        console.error("Failed to render React Email:", err);
        setError(err instanceof Error ? err.message : "Rendering failed");
      } finally {
        setIsLoading(false);
      }
    }

    renderEmail();
  }, [reactEmailCode, enableSelection, renderKey]); // Added renderKey to force re-render

  // Handle iframe load for element selection - must be before conditional returns
  const handleIframeLoad = useCallback(() => {
    if (!enableSelection || !onElementSelect) return;

    const iframe = iframeRef.current;
    if (!iframe?.contentDocument) return;

    const doc = iframe.contentDocument;

    // Inject selection styles
    injectStyles(doc);

    // Attach click handlers to elements with data-element-id
    doc.querySelectorAll("[data-element-id]").forEach((element) => {
      element.addEventListener("click", async (e) => {
        e.stopPropagation();
        e.preventDefault();

        const elementId = element.getAttribute("data-element-id");
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
          console.error("Failed to extract element data:", error);
        }
      });

      // Hover effect
      element.addEventListener("mouseenter", () => {
        const currentSelectedId = selectedElementIdRef.current;
        if (element.getAttribute("data-element-id") !== currentSelectedId) {
          element.classList.add("mocah-hover-element");
        }
      });

      element.addEventListener("mouseleave", () => {
        element.classList.remove("mocah-hover-element");
      });
    });
  }, [enableSelection, onElementSelect, reactEmailCode, styleDefinitions, injectStyles, updateSelectionIndicator]);

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
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted/20">
        <div className="max-w-md rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="mb-2 font-semibold text-destructive">
            Failed to render preview
          </p>
          <p className="text-sm text-destructive/80">{error}</p>
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

  return (
    <div className="w-full h-full overflow-auto max-w-[600px] mx-auto p-2">
      <iframe
        ref={iframeRef}
        srcDoc={html}
        className="w-full h-full border-0"
        sandbox="allow-same-origin"
        title="Email Preview"
        onLoad={enableSelection ? handleIframeLoad : undefined}
      />
    </div>
  );
};

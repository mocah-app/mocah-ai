"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { injectElementIds } from "@/lib/react-email";
import type { ElementData } from "@/lib/react-email";

interface ReactEmailPreviewProps {
  reactEmailCode: string;
  styleDefinitions?: Record<string, React.CSSProperties>;
  onElementSelect?: (elementData: ElementData | null) => void;
  enableSelection?: boolean;
  /** Force re-render key - change this to force a fresh render */
  renderKey?: number;
}

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

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted/20">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">
            Rendering preview...
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

  // Handle iframe load for element selection
  const handleIframeLoad = () => {
    if (!enableSelection || !onElementSelect) return;

    const iframe = iframeRef.current;
    if (!iframe?.contentDocument) return;

    const doc = iframe.contentDocument;

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

          // Visual feedback
          doc.querySelectorAll("[data-element-id]").forEach((el) => {
            (el as HTMLElement).style.outline = "none";
          });
          (element as HTMLElement).style.outline = "2px solid #3b82f6";
        } catch (error) {
          console.error("Failed to extract element data:", error);
        }
      });

      // Hover effect
      element.addEventListener("mouseenter", () => {
        if (element.getAttribute("data-element-id") !== selectedElementId) {
          (element as HTMLElement).style.outline = "2px dashed #3b82f6";
          (element as HTMLElement).style.cursor = "pointer";
        }
      });

      element.addEventListener("mouseleave", () => {
        if (element.getAttribute("data-element-id") !== selectedElementId) {
          (element as HTMLElement).style.outline = "none";
        }
      });
    });
  };

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

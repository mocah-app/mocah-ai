"use client";

import React, { useCallback } from "react";
import { useEditorMode } from "../providers/EditorModeProvider";
import { useTemplate } from "../providers/TemplateProvider";
import { useCanvas } from "../providers/CanvasProvider";
import { EditorShell } from "../smart-editor/EditorShell";
import type { TemplateNodeData } from "../nodes/TemplateNode";
import type { ElementData, ElementUpdates } from "@/lib/react-email";

interface SmartEditorPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SmartEditorPanel = ({
  isOpen,
  onClose,
}: SmartEditorPanelProps) => {
  const { state: editorState } = useEditorMode();
  const { state: canvasState } = useCanvas();
  const { state: templateState } = useTemplate();
  const { selectedElement } = editorState;

  // Get current active node
  const nodes = canvasState.nodes;
  const activeNode =
    nodes.find((n) => n.data.isCurrent) ||
    nodes.find((n) => n.type === "template");

  // Parse ElementData from selected element
  let elementData: ElementData | null = null;
  if (selectedElement && activeNode) {
    try {
      elementData = JSON.parse(selectedElement);
    } catch (e) {
      console.error("Failed to parse element data:", e);
    }
  }

  // Get style definitions from active node
  const styleDefinitions =
    (activeNode?.data as TemplateNodeData)?.template?.styleDefinitions || {};

  // Get brand assets from brand kit
  const brandFont = templateState.brandKit?.fontFamily || null;
  const brandColors = {
    primary: templateState.brandKit?.primaryColor || null,
    secondary: templateState.brandKit?.secondaryColor || null,
    accent: templateState.brandKit?.accentColor || null,
  };

  // Handle live preview updates (DOM manipulation, no save)
  const handlePreviewUpdate = useCallback((elementId: string, updates: ElementUpdates) => {
    // Find the iframe and update the element directly in the DOM
    const iframe = document.querySelector('iframe[title="Email Preview"]') as HTMLIFrameElement;
    if (!iframe?.contentDocument) return;

    const element = iframe.contentDocument.querySelector(`[data-element-id="${elementId}"]`);
    if (!element) return;

    // Apply style updates
    if (updates.styles) {
      Object.entries(updates.styles).forEach(([property, value]) => {
        if (value !== undefined && value !== null) {
          // Convert camelCase to kebab-case for CSS
          const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
          (element as HTMLElement).style.setProperty(cssProperty, String(value));
        }
      });
    }

    // Apply content updates
    if (updates.content !== undefined) {
      const tagName = element.tagName.toLowerCase();
      
      // For buttons/links (typically <a> tags styled as buttons), update textContent directly
      if (tagName === 'a' || tagName === 'button') {
        element.textContent = updates.content;
      } else {
        // For elements that have direct text content as first child, update only the text node
        // to preserve other child elements; otherwise update textContent directly
        const textNode = element.childNodes[0];
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          textNode.textContent = updates.content;
        } else {
          element.textContent = updates.content;
        }
      }
    }

    // Apply attribute updates
    if (updates.attributes) {
      Object.entries(updates.attributes).forEach(([attr, value]) => {
        if (value !== undefined && value !== null) {
          if (attr === 'src' && element.tagName === 'IMG') {
            (element as HTMLImageElement).src = String(value);
          } else if (attr === 'href' && element.tagName === 'A') {
            (element as HTMLAnchorElement).href = String(value);
          } else if (attr === 'alt' && element.tagName === 'IMG') {
            (element as HTMLImageElement).alt = String(value);
          }
        }
      });
    }
  }, []);

  return (
    <EditorShell
      isOpen={isOpen}
      onClose={onClose}
      elementData={elementData}
      styleDefinitions={styleDefinitions}
      onPreviewUpdate={handlePreviewUpdate}
      brandFont={brandFont}
      brandColors={brandColors}
    />
  );
};

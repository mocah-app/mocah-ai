"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { MousePointer } from "lucide-react";
import type { ElementData, ElementUpdates } from "@/lib/react-email";
import { getCurrentStyles } from "@/lib/react-email";
import { cn } from "@/lib/utils";
import { EditorHeader } from "./EditorHeader";
import { useEditorMode } from "../providers/EditorModeProvider";
import {
  TextElementEditor,
  ButtonElementEditor,
  ImageElementEditor,
  LinkElementEditor,
  LayoutElementEditor,
} from "./editors";

export interface BrandColors {
  primary: string | null;
  accent: string | null;
}

interface EditorShellProps {
  isOpen: boolean;
  onClose: () => void;
  elementData: ElementData | null;
  styleDefinitions: Record<string, React.CSSProperties>;
  onPreviewUpdate: (elementId: string, updates: ElementUpdates) => void;
  brandFont?: string | null;
  brandColors?: BrandColors;
}

/**
 * EditorShell - Main container that renders the appropriate editor
 * based on the selected element type.
 * 
 * Changes are accumulated locally and only saved when user clicks "Save"
 */
export function EditorShell({
  isOpen,
  onClose,
  elementData,
  styleDefinitions,
  onPreviewUpdate,
  brandFont,
  brandColors,
}: EditorShellProps) {
  const { actions: editorActions, state: editorState } = useEditorMode();
  
  // Local state for accumulated changes (within current session for this element)
  const [localUpdates, setLocalUpdates] = useState<ElementUpdates>({});
  
  // Get pending changes for the current element from the Map
  const elementPendingChanges = elementData?.id 
    ? editorActions.getPendingChangesForElement(elementData.id) 
    : undefined;

  // Compute current styles with local updates applied
  const currentStyles = useMemo(() => {
    if (!elementData) return {};
    
    const baseStyles = getCurrentStyles(elementData, styleDefinitions);
    // Apply pending styles from the Map for this element
    const pendingStyles = elementPendingChanges?.updates.styles || {};
    const localStyles = localUpdates.styles || {};
    
    return {
      ...baseStyles,
      ...pendingStyles,
      ...localStyles,
    };
  }, [elementData, styleDefinitions, elementPendingChanges, localUpdates.styles]);

  // Compute current content with local updates applied
  const currentContent = useMemo(() => {
    if (!elementData) return "";
    
    // Priority: local updates > pending changes from Map > original
    if (localUpdates.content !== undefined) {
      return localUpdates.content;
    }
    if (elementPendingChanges?.updates.content !== undefined) {
      return elementPendingChanges.updates.content;
    }
    return elementData.content;
  }, [elementData, elementPendingChanges, localUpdates.content]);

  // Compute current attributes with local updates applied
  const currentAttributes = useMemo(() => {
    if (!elementData) return {};
    
    // Apply pending attributes from the Map for this element
    const pendingAttrs = elementPendingChanges?.updates.attributes || {};
    const localAttrs = localUpdates.attributes || {};
    
    return {
      ...elementData.attributes,
      ...pendingAttrs,
      ...localAttrs,
    };
  }, [elementData, elementPendingChanges, localUpdates.attributes]);

  // Reset local updates when element changes
  useEffect(() => {
    setLocalUpdates({});
  }, [elementData?.id]);

  // Handle updates from element editors
  const handleUpdate = useCallback((updates: ElementUpdates) => {
    if (!elementData) return;
    
    // Accumulate local updates
    setLocalUpdates((prev) => ({
      content: updates.content ?? prev.content,
      styles: {
        ...prev.styles,
        ...updates.styles,
      },
      attributes: {
        ...prev.attributes,
        ...updates.attributes,
      },
    }));

    // Update pending changes in context (for SaveDesignEdit visibility)
    editorActions.updatePendingChanges(updates);
    
    // Update preview immediately (visual feedback without saving)
    onPreviewUpdate(elementData.id, updates);
  }, [elementData, editorActions, onPreviewUpdate]);

  // Build breadcrumb
  const breadcrumb = elementData
    ? ["Page", elementData.type.toLowerCase()]
    : ["Page"];

  // Create enhanced element data with local changes applied
  const enhancedElementData = useMemo(() => {
    if (!elementData) return null;
    
    return {
      ...elementData,
      content: currentContent,
      attributes: currentAttributes,
    };
  }, [elementData, currentContent, currentAttributes]);

  return (
    <div
      className={cn(
        "bg-card rounded-r-xl shadow-2xl border border-border overflow-hidden flex flex-col z-40 h-dvh",
        "transition-all duration-300 ease-in-out",
        isOpen
          ? "translate-x-0 opacity-100 w-80"
          : "-translate-x-full opacity-0 pointer-events-none w-0"
      )}
    >
      {/* Header with Breadcrumb */}
      <EditorHeader
        breadcrumb={breadcrumb}
        elementType={elementData?.type}
        onClose={onClose}
      />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {enhancedElementData ? (
          <ElementEditor
            elementData={enhancedElementData}
            currentStyles={currentStyles}
            onUpdate={handleUpdate}
            brandFont={brandFont}
            brandColors={brandColors}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

/**
 * Renders the correct editor component based on element type
 */
function ElementEditor({
  elementData,
  currentStyles,
  onUpdate,
  brandFont,
  brandColors,
}: {
  elementData: ElementData;
  currentStyles: React.CSSProperties;
  onUpdate: (updates: ElementUpdates) => void;
  brandFont?: string | null;
  brandColors?: BrandColors;
}) {
  const props = { elementData, currentStyles, onUpdate, brandFont, brandColors };

  switch (elementData.type) {
    case "Heading":
    case "Text":
      return <TextElementEditor {...props} />;
    case "Button":
      return <ButtonElementEditor {...props} />;
    case "Img":
      return <ImageElementEditor {...props} />;
    case "Link":
      return <LinkElementEditor {...props} />;
    case "Section":
    case "Container":
    case "Row":
    case "Column":
      return <LayoutElementEditor {...props} />;
    default:
      // Generic fallback
      return <TextElementEditor {...props} />;
  }
}

/**
 * Empty state shown when no element is selected
 */
function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center p-6 h-full">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
          <MousePointer className="w-6 h-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            No Element Selected
          </p>
          <p className="text-xs text-muted-foreground max-w-[200px]">
            Click on any element in your email template to edit it
          </p>
        </div>
      </div>
    </div>
  );
}

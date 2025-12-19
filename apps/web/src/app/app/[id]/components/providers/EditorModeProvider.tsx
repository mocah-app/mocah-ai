"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ElementUpdates } from "@/lib/react-email";

type EditorMode = "view" | "code";
type CodeTab = "react" | "html";

// Pending changes for an element
export interface PendingElementChanges {
  elementId: string;
  updates: ElementUpdates;
  originalElement: string; // JSON string of ElementData
}

// Map of elementId -> pending changes for that element
export type PendingChangesMap = Map<string, PendingElementChanges>;

interface EditorModeState {
  globalMode: EditorMode;
  nodeOverrides: Record<string, EditorMode>;
  selectedElement: string | null;
  selectedNode: string | null;
  codeTab: CodeTab;
  designMode: boolean; // Controls whether elements are selectable
  pendingChanges: PendingElementChanges | null; // Current element's pending changes (for backward compat)
  allPendingChanges: PendingChangesMap; // All pending changes across all elements
  previewRenderKey: number; // Increment to force preview re-render
}

export interface EditorModeActions {
  setGlobalMode: (mode: EditorMode) => void;
  setNodeMode: (nodeId: string, mode: EditorMode) => void;
  selectElement: (path: string | null) => void;
  selectNode: (nodeId: string | null) => void;
  setCodeTab: (tab: CodeTab) => void;
  getNodeMode: (nodeId: string) => EditorMode;
  setDesignMode: (enabled: boolean) => void;
  // Pending changes management
  setPendingChanges: (changes: PendingElementChanges | null) => void;
  updatePendingChanges: (updates: ElementUpdates) => void;
  updatePendingChangesForElement: (elementId: string, updates: ElementUpdates, originalElement?: string) => void;
  hasPendingChanges: () => boolean;
  hasAnyPendingChanges: () => boolean;
  clearPendingChanges: () => void;
  clearAllPendingChanges: () => void;
  getAllPendingChanges: () => PendingChangesMap;
  getPendingChangesForElement: (elementId: string) => PendingElementChanges | undefined;
  // Preview re-render
  refreshPreview: () => void;
}

interface EditorModeContextValue {
  state: EditorModeState;
  actions: EditorModeActions;
}

const EditorModeContext = createContext<EditorModeContextValue | undefined>(
  undefined
);

export function useEditorMode() {
  const context = useContext(EditorModeContext);
  if (!context) {
    throw new Error("useEditorMode must be used within EditorModeProvider");
  }
  return context;
}

export function EditorModeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<EditorModeState>({
    globalMode: "view",
    nodeOverrides: {},
    selectedElement: null,
    selectedNode: null,
    codeTab: "react",
    designMode: false, // Default: elements not selectable
    pendingChanges: null,
    allPendingChanges: new Map(),
    previewRenderKey: 0,
  });

  const setGlobalMode = useCallback((mode: EditorMode) => {
    setState((prev) => ({
      ...prev,
      globalMode: mode,
      // Clear node overrides when changing global mode
      nodeOverrides: {},
    }));
  }, []);

  const setNodeMode = useCallback((nodeId: string, mode: EditorMode) => {
    setState((prev) => ({
      ...prev,
      nodeOverrides: {
        ...prev.nodeOverrides,
        [nodeId]: mode,
      },
    }));
  }, []);

  const selectElement = useCallback((path: string | null) => {
    setState((prev) => ({
      ...prev,
      selectedElement: path,
    }));
  }, []);

  const selectNode = useCallback((nodeId: string | null) => {
    setState((prev) => ({
      ...prev,
      selectedNode: nodeId,
    }));
  }, []);

  const setCodeTab = useCallback((tab: CodeTab) => {
    setState((prev) => ({
      ...prev,
      codeTab: tab,
    }));
  }, []);

  const setDesignMode = useCallback((enabled: boolean) => {
    setState((prev) => ({
      ...prev,
      designMode: enabled,
      // Clear selection when disabling design mode
      selectedElement: enabled ? prev.selectedElement : null,
    }));
  }, []);

  const setPendingChanges = useCallback((changes: PendingElementChanges | null) => {
    setState((prev) => ({
      ...prev,
      pendingChanges: changes,
    }));
  }, []);

  const updatePendingChanges = useCallback((updates: ElementUpdates) => {
    setState((prev) => {
      if (!prev.selectedElement) return prev;

      // Parse the element ID from the selected element JSON
      let elementId: string;
      try {
        const parsed = JSON.parse(prev.selectedElement);
        elementId = parsed.id;
      } catch {
        elementId = prev.selectedElement;
      }

      // Get existing changes for this specific element from the Map
      const existingElementChanges = prev.allPendingChanges.get(elementId);
      
      // Merge with existing pending changes for THIS element
      const mergedUpdates: ElementUpdates = {
        content: updates.content ?? existingElementChanges?.updates.content,
        styles: {
          ...existingElementChanges?.updates.styles,
          ...updates.styles,
        },
        attributes: {
          ...existingElementChanges?.updates.attributes,
          ...updates.attributes,
        },
      };

      // Clean up empty objects
      if (mergedUpdates.styles && Object.keys(mergedUpdates.styles).length === 0) {
        delete mergedUpdates.styles;
      }
      if (mergedUpdates.attributes && Object.keys(mergedUpdates.attributes).length === 0) {
        delete mergedUpdates.attributes;
      }

      const newPendingChange: PendingElementChanges = {
        elementId,
        updates: mergedUpdates,
        originalElement: existingElementChanges?.originalElement || prev.selectedElement,
      };

      // Update the Map with changes for this element
      const newAllPendingChanges = new Map(prev.allPendingChanges);
      newAllPendingChanges.set(elementId, newPendingChange);

      return {
        ...prev,
        pendingChanges: newPendingChange, // Keep backward compat for current element
        allPendingChanges: newAllPendingChanges,
      };
    });
  }, []);

  // Check if current element has pending changes
  const hasPendingChanges = useCallback(() => {
    return state.pendingChanges !== null;
  }, [state.pendingChanges]);

  // Check if ANY element has pending changes
  const hasAnyPendingChanges = useCallback(() => {
    return state.allPendingChanges.size > 0;
  }, [state.allPendingChanges]);

  // Clear pending changes for current element only
  const clearPendingChanges = useCallback(() => {
    setState((prev) => {
      if (!prev.pendingChanges) return prev;
      
      const newAllPendingChanges = new Map(prev.allPendingChanges);
      newAllPendingChanges.delete(prev.pendingChanges.elementId);
      
      return {
        ...prev,
        pendingChanges: null,
        allPendingChanges: newAllPendingChanges,
      };
    });
  }, []);

  // Clear ALL pending changes across all elements
  const clearAllPendingChanges = useCallback(() => {
    setState((prev) => ({
      ...prev,
      pendingChanges: null,
      allPendingChanges: new Map(),
    }));
  }, []);

  // Get all pending changes
  const getAllPendingChanges = useCallback(() => {
    return state.allPendingChanges;
  }, [state.allPendingChanges]);

  // Get pending changes for a specific element
  const getPendingChangesForElement = useCallback((elementId: string) => {
    return state.allPendingChanges.get(elementId);
  }, [state.allPendingChanges]);

  // Update pending changes for a specific element (used by undo/redo)
  const updatePendingChangesForElement = useCallback(
    (elementId: string, updates: ElementUpdates, originalElement?: string) => {
      setState((prev) => {
        // Get existing changes for this specific element
        const existingElementChanges = prev.allPendingChanges.get(elementId);

        // Merge with existing pending changes
        const mergedUpdates: ElementUpdates = {
          content: updates.content ?? existingElementChanges?.updates.content,
          styles: {
            ...existingElementChanges?.updates.styles,
            ...updates.styles,
          },
          attributes: {
            ...existingElementChanges?.updates.attributes,
            ...updates.attributes,
          },
        };

        // Clean up empty objects
        if (mergedUpdates.styles && Object.keys(mergedUpdates.styles).length === 0) {
          delete mergedUpdates.styles;
        }
        if (mergedUpdates.attributes && Object.keys(mergedUpdates.attributes).length === 0) {
          delete mergedUpdates.attributes;
        }

        const newPendingChange: PendingElementChanges = {
          elementId,
          updates: mergedUpdates,
          originalElement: originalElement || existingElementChanges?.originalElement || '',
        };

        // Update the Map with changes for this element
        const newAllPendingChanges = new Map(prev.allPendingChanges);
        newAllPendingChanges.set(elementId, newPendingChange);

        // Check if this is the currently selected element
        let isSelectedElement = false;
        if (prev.selectedElement) {
          try {
            const parsed = JSON.parse(prev.selectedElement);
            isSelectedElement = parsed.id === elementId;
          } catch {
            // If parsing fails, check if selectedElement is the elementId itself
            isSelectedElement = prev.selectedElement === elementId;
          }
        }

        return {
          ...prev,
          // Update pendingChanges if this is the currently selected element
          pendingChanges: isSelectedElement ? newPendingChange : prev.pendingChanges,
          allPendingChanges: newAllPendingChanges,
        };
      });
    },
    []
  );

  const refreshPreview = useCallback(() => {
    setState((prev) => ({
      ...prev,
      previewRenderKey: prev.previewRenderKey + 1,
    }));
  }, []);

  const getNodeMode = useCallback(
    (nodeId: string): EditorMode => {
      return state.nodeOverrides[nodeId] || state.globalMode;
    },
    [state.nodeOverrides, state.globalMode]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + E to toggle view/code mode
      if ((e.metaKey || e.ctrlKey) && e.key === "e") {
        e.preventDefault();
        setState((prev) => ({
          ...prev,
          globalMode: prev.globalMode === "view" ? "code" : "view",
        }));
      }

      // Escape to deselect element
      if (e.key === "Escape") {
        setState((prev) => ({
          ...prev,
          selectedElement: null,
        }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const actions: EditorModeActions = {
    setGlobalMode,
    setNodeMode,
    selectElement,
    selectNode,
    setCodeTab,
    getNodeMode,
    setDesignMode,
    setPendingChanges,
    updatePendingChanges,
    updatePendingChangesForElement,
    hasPendingChanges,
    hasAnyPendingChanges,
    clearPendingChanges,
    clearAllPendingChanges,
    getAllPendingChanges,
    getPendingChangesForElement,
    refreshPreview,
  };

  return (
    <EditorModeContext.Provider value={{ state, actions }}>
      {children}
    </EditorModeContext.Provider>
  );
}

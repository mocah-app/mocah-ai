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

interface EditorModeState {
  globalMode: EditorMode;
  nodeOverrides: Record<string, EditorMode>;
  selectedElement: string | null;
  selectedNode: string | null;
  codeTab: CodeTab;
  designMode: boolean; // Controls whether elements are selectable
  pendingChanges: PendingElementChanges | null; // Unsaved changes
  previewRenderKey: number; // Increment to force preview re-render
}

interface EditorModeActions {
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
  hasPendingChanges: () => boolean;
  clearPendingChanges: () => void;
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

      const existingChanges = prev.pendingChanges;
      
      // Merge with existing pending changes
      const mergedUpdates: ElementUpdates = {
        content: updates.content ?? existingChanges?.updates.content,
        styles: {
          ...existingChanges?.updates.styles,
          ...updates.styles,
        },
        attributes: {
          ...existingChanges?.updates.attributes,
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

      return {
        ...prev,
        pendingChanges: {
          elementId: existingChanges?.elementId || prev.selectedElement,
          updates: mergedUpdates,
          originalElement: existingChanges?.originalElement || prev.selectedElement,
        },
      };
    });
  }, []);

  const hasPendingChanges = useCallback(() => {
    return state.pendingChanges !== null;
  }, [state.pendingChanges]);

  const clearPendingChanges = useCallback(() => {
    setState((prev) => ({
      ...prev,
      pendingChanges: null,
    }));
  }, []);

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
    hasPendingChanges,
    clearPendingChanges,
    refreshPreview,
  };

  return (
    <EditorModeContext.Provider value={{ state, actions }}>
      {children}
    </EditorModeContext.Provider>
  );
}

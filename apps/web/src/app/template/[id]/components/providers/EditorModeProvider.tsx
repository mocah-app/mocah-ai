"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

type EditorMode = "view" | "code";
type CodeTab = "react" | "html";

interface EditorModeState {
  globalMode: EditorMode;
  nodeOverrides: Record<string, EditorMode>;
  selectedElement: string | null;
  selectedNode: string | null;
  codeTab: CodeTab;
}

interface EditorModeActions {
  setGlobalMode: (mode: EditorMode) => void;
  setNodeMode: (nodeId: string, mode: EditorMode) => void;
  selectElement: (path: string | null) => void;
  selectNode: (nodeId: string | null) => void;
  setCodeTab: (tab: CodeTab) => void;
  getNodeMode: (nodeId: string) => EditorMode;
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
  };

  return (
    <EditorModeContext.Provider value={{ state, actions }}>
      {children}
    </EditorModeContext.Provider>
  );
}

"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { HistoryManager } from "../../lib/history/HistoryManager";
import {
  BaseCommand,
  type EditorContext,
  type HistoryState,
  type HistoryActions,
  type SerializedElement,
} from "../../lib/history/types";
import { useTemplate } from "./TemplateProvider";
import { useCanvas } from "./CanvasProvider";
import { useEditorMode } from "./EditorModeProvider";

interface HistoryContextValue {
  state: HistoryState;
  actions: HistoryActions;
}

const HistoryContext = createContext<HistoryContextValue | undefined>(
  undefined
);

export function useHistory() {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error("useHistory must be used within HistoryProvider");
  }
  return context;
}

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const { actions: templateActions } = useTemplate();
  const { actions: canvasActions } = useCanvas();
  const { actions: editorModeActions } = useEditorMode();

  // Create editor context
  const editorContext: EditorContext = useMemo(
    () => ({
      templateActions,
      canvasActions,
      editorModeActions,
    }),
    [templateActions, canvasActions, editorModeActions]
  );

  // Create history manager instance (persist across renders)
  const managerRef = useRef<HistoryManager | null>(null);
  if (!managerRef.current) {
    managerRef.current = new HistoryManager(editorContext);
  }

  const manager = managerRef.current;

  // Update context when dependencies change
  React.useEffect(() => {
    manager.updateContext(editorContext);
  }, [manager, editorContext]);

  // State for React re-renders
  const [state, setState] = React.useState<HistoryState>({
    canUndo: false,
    canRedo: false,
    undoCount: 0,
    redoCount: 0,
  });

  // Update state when stack changes
  const updateState = useCallback(() => {
    setState({
      canUndo: manager.canUndo(),
      canRedo: manager.canRedo(),
      undoCount: manager.getUndoStackLength(),
      redoCount: manager.getRedoStackLength(),
    });
  }, [manager]);

  const undo = useCallback(() => {
    manager.undo();
    updateState();
  }, [manager, updateState]);

  const redo = useCallback(() => {
    manager.redo();
    updateState();
  }, [manager, updateState]);

  const canUndo = useCallback(() => {
    return manager.canUndo();
  }, [manager]);

  const canRedo = useCallback(() => {
    return manager.canRedo();
  }, [manager]);

  const recordPropertyChange = useCallback(
    (
      elementId: string,
      property: string,
      oldValue: unknown,
      newValue: unknown,
      elementData: SerializedElement
    ) => {
      manager.recordPropertyChange(
        elementId,
        property,
        oldValue,
        newValue,
        elementData
      );
      updateState();
    },
    [manager, updateState]
  );

  const recordCodeChange = useCallback(
    (
      oldCode: string,
      newCode: string,
      oldStyleDefs: Record<string, React.CSSProperties>,
      newStyleDefs: Record<string, React.CSSProperties>
    ) => {
      manager.recordCodeChange(oldCode, newCode, oldStyleDefs, newStyleDefs);
      updateState();
    },
    [manager, updateState]
  );

  const recordMacroCommand = useCallback(
    (commands: BaseCommand[], description?: string) => {
      manager.recordMacroCommand(commands, description);
      updateState();
    },
    [manager, updateState]
  );

  const clearOnSave = useCallback(() => {
    manager.clearOnSave();
    updateState();
  }, [manager, updateState]);

  // Memoize actions to prevent infinite loops in useEffect hooks
  const actions: HistoryActions = useMemo(() => ({
    undo,
    redo,
    canUndo,
    canRedo,
    recordPropertyChange,
    recordCodeChange,
    recordMacroCommand,
    clearOnSave,
  }), [undo, redo, canUndo, canRedo, recordPropertyChange, recordCodeChange, recordMacroCommand, clearOnSave]);

  return (
    <HistoryContext.Provider value={{ state, actions }}>
      {children}
    </HistoryContext.Provider>
  );
}

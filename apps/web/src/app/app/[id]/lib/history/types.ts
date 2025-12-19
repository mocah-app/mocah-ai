/**
 * History System Types
 * Type definitions for the undo/redo system
 */

import type { TemplateActions } from "../../components/providers/TemplateProvider";
import type { CanvasActions } from "../../components/providers/CanvasProvider";
import type { EditorModeActions } from "../../components/providers/EditorModeProvider";
import type { ElementData } from "@/lib/react-email";

/**
 * EditorContext provides all dependencies needed by commands
 */
export interface EditorContext {
  templateActions: TemplateActions;
  canvasActions: CanvasActions;
  editorModeActions: EditorModeActions;
}

/**
 * Serialized element data (stored as JSON string)
 */
export type SerializedElement = string;

/**
 * Base command interface
 * All commands must implement execute, undo, and canExecute
 */
export abstract class BaseCommand {
  constructor(
    protected context: EditorContext,
    public readonly timestamp: number = Date.now(),
    public readonly description: string = '',
    public readonly type: 'property' | 'code' | 'macro'
  ) {}

  abstract execute(): void;
  abstract undo(): void;
  abstract canExecute(): boolean;
}

/**
 * History state interface
 * Simplified to only expose UI-relevant fields
 */
export interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
}

/**
 * History actions interface
 */
export interface HistoryActions {
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  recordPropertyChange: (
    elementId: string,
    property: string,
    oldValue: unknown,
    newValue: unknown,
    elementData: SerializedElement
  ) => void;
  recordCodeChange: (
    oldCode: string,
    newCode: string,
    oldStyleDefs: Record<string, React.CSSProperties>,
    newStyleDefs: Record<string, React.CSSProperties>
  ) => void;
  recordMacroCommand: (commands: BaseCommand[], description?: string) => void;
  clearOnSave: () => void;
}

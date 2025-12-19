/**
 * HistoryManager
 * Core undo/redo logic with command stack management
 */

import { BaseCommand, type EditorContext, type SerializedElement } from './types';
import {
  PropertyUpdateCommand,
  CodeUpdateCommand,
  MacroCommand,
} from './commands';
import { logger } from '@mocah/shared';

export class HistoryManager {
  private undoStack: BaseCommand[] = [];
  private redoStack: BaseCommand[] = [];
  private isExecuting = false; // Race condition prevention
  private maxStackSize = 50;
  private context: EditorContext;

  constructor(context: EditorContext) {
    this.context = context;
  }

  // Update context when dependencies change
  updateContext(context: EditorContext): void {
    this.context = context;
  }

  pushCommand(command: BaseCommand): void {
    if (this.isExecuting) return; // Prevent during undo/redo

    // Validate before adding
    if (!command.canExecute()) {
      logger.warn('[HistoryManager] Command cannot execute, skipping:', {
        description: command.description,
        type: command.type,
      });
      return;
    }

    // Add to undo stack
    this.undoStack.push(command);

    // Prune if over limit
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift(); // Remove oldest
    }

    // Clear redo stack (new action invalidates redo)
    this.redoStack = [];
  }

  undo(): void {
    if (this.isExecuting || this.undoStack.length === 0) return;

    this.isExecuting = true;
    try {
      const command = this.undoStack.pop();
      if (!command || !command.canExecute()) return;

      try {
        command.undo();
        this.redoStack.push(command);
      } catch (error) {
        logger.error('[HistoryManager] Undo failed', {
          description: command.description,
          type: command.type,
          error,
        });
        // Push command back to undo stack so user can try again
        this.undoStack.push(command);
      }
    } finally {
      this.isExecuting = false;
    }
  }

  redo(): void {
    if (this.isExecuting || this.redoStack.length === 0) return;

    this.isExecuting = true;
    try {
      const command = this.redoStack.pop();
      if (!command || !command.canExecute()) return;

      try {
        command.execute();
        this.undoStack.push(command);
      } catch (error) {
        logger.error('[HistoryManager] Redo failed', {
          description: command.description,
          type: command.type,
          error,
        });
        // Push back to redo stack so user can try again
        this.redoStack.push(command);
      }
    } finally {
      this.isExecuting = false;
    }
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  // Helper methods for different change types
  recordPropertyChange(
    elementId: string,
    property: string,
    oldValue: unknown,
    newValue: unknown,
    elementData: SerializedElement
  ): void {
    const cmd = new PropertyUpdateCommand(
      this.context,
      elementId,
      property,
      oldValue,
      newValue,
      elementData
    );
    this.pushCommand(cmd);
  }

  recordCodeChange(
    oldCode: string,
    newCode: string,
    oldStyleDefs: Record<string, React.CSSProperties>,
    newStyleDefs: Record<string, React.CSSProperties>
  ): void {
    const cmd = new CodeUpdateCommand(
      this.context,
      oldCode,
      newCode,
      oldStyleDefs,
      newStyleDefs
    );
    this.pushCommand(cmd);
  }

  // Clear history when changes are saved (AI generation or manual save)
  clearOnSave(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  // Group multiple property changes (e.g., drag operation)
  recordMacroCommand(commands: BaseCommand[], description?: string): void {
    const macroCmd = new MacroCommand(this.context, commands, description);
    this.pushCommand(macroCmd);
  }

  // Getters
  canUndo(): boolean {
    return this.undoStack.length > 0 && !this.isExecuting;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0 && !this.isExecuting;
  }

  getUndoStackLength(): number {
    return this.undoStack.length;
  }

  getRedoStackLength(): number {
    return this.redoStack.length;
  }
}

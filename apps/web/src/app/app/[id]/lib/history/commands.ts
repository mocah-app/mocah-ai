/**
 * History Commands
 * Command implementations for undo/redo system
 */

import { BaseCommand, type EditorContext, type SerializedElement } from './types';
import type { ElementUpdates } from '@/lib/react-email';
import { logger } from '@mocah/shared';

/**
 * PropertyUpdateCommand - Tracks individual property changes
 */
export class PropertyUpdateCommand extends BaseCommand {
  constructor(
    context: EditorContext,
    private readonly elementId: string,
    private readonly property: string,
    private readonly oldValue: unknown,
    private readonly newValue: unknown,
    private readonly elementData: SerializedElement,
    description?: string
  ) {
    super(
      context,
      Date.now(),
      description ?? `Update ${property}`,
      'property'
    );
  }

  private updatePreview(value: unknown): void {
    // Find the iframe and update the element directly in the DOM
    const iframe = document.querySelector('iframe[title="Email Preview"]') as HTMLIFrameElement;
    if (!iframe?.contentDocument) {
      logger.warn('[PropertyUpdateCommand] Preview iframe not found', {
        elementId: this.elementId,
        property: this.property,
      });
      return;
    }

    const element = iframe.contentDocument.querySelector(`[data-element-id="${this.elementId}"]`);
    if (!element) {
      logger.warn('[PropertyUpdateCommand] Element not found in preview', {
        elementId: this.elementId,
        property: this.property,
      });
      return;
    }

    if (this.property.startsWith('style.')) {
      // Update style property
      const styleProp = this.property.replace('style.', '');
      const cssProperty = styleProp.replace(/([A-Z])/g, '-$1').toLowerCase();
      if (value !== undefined && value !== null) {
        (element as HTMLElement).style.setProperty(cssProperty, String(value));
      }
    } else if (this.property === 'content') {
      // Update content
      const tagName = element.tagName.toLowerCase();
      if (tagName === 'a' || tagName === 'button') {
        element.textContent = String(value ?? '');
      } else {
        const textNode = element.childNodes[0];
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          textNode.textContent = String(value ?? '');
        } else {
          element.textContent = String(value ?? '');
        }
      }
    } else {
      // Update attribute
      if (value !== undefined && value !== null) {
        if (this.property === 'src' && element.tagName === 'IMG') {
          (element as HTMLImageElement).src = String(value);
        } else if (this.property === 'href' && element.tagName === 'A') {
          (element as HTMLAnchorElement).href = String(value);
        } else if (this.property === 'alt' && element.tagName === 'IMG') {
          (element as HTMLImageElement).alt = String(value);
        }
      }
    }

    // Also update pending changes map for consistency
    const updates: ElementUpdates = {};
    if (this.property.startsWith('style.')) {
      const styleProp = this.property.replace('style.', '');
      updates.styles = { [styleProp]: value };
    } else if (this.property === 'content') {
      updates.content = String(value ?? '');
    } else {
      updates.attributes = { [this.property]: value };
    }
    
    // Update pending changes map directly by elementId (works even if element not selected)
    this.context.editorModeActions.updatePendingChangesForElement(
      this.elementId,
      updates,
      this.elementData
    );
  }

  execute(): void {
    this.updatePreview(this.newValue);
  }

  undo(): void {
    this.updatePreview(this.oldValue);
  }

  canExecute(): boolean {
    if (!this.elementId) return false;

    // Check if element still exists in pending changes
    const pendingChanges = this.context.editorModeActions.getPendingChangesForElement(this.elementId);

    // Allow execution if we still track this element in editor state
    if (pendingChanges !== undefined) return true;

    // Fallback: check if element exists in preview DOM
    const iframe = document.querySelector('iframe[title="Email Preview"]') as HTMLIFrameElement | null;
    const existsInDom = iframe?.contentDocument?.querySelector(
      `[data-element-id="${this.elementId}"]`
    ) != null;

    return existsInDom;
  }
}

/**
 * CodeUpdateCommand - Tracks code editor changes
 */
export class CodeUpdateCommand extends BaseCommand {
  constructor(
    context: EditorContext,
    private readonly oldCode: string,
    private readonly newCode: string,
    private readonly oldStyleDefs: Record<string, React.CSSProperties>,
    private readonly newStyleDefs: Record<string, React.CSSProperties>,
    description?: string
  ) {
    super(context, Date.now(), description ?? 'Code edit', 'code');
  }

  execute(): void {
    // Update React Email code synchronously
    this.context.templateActions.updateReactEmailCode(
      this.newCode,
      this.newStyleDefs
    );
  }

  undo(): void {
    // Restore previous code
    this.context.templateActions.updateReactEmailCode(
      this.oldCode,
      this.oldStyleDefs
    );
  }

  canExecute(): boolean {
    // Code always exists
    return true;
  }
}

/**
 * MacroCommand - Groups multiple related commands
 */
export class MacroCommand extends BaseCommand {
  constructor(
    context: EditorContext,
    private readonly commands: BaseCommand[],
    description?: string
  ) {
    super(
      context,
      Date.now(),
      description ?? 'Multiple changes',
      'macro'
    );
  }

  execute(): void {
    // Execute all commands in order
    for (const cmd of this.commands) {
      if (cmd.canExecute()) {
        cmd.execute();
      }
    }
  }

  undo(): void {
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }

  canExecute(): boolean {
    return this.commands.every((cmd) => cmd.canExecute());
  }
}

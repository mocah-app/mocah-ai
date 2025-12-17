'use client';

import React, { forwardRef, useRef, useCallback } from 'react';
import { CodeEditor, type CodeEditorRef } from './CodeEditor';
import { useCanvas } from '../providers/CanvasProvider';
import { useTemplate } from '../providers/TemplateProvider';
import { useHistory } from '../providers/HistoryProvider';
import type { TemplateNodeData } from '../nodes/TemplateNode';

interface ReactEmailCodeEditorProps {
  reactEmailCode: string;
  styleDefinitions?: Record<string, React.CSSProperties>;
  nodeId: string;
  onValidationStateChange?: (errors: string[], warnings: string[]) => void;
  readOnly?: boolean;
}

export const ReactEmailCodeEditor = forwardRef<CodeEditorRef, ReactEmailCodeEditorProps>(
  function ReactEmailCodeEditor({
    reactEmailCode,
    styleDefinitions,
    nodeId,
    onValidationStateChange,
    readOnly = false,
  }, ref) {
  const { actions: canvasActions } = useCanvas();
  const { actions: templateActions } = useTemplate();
  const { actions: historyActions } = useHistory();
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = React.useState<string[]>([]);
  
  // Track previous code for undo/redo
  const previousCodeRef = useRef<string>(reactEmailCode || '');
  const previousStyleDefsRef = useRef<Record<string, React.CSSProperties>>(styleDefinitions || {});
  
  // Debounce timer for recording code changes
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleValidationChange = (isValid: boolean, errors: string[], warnings?: string[]) => {
    setValidationErrors(errors);
    setValidationWarnings(warnings || []);
    // Notify parent of validation state changes
    onValidationStateChange?.(errors, warnings || []);
  };

  // Record code changes to history (debounced)
  const recordCodeChange = useCallback(
    (newCode: string, newStyleDefs: Record<string, React.CSSProperties>) => {
      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new debounce timer
      debounceTimerRef.current = setTimeout(() => {
        const oldCode = previousCodeRef.current;
        const oldStyleDefs = previousStyleDefsRef.current;

        // Only record if code actually changed
        if (oldCode !== newCode || JSON.stringify(oldStyleDefs) !== JSON.stringify(newStyleDefs)) {
          historyActions.recordCodeChange(
            oldCode,
            newCode,
            oldStyleDefs,
            newStyleDefs
          );

          // Update previous values
          previousCodeRef.current = newCode;
          previousStyleDefsRef.current = newStyleDefs;
        }
      }, 500); // 500ms debounce
    },
    [historyActions]
  );

  const handleCodeChange = (newCode: string) => {
    // Update TemplateProvider
    templateActions.updateReactEmailCode(newCode, styleDefinitions);

    // Update canvas node
    canvasActions.setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              template: {
                ...(node.data as TemplateNodeData).template,
                reactEmailCode: newCode,
              },
            },
          };
        }
        return node;
      })
    );

    // Record to history (debounced)
    recordCodeChange(newCode, styleDefinitions || {});
  };
  
  // Initialize previous values when code changes externally
  React.useEffect(() => {
    if (reactEmailCode !== previousCodeRef.current) {
      previousCodeRef.current = reactEmailCode || '';
      previousStyleDefsRef.current = styleDefinitions || {};
    }
  }, [reactEmailCode, styleDefinitions]);

  return (
    <div className="h-full w-full flex flex-col">
      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <CodeEditor
          ref={ref}
          code={reactEmailCode || ''}
          onChange={handleCodeChange}
          onValidationChange={handleValidationChange}
          language="typescript"
          readOnly={readOnly}
        />
      </div>
    </div>
  );
});


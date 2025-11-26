'use client';

import React, { forwardRef } from 'react';
import { CodeEditor, type CodeEditorRef } from './CodeEditor';
import { useCanvas } from '../providers/CanvasProvider';
import { useTemplate } from '../providers/TemplateProvider';
import type { TemplateNodeData } from '../nodes/TemplateNode';

interface ReactEmailCodeEditorProps {
  reactEmailCode: string;
  styleDefinitions?: Record<string, React.CSSProperties>;
  nodeId: string;
  onValidationStateChange?: (errors: string[], warnings: string[]) => void;
}

export const ReactEmailCodeEditor = forwardRef<CodeEditorRef, ReactEmailCodeEditorProps>(
  function ReactEmailCodeEditor({
    reactEmailCode,
    styleDefinitions,
    nodeId,
    onValidationStateChange,
  }, ref) {
  const { actions: canvasActions } = useCanvas();
  const { actions: templateActions } = useTemplate();
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = React.useState<string[]>([]);

  const handleValidationChange = (isValid: boolean, errors: string[], warnings?: string[]) => {
    setValidationErrors(errors);
    setValidationWarnings(warnings || []);
    // Notify parent of validation state changes
    onValidationStateChange?.(errors, warnings || []);
  };

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
  };

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
        />
      </div>
    </div>
  );
});


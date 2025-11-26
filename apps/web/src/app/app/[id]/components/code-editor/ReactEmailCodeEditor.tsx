'use client';

import React from 'react';
import { CodeEditor } from './CodeEditor';
import { useCanvas } from '../providers/CanvasProvider';
import { useTemplate } from '../providers/TemplateProvider';
import type { TemplateNodeData } from '../nodes/TemplateNode';

interface ReactEmailCodeEditorProps {
  reactEmailCode: string;
  styleDefinitions?: Record<string, React.CSSProperties>;
  nodeId: string;
}

export function ReactEmailCodeEditor({
  reactEmailCode,
  styleDefinitions,
  nodeId,
}: ReactEmailCodeEditorProps) {
  const { actions: canvasActions } = useCanvas();
  const { actions: templateActions } = useTemplate();
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = React.useState<string[]>([]);

  const handleValidationChange = (isValid: boolean, errors: string[], warnings?: string[]) => {
    setValidationErrors(errors);
    setValidationWarnings(warnings || []);
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
      {/* Validation Messages */}
      {(validationErrors.length > 0 || validationWarnings.length > 0) && (
        <div className="border-b border-border bg-muted/30 px-3 py-2 space-y-1 max-h-32 overflow-y-auto">
          {validationErrors.length > 0 && (
            <div className="space-y-1">
              {validationErrors.map((error, idx) => (
                <div key={idx} className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1">
                  <span className="font-semibold">❌</span>
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}
          {validationWarnings.length > 0 && (
            <div className="space-y-1">
              {validationWarnings.map((warning, idx) => (
                <div key={idx} className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1">
                  <span className="font-semibold">⚠️</span>
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <CodeEditor
          code={reactEmailCode || ''}
          onChange={handleCodeChange}
          onValidationChange={handleValidationChange}
          language="typescript"
        />
      </div>
    </div>
  );
}


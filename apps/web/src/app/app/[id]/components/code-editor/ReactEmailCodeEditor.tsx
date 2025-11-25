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
    <div className="h-full w-full">
      <CodeEditor
        code={reactEmailCode || ''}
        onChange={handleCodeChange}
        language="typescript"
      />
    </div>
  );
}


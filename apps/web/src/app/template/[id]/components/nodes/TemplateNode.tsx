"use client";

import React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { NodeHeader } from "./NodeHeader";
import { ViewModeContent } from "./ViewModeContent";
import { CodeModeContent } from "./CodeModeContent";
import { useEditorMode } from "../providers/EditorModeProvider";

// Custom data type for template nodes
// Includes index signature to satisfy React Flow's Record<string, unknown> constraint
export interface TemplateNodeData {
  version: number;
  name: string;
  isCurrent: boolean;
  template: {
    subject?: string;
    previewText?: string;
    content: string;
  };
  metadata?: {
    createdAt: Date;
    updatedAt: Date;
    generatedFrom?: string;
  };
  [key: string]: unknown; // Index signature for React Flow compatibility
}

// Props interface for the TemplateNode component
interface TemplateNodeProps {
  data: TemplateNodeData;
  id: string;
}

export function TemplateNode({ data, id }: TemplateNodeProps) {
  const nodeId = id;
  const { actions, state } = useEditorMode();
  const mode = actions.getNodeMode(nodeId);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 w-[800px] overflow-hidden">
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-blue-500"
      />

      {/* Node Header */}
      <NodeHeader
        version={data.version}
        name={data.name}
        isCurrent={data.isCurrent}
        nodeId={nodeId}
        currentMode={mode}
      />

      {/* Node Body */}
      <div className="min-h-[400px] max-h-[600px] overflow-auto">
        {mode === "view" ? (
          <ViewModeContent template={data.template} />
        ) : (
          <CodeModeContent template={data.template} />
        )}
      </div>

      {/* Node Footer */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          {data.metadata?.updatedAt
            ? `Saved ${new Date(data.metadata.updatedAt).toLocaleTimeString()}`
            : "Not saved"}
        </span>
        <button className="text-blue-600 dark:text-blue-400 hover:underline">
          Export
        </button>
      </div>
    </div>
  );
}

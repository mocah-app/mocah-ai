"use client";

import React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { NodeHeader } from "./NodeHeader";
import { ViewModeContent } from "./ViewModeContent";
import { CodeModeContent } from "./CodeModeContent";
import { useEditorMode } from "../providers/EditorModeProvider";
import { Button } from "@/components/ui/button";
import { ChevronRight, Plus } from "lucide-react";

// Custom data type for template nodes
// Includes index signature to satisfy React Flow's Record<string, unknown> constraint
export interface TemplateNodeData {
  version: number;
  name: string;
  isCurrent: boolean;
  isLoading?: boolean; // Loading state for streaming
  template: {
    subject?: string;
    previewText?: string;
    content?: string;
    sections: any[]; // TODO: should we have a proper type for this?
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

  // Show loading state if isLoading is true
  if (data.isLoading) {
    return (
      <div className="bg-background rounded-lg shadow-lg border border-border w-[600px] relative">
        {/* Connection handles - hidden during loading */}
        <Handle
          type="source"
          position={Position.Right}
          className="opacity-0 pointer-events-none"
          style={{
            position: "absolute",
            right: "-20px",
          }}
        />

        {/* Loading Content */}
        <div className="min-h-[500px] flex flex-col items-center justify-center p-12">
          {/* Animated Gradient Orb */}
          <div className="relative mb-8">
            <div className="w-48 h-48 rounded-full bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 animate-pulse opacity-80" />
            <div className="absolute inset-0 w-48 h-48 rounded-full bg-linear-to-tr from-purple-600 via-pink-600 to-orange-500 animate-pulse opacity-60 blur-xl" />
          </div>

          {/* Text */}
          <h3 className="text-2xl font-semibold text-foreground mb-2">
            Breathing life into your email
          </h3>
          <p className="text-muted-foreground text-sm">
            Mocah is doing its magic...
          </p>

          {/* Animated Dots */}
          <div className="flex gap-2 mt-6">
            <div
              className="w-2 h-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="w-2 h-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <div
              className="w-2 h-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-lg shadow-lg border border-border w-[600px] relative">
      {/* Connection handles */}
      <Handle
        type="source"
        position={Position.Right}
        className="flex items-center justify-center"
        style={{
          position: "absolute",
          right: "-20px",
        }}
      >
        <div className="bg-ring rounded-full p-1">
          <Plus className="size-3 text-white" />
        </div>
      </Handle>

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
          <CodeModeContent template={data.template} nodeId={nodeId} />
        )}
      </div>

      {/* Node Footer */}
      <div className="px-2 py-1 bg-muted border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {data.metadata?.updatedAt
            ? `Saved ${new Date(data.metadata.updatedAt).toLocaleTimeString()}`
            : "Not saved"}
        </span>
        <Button variant="link" className="text-primary hover:underline text-xs">
          Branch Out
        </Button>
      </div>
    </div>
  );
}

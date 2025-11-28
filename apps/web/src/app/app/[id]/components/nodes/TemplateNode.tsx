"use client";

import { Handle, Position } from "@xyflow/react";
import { Plus } from "lucide-react";
import React from "react";
import { useEditorMode } from "../providers/EditorModeProvider";
import { CodeModeContent } from "./CodeModeContent";
import { NodeHeader } from "./NodeHeader";
import { ViewModeContent } from "./ViewModeContent";
import MocahLoadingIcon from "@/components/mocah-brand/MocahLoadingIcon";
import { useTemplate, GENERATION_PHASE_MESSAGES } from "../providers/TemplateProvider";

export interface TemplateNodeData {
  version: number;
  name: string;
  isCurrent: boolean;
  isLoading?: boolean; // Loading state for streaming
  template: {
    subject?: string;
    previewText?: string;
    reactEmailCode?: string;
    styleDefinitions?: Record<string, React.CSSProperties>;
  };
  metadata?: {
    createdAt: Date;
    updatedAt: Date;
    generatedFrom?: string;
  };
  [key: string]: unknown;
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
      {data.isLoading ? (
        <LoadingState />
      ) : (
        <div className="h-[600px] overflow-hidden">
          {mode === "view" ? (
            <ViewModeContent template={data.template} />
          ) : (
            <CodeModeContent template={data.template} nodeId={nodeId} />
          )}
        </div>
      )}
      {/* Node Footer */}
      <div className="p-1.5 border-border flex items-center justify-between"></div>
    </div>
  );
}

function LoadingState() {
  const { state } = useTemplate();
  const message = GENERATION_PHASE_MESSAGES[state.generationPhase] || 'Mocah is doing its magic...';
  
  return (
    <div className="bg-background w-full relative">
      {/* Loading Content */}
      <div className="min-h-[500px] flex flex-col items-center justify-center p-12">
        <div className="relative mb-4">
          <MocahLoadingIcon isLoading={true} size="sm" />
        </div>

        {/* Text */}
        <p className="text-muted-foreground text-sm animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
}

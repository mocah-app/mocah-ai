"use client";

import React, { useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCanvas } from "../providers/CanvasProvider";
import { TemplateNode } from "../nodes/TemplateNode";

// Register custom node types
const nodeTypes = {
  template: TemplateNode,
}

export function InfiniteCanvas() {
  const { state, actions } = useCanvas();

  // Fit view on mount
  useEffect(() => {
    // Small delay to ensure nodes are rendered
    const timer = setTimeout(() => {
      // fitView will be called via React Flow's useReactFlow hook if needed
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={state.nodes}
        edges={state.edges}
        onNodesChange={actions.onNodesChange}
        onEdgesChange={actions.onEdgesChange}
        onConnect={actions.onConnect}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        className="bg-gray-50 dark:bg-gray-950"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          className="bg-gray-50 dark:bg-gray-950"
        />
        <Controls
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm"
          showInteractive={false}
        />
        <MiniMap
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg"
          maskColor="rgba(0, 0, 0, 0.1)"
          nodeColor={(node) => {
            if (node.data?.isCurrent) {
              return "#10b981"; // Green for current version
            }
            return "#6b7280"; // Gray for other versions
          }}
        />
      </ReactFlow>
    </div>
  );
}

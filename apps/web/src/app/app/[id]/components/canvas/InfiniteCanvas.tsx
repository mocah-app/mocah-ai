"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEffect, useState, useCallback } from "react";
import { TemplateNode } from "../nodes/TemplateNode";
import { useCanvas } from "../providers/CanvasProvider";
import { CustomCanvasControl } from "./CustomCanvasControl";

// Register custom node types
const nodeTypes = {
  template: TemplateNode,
};

export function InfiniteCanvas() {
  const { state, actions } = useCanvas();
  // Initialize zoom level to match defaultViewport zoom (0.8 = 80%)
  const [zoomLevel, setZoomLevel] = useState(80);

  // Handle viewport changes (zoom, pan) from React Flow events
  // This listens to all zoom changes including mouse wheel, pinch, and programmatic changes
  const handleMove = useCallback((_: any, viewport: { zoom: number }) => {
    const newZoom = Math.round(viewport.zoom * 100);
    setZoomLevel(newZoom);
  }, []);

  // Fit view on mount
  useEffect(() => {
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
        onMove={handleMove}
        nodeTypes={nodeTypes}
        proOptions={{ hideAttribution: true }}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: -8, y: 0, zoom: 0.8 }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={42}
          size={2}
          bgColor="var(--background)"
        />
        <Controls
          position="bottom-center"
          orientation="horizontal"
          showZoom={false}
          showFitView={false}
          showInteractive={false}
          style={{
            border: "none",
            borderRadius: "var(--radius)",
            backdropFilter: "blur(10px)",
          }}
        >
          <CustomCanvasControl
            zoomLevel={zoomLevel}
            onZoomLevelChange={setZoomLevel}
          // isHandMode={isHandMode}
          // setIsHandMode={setIsHandMode}
          />
        </Controls>
      </ReactFlow>
    </div>
  );
}

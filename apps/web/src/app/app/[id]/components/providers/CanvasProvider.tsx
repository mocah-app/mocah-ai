"use client";

import React, { createContext, useContext, useCallback } from "react";
import {
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import type { TemplateNodeData } from "../nodes/TemplateNode";

interface CanvasState {
  nodes: Node<TemplateNodeData>[];
  edges: Edge[];
}

interface CanvasActions {
  addNode: (node: Node<TemplateNodeData>) => void;
  updateNode: (nodeId: string, data: any) => void;
  deleteNode: (nodeId: string) => void;
  connectNodes: (connection: Connection) => void;
  setNodes: React.Dispatch<React.SetStateAction<Node<TemplateNodeData>[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onNodesChange: any;
  onEdgesChange: any;
  onConnect: any;
}

interface CanvasContextValue {
  state: CanvasState;
  actions: CanvasActions;
}

const CanvasContext = createContext<CanvasContextValue | undefined>(undefined);

export function useCanvas() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error("useCanvas must be used within CanvasProvider");
  }
  return context;
}

function CanvasProviderInner({ children }: { children: React.ReactNode }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<
    Node<TemplateNodeData>
  >([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const addNode = useCallback(
    (node: Node<TemplateNodeData>) => {
      setNodes((nds) => [...nds, node]);
    },
    [setNodes]
  );

  const updateNode = useCallback(
    (nodeId: string, updates: Partial<Node<TemplateNodeData>>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { 
                ...node, 
                ...updates,
                data: updates.data ? { ...node.data, ...updates.data } : node.data 
              }
            : node
        )
      );
    },
    [setNodes]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      );
    },
    [setNodes, setEdges]
  );

  const connectNodes = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const state: CanvasState = {
    nodes,
    edges,
  };

  const actions: CanvasActions = {
    addNode,
    updateNode,
    deleteNode,
    connectNodes,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
  };

  return (
    <CanvasContext.Provider value={{ state, actions }}>
      {children}
    </CanvasContext.Provider>
  );
}

export function CanvasProvider({ children }: { children: React.ReactNode }) {
  return (
    <ReactFlowProvider>
      <CanvasProviderInner>{children}</CanvasProviderInner>
    </ReactFlowProvider>
  );
}

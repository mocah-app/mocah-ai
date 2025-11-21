"use client";

import React from "react";
import { Code, Eye, Copy, Trash2 } from "lucide-react";
import { useEditorMode } from "../providers/EditorModeProvider";
import { useCanvas } from "../providers/CanvasProvider";

interface NodeHeaderProps {
  version: number;
  name: string;
  isCurrent: boolean;
  nodeId: string;
  currentMode: "view" | "code";
}

export function NodeHeader({
  version,
  name,
  isCurrent,
  nodeId,
  currentMode,
}: NodeHeaderProps) {
  const { actions: editorActions } = useEditorMode();
  const { actions: canvasActions } = useCanvas();

  const handleToggleMode = () => {
    const newMode = currentMode === "view" ? "code" : "view";
    editorActions.setNodeMode(nodeId, newMode);
  };

  const handleDuplicate = () => {
    console.log("Duplicate node:", nodeId);
    // TODO: Implement duplication logic
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this version?")) {
      canvasActions.deleteNode(nodeId);
    }
  };

  return (
    <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Version Badge */}
        <div
          className={`px-2 py-1 rounded-md text-xs font-semibold ${
            isCurrent
              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
              : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
          }`}
        >
          V{version}
        </div>

        {/* Node Title */}
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {name}
        </h3>

        {/* Current Indicator */}
        {isCurrent && (
          <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
            Current
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* View/Code Toggle */}
        <button
          onClick={handleToggleMode}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title={currentMode === "view" ? "Switch to Code" : "Switch to View"}
        >
          {currentMode === "view" ? (
            <Code className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>

        {/* Duplicate */}
        <button
          onClick={handleDuplicate}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Duplicate"
        >
          <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
        </button>
      </div>
    </div>
  );
}

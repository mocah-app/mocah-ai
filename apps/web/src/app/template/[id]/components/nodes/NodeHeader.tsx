"use client";

import React from "react";
import { Code, Eye, Copy, Trash2 } from "lucide-react";
import { useEditorMode } from "../providers/EditorModeProvider";
import { useCanvas } from "../providers/CanvasProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
    <div className="px-4 py-1 bg-muted border-b border-border rounded-t-lg flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Version Badge */}

        {/* Node Title */}
        <h3 className="text-sm font-semibold text-muted-foreground">{name}</h3>

        {/* Current Indicator */}
        {isCurrent && <Badge variant="success">Current</Badge>}
        <Badge variant="outline" className="text-xs px-1">
          v{version}
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* View/Code Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleMode}
          title={currentMode === "view" ? "Switch to Code" : "Switch to View"}
        >
          {currentMode === "view" ? (
            <Code className="size-4 text-muted-foreground" />
          ) : (
            <Eye className="size-4 text-muted-foreground" />
          )}
        </Button>

        {/* Duplicate */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDuplicate}
          title="Duplicate"
        >
          <Copy className="size-4 text-muted-foreground" />
        </Button>

        {/* Delete */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          title="Delete"
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

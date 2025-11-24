"use client";

import React from "react";
import { Code, Eye, Copy, Trash2, MoreVertical } from "lucide-react";
import { useEditorMode } from "../providers/EditorModeProvider";
import { useCanvas } from "../providers/CanvasProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
        <h3 className="text-sm font-semibold text-muted-foreground line-clamp-1 max-w-[200px]">
          {name}
        </h3>

        {/* Current Indicator */}
        {isCurrent && <Badge variant="success">Current</Badge>}
        <Badge variant="outline" className="text-xs px-1">
          v{version}
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* View/Code Toggle */}

        <div className="flex items-center gap-2 bg-card rounded-md">

        <Button
          variant="ghost"
          size="icon"
          
          onClick={handleToggleMode}
          className={currentMode === "view" ? "bg-accent" : ""}
          >
            <Eye className="size-4 text-muted-foreground" />

          </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleMode}
          className={currentMode === "code" ? "bg-accent" : ""}
          >
            <Code className="size-4 text-muted-foreground" />

          </Button>
          </div>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="icon" title="More Actions">
              <MoreVertical className="size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem asChild>
              <Button
                variant="ghost"
                onClick={handleDuplicate}
                title="Duplicate"
              >
                <Copy className="size-4 text-muted-foreground" />
                Duplicate
              </Button>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Button
                variant="ghost"
                onClick={handleDelete}
                className="text-destructive w-full justify-start hover:text-destructive"
              >
                <Trash2 className="size-4 text-destructive" />
                Delete
              </Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

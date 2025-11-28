"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
    ChevronDown,
    Hand,
    MousePointer2,
    Redo2,
    Undo2
} from "lucide-react";
import React, { useState, useEffect } from "react";

interface CustomCanvasControlProps {
  isHandMode?: boolean;
  setIsHandMode?: (value: boolean) => void;
  zoomLevel?: number;
  onZoomLevelChange?: (zoom: number) => void;
}

export function CustomCanvasControl({ 
  isHandMode = false, 
  setIsHandMode = () => {}, 
  zoomLevel: externalZoomLevel,
  onZoomLevelChange 
}: CustomCanvasControlProps) {
  const { zoomIn, zoomOut, fitView, getZoom, setViewport } = useReactFlow();
  const [internalZoomLevel, setInternalZoomLevel] = useState(100);
  
  // Use external zoom level if provided, otherwise use internal state
  const zoomLevel = externalZoomLevel ?? internalZoomLevel;

  // Initialize zoom level on mount
  useEffect(() => {
    const currentZoom = getZoom();
    const initialZoom = Math.round(currentZoom * 100);
    if (externalZoomLevel === undefined) {
      setInternalZoomLevel(initialZoom);
    }
    onZoomLevelChange?.(initialZoom);
  }, [getZoom, externalZoomLevel, onZoomLevelChange]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      
      if (!isCmdOrCtrl) return;

      switch (e.key) {
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
        case '_':
          e.preventDefault();
          handleZoomOut();
          break;
        case '0':
          e.preventDefault();
          handleZoomTo100();
          break;
        case '1':
          e.preventDefault();
          handleFitView();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleZoomIn = () => {
    zoomIn({ duration: 200 });
    // Zoom level will be updated via onMove callback
  };

  const handleZoomOut = () => {
    zoomOut({ duration: 200 });
    // Zoom level will be updated via onMove callback
  };

  const handleFitView = () => {
    fitView({ duration: 200, padding: 0.2 });
    // Zoom level will be updated via onMove callback
  };

  const handleZoomTo100 = () => {
    setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 200 });
    if (externalZoomLevel === undefined) {
      setInternalZoomLevel(100);
    }
    onZoomLevelChange?.(100);
  };

  const toggleMode = () => {
    setIsHandMode(!isHandMode);
  };

  const handleUndo = () => {
    // Implement undo logic
    console.log("Undo");
  };

  const handleRedo = () => {
    // Implement redo logic
    console.log("Redo");
  };

  return (
    <div className="flex items-center gap-2 bg-secondary/50 backdrop-blur-sm rounded-lg p-1 border border-border/50 shadow-2xl">
      {/* Mode Toggle */}
      <div className="flex items-center gap-0.5">
        <ControlButton
          onClick={toggleMode}
          icon={MousePointer2}
          label="Select mode"
          isActive={!isHandMode}
        />
        <ControlButton
          onClick={toggleMode}
          icon={Hand}
          label="Pan mode"
          isActive={isHandMode}
        />
      </div>

      <div className="h-6 w-px bg-border" />

      {/* Undo/Redo */}
      <div className="flex items-center gap-0.5">
        <ControlButton
          onClick={handleUndo}
          icon={Undo2}
          label="Undo"
          isActive={false}
        />
        <ControlButton
          onClick={handleRedo}
          icon={Redo2}
          label="Redo"
          isActive={false}
        />
      </div>

      <div className="h-6 w-px bg-border" />

      {/* Zoom Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 px-3 text-sm font-medium hover:bg-accent"
          >
            {zoomLevel}%
            <ChevronDown className="ml-1 size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-48">
          <DropdownMenuItem onClick={handleZoomIn} className="justify-between">
            <span>Zoom in</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                ⌘
              </kbd>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                +
              </kbd>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleZoomOut} className="justify-between">
            <span>Zoom out</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                ⌘
              </kbd>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                -
              </kbd>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleZoomTo100} className="justify-between">
            <span>Zoom to 100%</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                ⌘
              </kbd>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                0
              </kbd>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleFitView} className="justify-between">
            <span>Zoom to fit</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                ⌘
              </kbd>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                1
              </kbd>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface ControlButtonProps {
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
}

function ControlButton({
  onClick,
  icon: Icon,
  label,
  isActive,
}: ControlButtonProps) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`size-8 ${
        isActive ? "bg-accent text-accent-foreground" : ""
      }`}
      aria-label={label}
    >
      <Icon className="size-4" />
    </Button>
  );
}
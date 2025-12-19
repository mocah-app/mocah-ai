"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
    ChevronDown,
    Hand,
    MousePointer2,
    Redo2,
    Undo2
} from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { useHistory } from "../providers/HistoryProvider";

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
  const { actions: historyActions, state: historyState } = useHistory();
  
  // Use external zoom level if provided, otherwise use internal state
  const zoomLevel = externalZoomLevel ?? internalZoomLevel;

  // Initialize zoom level on mount only

  useEffect(() => {
    const currentZoom = getZoom();
    const initialZoom = Math.round(currentZoom * 100);
    if (externalZoomLevel === undefined) {
      setInternalZoomLevel(initialZoom);
      onZoomLevelChange?.(initialZoom);
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 200 });
    // Zoom level will be updated via onMove callback
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 200 });
    // Zoom level will be updated via onMove callback
  }, [zoomOut]);

  const handleFitView = useCallback(() => {
    fitView({ duration: 200, padding: 0.2 });
    // Zoom level will be updated via onMove callback
  }, [fitView]);

  const handleZoomTo100 = useCallback(() => {
    setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 200 });
    if (externalZoomLevel === undefined) {
      setInternalZoomLevel(100);
    }
    onZoomLevelChange?.(100);
  }, [setViewport, externalZoomLevel, onZoomLevelChange]);

  const handleUndo = useCallback(() => {
    if (historyState.canUndo) {
      historyActions.undo();
    }
  }, [historyActions, historyState.canUndo]);

  const handleRedo = useCallback(() => {
    if (historyState.canRedo) {
      historyActions.redo();
    }
  }, [historyActions, historyState.canRedo]);

  const toggleMode = () => {
    setIsHandMode(!isHandMode);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      
      if (!isCmdOrCtrl) return;

      switch (e.key) {
        case 'z':
        case 'Z':
          e.preventDefault();
          if (e.shiftKey) {
            // Cmd+Shift+Z = Redo
            handleRedo();
          } else {
            // Cmd+Z = Undo
            handleUndo();
          }
          break;
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
  }, [handleZoomIn, handleZoomOut, handleZoomTo100, handleFitView, handleUndo, handleRedo]);

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
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <ControlButton
                onClick={handleUndo}
                icon={Undo2}
                label="Undo"
                isActive={false}
                disabled={!historyState.canUndo}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>Undo (⌘Z)</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <ControlButton
                onClick={handleRedo}
                icon={Redo2}
                label="Redo"
                isActive={false}
                disabled={!historyState.canRedo}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>Redo (⌘⇧Z)</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

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
  disabled?: boolean;
}

function ControlButton({
  onClick,
  icon: Icon,
  label,
  isActive,
  disabled = false,
}: ControlButtonProps) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      disabled={disabled}
      className={`size-8 ${
        isActive ? "bg-accent text-accent-foreground" : ""
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      aria-label={label}
    >
      <Icon className="size-4" />
    </Button>
  );
}
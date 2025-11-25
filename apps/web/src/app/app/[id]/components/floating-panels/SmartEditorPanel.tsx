import React from "react";
import {
  X,
  MousePointer,
  FileSliders,
} from "lucide-react";
import { useEditorMode } from "../providers/EditorModeProvider";
import { useTemplate } from "../providers/TemplateProvider";
import { useCanvas } from "../providers/CanvasProvider";
import { ReactEmailEditorPanel } from "../smart-editor/ReactEmailEditorPanel";
import type { TemplateNodeData } from "../nodes/TemplateNode";
import type { ElementData } from "@/lib/react-email";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const SmartEditorPanel = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { state: editorState } = useEditorMode();
  const { actions: templateActions } = useTemplate();
  const { state: canvasState, actions: canvasActions } = useCanvas();
  const { selectedElement } = editorState;

  // Get current value to render
  const nodes = canvasState.nodes;
  const activeNode =
    nodes.find((n) => n.data.isCurrent) ||
    nodes.find((n) => n.type === "template");

  // Parse ElementData from selected element
  let elementData: ElementData | null = null;
  if (selectedElement && activeNode) {
    try {
      elementData = JSON.parse(selectedElement);
    } catch (e) {
      console.error('Failed to parse element data:', e);
    }
  }

  // Use ReactEmailEditorPanel for element editing
  if (elementData && activeNode) {
    const handleElementUpdate = async (updates: any) => {
      // Use React Email code-updater utility to modify the React Email code
      const { updateReactEmailCode } = await import('@/lib/react-email');
      
      const currentCode = (activeNode.data as TemplateNodeData).template.reactEmailCode!;
      const currentStyleDefs = (activeNode.data as TemplateNodeData).template.styleDefinitions || {};
      
      try {
        // Update React Email code based on element changes
        const { updatedCode, updatedStyleDefinitions } = updateReactEmailCode(
          currentCode,
          elementData,
          updates,
          currentStyleDefs
        );

        // Update template provider with modified code
        templateActions.updateReactEmailCode(updatedCode, updatedStyleDefinitions);

        // Update canvas node
        canvasActions.setNodes((nds) =>
          nds.map((node) => {
            if (node.id === activeNode.id) {
              return {
                ...node,
                data: {
                  ...node.data,
                  template: {
                    ...(node.data as TemplateNodeData).template,
                    reactEmailCode: updatedCode,
                    styleDefinitions: updatedStyleDefinitions,
                  },
                },
              };
            }
            return node;
          })
        );
      } catch (error) {
        console.error('Failed to update React Email code:', error);
      }
    };

    return (
      <ReactEmailEditorPanel
        isOpen={isOpen}
        onClose={onClose}
        elementData={elementData}
        styleDefinitions={(activeNode.data as TemplateNodeData).template.styleDefinitions || {}}
        onElementUpdate={handleElementUpdate}
      />
    );
  }

  // No element selected - show empty state
  return (
    <div
      className={cn(
        "bg-card rounded-r-xl shadow-2xl border border-border overflow-hidden flex flex-col z-40 h-dvh",
        "transition-all duration-300 ease-in-out",
        isOpen
          ? "translate-x-0 opacity-100 w-80"
          : "-translate-x-full opacity-0 pointer-events-none w-0"
      )}
    >
      {/* Header */}
      <div className="p-2 border-b border-border flex justify-between items-center bg-muted">
        <div className="flex items-center gap-2">
          <FileSliders className="size-3 text-primary" />
          <h3 className="font-semibold text-sm">
            Editor
          </h3>
        </div>
        <Button onClick={onClose} variant="outline" size="icon">
          <X size={16} />
        </Button>
      </div>

      {/* Empty State */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
            <MousePointer className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              No Element Selected
            </p>
            <p className="text-xs text-muted-foreground max-w-[200px]">
              Click on any element in your React Email template to edit it
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

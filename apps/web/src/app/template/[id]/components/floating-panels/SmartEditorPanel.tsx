import React from "react";
import { X, Sparkles } from "lucide-react";
import { useEditorMode } from "../providers/EditorModeProvider";
import { useTemplate } from "../providers/TemplateProvider";
import { useCanvas } from "../providers/CanvasProvider";
import { TextEditor } from "../view-mode/element-editors/TextEditor";
import { ImageEditor } from "../view-mode/element-editors/ImageEditor";
import { ButtonEditor } from "../view-mode/element-editors/ButtonEditor";
import type { TemplateNodeData } from "../nodes/TemplateNode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const SmartEditorPanel = () => {
  const { state: editorState, actions: editorActions } = useEditorMode();
  const { actions: templateActions } = useTemplate();
  const { state: canvasState, actions: canvasActions } = useCanvas();
  const { selectedElement } = editorState;

  // Helper to get value from path
  const getValue = (data: TemplateNodeData, path: string) => {
    if (!data.template) return null;
    return path
      .split(".")
      .reduce((acc: any, part) => acc && acc[part], data.template);
  };

  // Helper to set value at path
  const setValue = (data: TemplateNodeData, path: string, value: any) => {
    const newData = JSON.parse(JSON.stringify(data)); // Deep clone
    const parts = path.split(".");
    const last = parts.pop();
    if (!last || !newData.template) return newData;

    let current = newData.template;
    for (const part of parts) {
      if (!current[part]) current[part] = {};
      current = current[part];
    }
    current[last] = value;
    return newData;
  };

  const handleUpdate = (value: any) => {
    if (!selectedElement) return;

    canvasActions.setNodes((nds) =>
      nds.map((node) => {
        if (node.data.isCurrent || node.type === "template") {
          const newData = setValue(
            node.data as TemplateNodeData,
            selectedElement,
            value
          );
          return { ...node, data: newData };
        }
        return node;
      })
    );

    // TODO: Call templateActions.updateElement to persist to DB (debounced)
  };

  if (!selectedElement) return null;

  // Get current value to render
  const nodes = canvasState.nodes;
  const activeNode =
    nodes.find((n) => n.data.isCurrent) ||
    nodes.find((n) => n.type === "template");

  if (!activeNode) return null;

  const currentValue = getValue(
    activeNode.data as TemplateNodeData,
    selectedElement
  );
  const property = selectedElement.split(".").pop();

  const renderEditor = () => {
    if (
      property === "image" ||
      property === "logo" ||
      property === "imageUrl"
    ) {
      return (
        <ImageEditor src={currentValue} onChange={(v) => handleUpdate(v.src)} />
      );
    }

    if (property === "buttonText" || property === "ctaText") {
      return (
        <TextEditor
          value={currentValue}
          onChange={handleUpdate}
          label="Button Text"
        />
      );
    }

    if (property === "buttonUrl") {
      return (
        <ButtonEditor
          url={currentValue}
          onChange={(v) => handleUpdate(v.url)}
        />
      );
    }

    // Default to TextEditor for strings
    if (typeof currentValue === "string") {
      return (
        <TextEditor
          value={currentValue}
          onChange={handleUpdate}
          label={property}
        />
      );
    }

    return (
      <div className="text-sm text-muted-foreground">
        No editor available for this element type.
      </div>
    );
  };

  return (
    <div className="absolute top-20 right-4 w-80 bg-card rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col animate-in slide-in-from-right-10 fade-in duration-200 z-50 max-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="p-4 border-b border-border flex justify-between items-center bg-muted">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-foreground" />
          <h3 className="font-semibold text-sm text-muted-foreground">
            Edit Element
          </h3>
        </div>
        <Button
          onClick={() => editorActions.selectElement(null)}
          variant="ghost"
          size="icon"
        >
          <X size={16} />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="mb-4">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
            Element Path
          </label>
          <code className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground block truncate">
            {selectedElement}
          </code>
        </div>

        {renderEditor()}
      </div>

      {/* AI Footer */}
      <div className="p-2 bg-muted border-t border-border">
        <div className="relative">
          <Sparkles
            className="absolute left-3 top-3 text-muted-foreground"
            size={14}
          />
          <Textarea
            placeholder="Refine with AI..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-transparent border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none shadow-sm resize-none"
            rows={3}
            maxLength={1000}
            
          />
        </div>
      </div>
    </div>
  );
};

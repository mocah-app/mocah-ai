import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Type,
  Image as ImageIcon,
  MousePointer,
  Layout,
  FileSliders,
} from "lucide-react";
import { useEditorMode } from "../providers/EditorModeProvider";
import { useTemplate } from "../providers/TemplateProvider";
import { useCanvas } from "../providers/CanvasProvider";
import { TextEditor } from "../view-mode/element-editors/TextEditor";
import { ImageEditor } from "../view-mode/element-editors/ImageEditor";
import { ButtonEditor } from "../view-mode/element-editors/ButtonEditor";
import { LayoutEditor } from "../view-mode/element-editors/LayoutEditor";
import type { TemplateNodeData } from "../nodes/TemplateNode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import Loader from "@/components/loader";

export const SmartEditorPanel = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { state: editorState, actions: editorActions } = useEditorMode();
  const { actions: templateActions } = useTemplate();
  const { state: canvasState, actions: canvasActions } = useCanvas();
  const { selectedElement } = editorState;
  const [aiPrompt, setAiPrompt] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);

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

    // TODO: Debounced auto-save to DB
    templateActions.updateElement(selectedElement, value);
  };

  // Handle AI regeneration
  const handleAIRegenerate = async () => {
    if (!aiPrompt.trim() || !selectedElement) return;

    setIsRegenerating(true);
    try {
      // TODO: Call templateActions.regenerateElement
      await templateActions.regenerateElement(selectedElement, aiPrompt);
      setAiPrompt("");
    } catch (error) {
      console.error("Failed to regenerate element:", error);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Handle ESC key to close panel
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedElement) {
        editorActions.selectElement(null);
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [selectedElement, editorActions, onClose]);

  // Get current value to render
  const nodes = canvasState.nodes;
  const activeNode =
    nodes.find((n) => n.data.isCurrent) ||
    nodes.find((n) => n.type === "template");

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
      {!selectedElement ? (
        <>
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
                  Click on any text, image, button, or section in your template
                  to edit it here
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        selectedElement &&
        activeNode &&
        (() => {
          const currentValue = getValue(
            activeNode.data as TemplateNodeData,
            selectedElement
          );
          const property = selectedElement.split(".").pop();

          // Determine element type and icon
          const getElementInfo = () => {
            if (
              property === "image" ||
              property === "logo" ||
              property === "imageUrl"
            ) {
              return { type: "Image", icon: ImageIcon };
            }
            if (
              property === "buttonText" ||
              property === "ctaText" ||
              property === "buttonUrl"
            ) {
              return { type: "Button", icon: MousePointer };
            }
            if (
              property === "styles" ||
              selectedElement.split(".").length === 2
            ) {
              return { type: "Section Layout", icon: Layout };
            }
            return { type: "Text", icon: Type };
          };

          const elementInfo = getElementInfo();
          const ElementIcon = elementInfo.icon;

          const renderEditor = () => {
            if (
              property === "image" ||
              property === "logo" ||
              property === "imageUrl"
            ) {
              return (
                <ImageEditor
                  src={currentValue}
                  onChange={(v) => handleUpdate(v.src)}
                />
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

            // Check if editing section styles
            if (
              property === "styles" ||
              selectedElement.split(".").length === 2
            ) {
              // Editing a section itself (e.g., "sections.0")
              const sectionPath = selectedElement
                .split(".")
                .slice(0, 2)
                .join(".");
              const section = getValue(
                activeNode.data as TemplateNodeData,
                sectionPath
              );

              if (section && typeof section === "object") {
                return (
                  <LayoutEditor
                    styles={section.styles || {}}
                    onChange={(newStyles) => {
                      const updatedSection = {
                        ...section,
                        styles: { ...section.styles, ...newStyles },
                      };
                      canvasActions.setNodes((nds) =>
                        nds.map((node) => {
                          if (node.data.isCurrent || node.type === "template") {
                            const newData = setValue(
                              node.data as TemplateNodeData,
                              sectionPath,
                              updatedSection
                            );
                            return { ...node, data: newData };
                          }
                          return node;
                        })
                      );
                    }}
                  />
                );
              }
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
            <>
              {/* Header */}
              <div className="p-2 border-b border-border flex justify-between items-center bg-muted">
                <div className="flex items-center gap-2">
                  <ElementIcon className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm text-foreground">
                    {elementInfo.type}
                  </h3>
                </div>
                <Button
                  onClick={() => {
                    editorActions.selectElement(null);
                    onClose();
                  }}
                  variant="outline"
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
                <div className="relative px-2 pb-2">
                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        handleAIRegenerate();
                      }
                    }}
                    placeholder="Refine this element with AI..."
                    className="focus:outline-none focus:ring-[0.2px] rounded-none focus:ring-teal-500 focus:ring-offset-0 focus:ring-offset-transparent resize-none max-h-[180px]"
                    rows={3}
                    maxLength={500}
                    disabled={isRegenerating}
                  />
                  <Button
                    onClick={handleAIRegenerate}
                    disabled={!aiPrompt.trim() || isRegenerating}
                    size="icon"
                    className="absolute bottom-3 right-3 w-8 h-8"
                    aria-label="Regenerate"
                  >
                    {isRegenerating ? (
                      <Loader />
                    ) : (
                      <Sparkles className="size-3" />
                    )}
                  </Button>
                </div>
            </>
          );
        })()
      )}
    </div>
  );
};

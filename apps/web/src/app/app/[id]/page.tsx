"use client";

import React, { useEffect, useCallback, useState } from "react";
import { CanvasProvider } from "./components/providers/CanvasProvider";
import {
  TemplateProvider,
  useTemplate,
} from "./components/providers/TemplateProvider";
import { EditorModeProvider } from "./components/providers/EditorModeProvider";
import { DesignChangesProvider } from "./components/providers/DesignChangesProvider";
import { InfiniteCanvas } from "./components/canvas/InfiniteCanvas";
import { SmartEditorPanel } from "./components/floating-panels/SmartEditorPanel";
import { ChatPanel } from "./components/floating-panels/ChatPanel";
import { FloatingNav } from "./components/floating-panels/FloatingNav";
import { SaveDesignEdit } from "./components/canvas/SaveDesignEdit";
import { useCanvas } from "./components/providers/CanvasProvider";
import { useEditorMode } from "./components/providers/EditorModeProvider";
import { useParams } from "next/navigation";
import { useTemplateCreation } from "@/utils/store-prompt-in-session";
import type { TemplateNodeData } from "./components/nodes/TemplateNode";
import type { ElementData } from "@/lib/react-email";
import EdgeRayLoader from "@/components/EdgeLoader";
import MocahLoadingIcon from "@/components/mocah-brand/MocahLoadingIcon";

function EditorContent() {
  const { state: templateState, actions: templateActions } = useTemplate();
  const { state: canvasState, actions: canvasActions } = useCanvas();
  const { state: editorState, actions: editorActions } = useEditorMode();
  const { getPrompt, clearPrompt } = useTemplateCreation();
  const params = useParams();
  const templateId = params.id as string;
  
  // Read prompt immediately on first render for ChatPanel prop
  const promptFromStorage = React.useMemo(() => getPrompt(), []);
  const [activePanel, setActivePanel] = React.useState<string | null>(null);
  const [initialPrompt] = React.useState<string | null>(promptFromStorage);
  const [isSaving, setIsSaving] = useState(false);

  // Check if there are ANY pending changes across all elements (smart editor)
  const hasSmartEditorChanges = editorState.allPendingChanges.size > 0;
  // Check if code editor has unsaved changes
  const hasCodeEditorChanges = templateState.isDirty && !hasSmartEditorChanges;
  // Check if code editor overlay is handling the save (code mode + smart editor changes)
  const isCodeModeWithSmartEditorChanges = editorState.globalMode === "code" && hasSmartEditorChanges;
  // Show SaveDesignEdit bar only when overlay is NOT handling the save
  const hasPendingChanges = isCodeModeWithSmartEditorChanges 
    ? false  // Overlay handles save in code mode
    : (hasSmartEditorChanges || hasCodeEditorChanges);

  // Get active node for save operations
  const activeNode =
    canvasState.nodes.find((n) => n.data.isCurrent) ||
    canvasState.nodes.find((n) => n.type === "template");

  // Handle save design changes - persists ALL pending changes to database
  const handleSaveChanges = useCallback(async () => {
    setIsSaving(true);

    try {
      const allChanges = editorActions.getAllPendingChanges();
      
      // Handle smart editor changes
      if (allChanges.size > 0 && activeNode) {
        const { updateReactEmailCode } = await import("@/lib/react-email");

        let currentCode = (activeNode.data as TemplateNodeData).template
          .reactEmailCode!;
        let currentStyleDefs =
          (activeNode.data as TemplateNodeData).template.styleDefinitions || {};

        // Apply ALL pending changes sequentially
        for (const [_elementId, pendingChange] of allChanges) {
          // Parse element data
          const elementData: ElementData = JSON.parse(
            pendingChange.originalElement
          );

          // Update React Email code based on this element's changes
          const { updatedCode, updatedStyleDefinitions } = updateReactEmailCode(
            currentCode,
            elementData,
            pendingChange.updates,
            currentStyleDefs
          );

          // Use the updated code/styles as the base for the next iteration
          currentCode = updatedCode;
          currentStyleDefs = updatedStyleDefinitions;
        }

        // Save the final accumulated result to database
        await templateActions.saveReactEmailCode(
          currentCode,
          currentStyleDefs
        );

        // Clear ALL pending changes after successful save
        editorActions.clearAllPendingChanges();
      } 
      // Handle code editor changes (when no smart editor changes)
      else if (templateState.isDirty) {
        await templateActions.saveTemplate();
      }
    } catch (error) {
      console.error("Failed to save changes:", error);
    } finally {
      setIsSaving(false);
    }
  }, [
    editorActions,
    activeNode,
    templateActions,
    templateState.isDirty,
  ]);

  // Handle reset changes - clears ALL pending changes (no API calls)
  const handleResetChanges = useCallback(() => {
    // Handle smart editor changes
    if (editorState.allPendingChanges.size > 0) {
      // Clear ALL pending changes
      editorActions.clearAllPendingChanges();
      // Force the preview to re-render with original content
      editorActions.refreshPreview();
    }
    
    // Handle code editor changes - reset to last saved version (no API call)
    if (templateState.isDirty) {
      templateActions.resetReactEmailCode();
    }
  }, [editorActions, editorState.allPendingChanges.size, templateState.isDirty, templateActions]);

  // Handle save for smart editor changes only (used by code editor overlay)
  const handleSaveSmartEditorChanges = useCallback(async () => {
    const allChanges = editorActions.getAllPendingChanges();
    if (allChanges.size === 0 || !activeNode) return;

    setIsSaving(true);

    try {
      const { updateReactEmailCode } = await import("@/lib/react-email");

      let currentCode = (activeNode.data as TemplateNodeData).template
        .reactEmailCode!;
      let currentStyleDefs =
        (activeNode.data as TemplateNodeData).template.styleDefinitions || {};

      // Apply ALL pending changes sequentially
      for (const [_elementId, pendingChange] of allChanges) {
        const elementData: ElementData = JSON.parse(
          pendingChange.originalElement
        );

        const { updatedCode, updatedStyleDefinitions } = updateReactEmailCode(
          currentCode,
          elementData,
          pendingChange.updates,
          currentStyleDefs
        );

        currentCode = updatedCode;
        currentStyleDefs = updatedStyleDefinitions;
      }

      // Save to database
      await templateActions.saveReactEmailCode(currentCode, currentStyleDefs);

      // Clear pending changes
      editorActions.clearAllPendingChanges();
    } catch (error) {
      console.error("Failed to save smart editor changes:", error);
    } finally {
      setIsSaving(false);
    }
  }, [editorActions, activeNode, templateActions]);

  // Handle reset for smart editor changes only (used by code editor overlay)
  const handleResetSmartEditorChanges = useCallback(() => {
    editorActions.clearAllPendingChanges();
    editorActions.refreshPreview();
  }, [editorActions]);

  // Auto-open chat if we have a prompt
  useEffect(() => {
    if (promptFromStorage) {
      setActivePanel("chat");
    }
  }, [promptFromStorage]);

  // Auto-open editor panel when an element is selected
  useEffect(() => {
    if (editorState.selectedElement) {
      setActivePanel("editor");
    }
    // Note: Don't auto-close editor when element is deselected
    // User should be able to keep editor open to see instructions
  }, [editorState.selectedElement]);

  // Handle panel toggle with mutual exclusivity
  const handlePanelToggle = (panel: string) => {
    if (activePanel === panel) {
      // Close the currently open panel
      setActivePanel(null);
      // If closing editor, also deselect element and disable design mode
      if (panel === "editor") {
        editorActions.selectElement(null);
        editorActions.setDesignMode(false);
      }
    } else {
      // Open the new panel and close any other
      setActivePanel(panel);
      
      // If opening editor, enable design mode for element selection
      if (panel === "editor") {
        editorActions.setDesignMode(true);
      }
      
      // If opening chat, close editor and deselect element
      if (panel === "chat") {
        if (editorState.selectedElement) {
          editorActions.selectElement(null);
        }
        editorActions.setDesignMode(false);
      }
    }
  };

  // Initialize template node - either loading or with data
  useEffect(() => {
    // If we already have a template node, don't create another
    if (
      canvasState.nodes.some(
        (n) => n.id === "template-node" || n.id.startsWith("template-")
      )
    ) {
      return;
    }

    // If streaming, create a loading node
    if (templateState.isStreaming) {
      const loadingNode = {
        id: "template-node",
        type: "template",
        position: { x: 250, y: 100 },
        data: {
          version: 1,
          name: "Generating...",
          isCurrent: true,
          isLoading: true,
          template: { reactEmailCode: "" },
        },
      };
      canvasActions.addNode(loadingNode as any);
      return;
    }

    // If we have template data and no node yet, create it
    if (templateState.currentTemplate) {
      const template = templateState.currentTemplate;

      // Build template content using React Email format
      const templateContent = {
        subject: template.subject ?? undefined,
        previewText: template.previewText ?? undefined,
        reactEmailCode: templateState.reactEmailCode || template.reactEmailCode || undefined,
        styleDefinitions: templateState.styleDefinitions,
      };

      const initialNode = {
        id: "template-node",
        type: "template",
        position: { x: 250, y: 100 },
        data: {
          id: template.id,
          version: 1,
          name: template.name,
          isCurrent: true,
          isLoading: false,
          template: templateContent,
          metadata: {
            createdAt: template.createdAt,
            updatedAt: template.updatedAt,
          },
        },
      };

      canvasActions.addNode(initialNode);
    }
  }, [
    templateState.isStreaming,
    templateState.currentTemplate,
    canvasState.nodes,
    canvasActions,
  ]);

  // Update existing node when template content changes
  useEffect(() => {
    const existingNode = canvasState.nodes.find(
      (n) => n.id === "template-node"
    );
    if (!existingNode || !templateState.currentTemplate) return;

    const template = templateState.currentTemplate;

    // Build template content using React Email format
    const templateContent = {
      subject: template.subject ?? undefined,
      previewText: template.previewText ?? undefined,
      reactEmailCode: templateState.reactEmailCode || template.reactEmailCode || undefined,
      styleDefinitions: templateState.styleDefinitions,
    };

    // Check if content actually changed (avoid infinite updates)
    const currentContent = JSON.stringify(existingNode.data.template);
    const newContent = JSON.stringify(templateContent);
    const loadingChanged = existingNode.data.isLoading !== templateState.isStreaming;

    if (
      currentContent === newContent &&
      existingNode.data.name === template.name &&
      !loadingChanged
    ) {
      return; // No changes, skip update
    }

    // Update node with latest content
    canvasActions.updateNode(existingNode.id, {
      data: {
        id: template.id,
        version: 1,
        name: template.name,
        isCurrent: true,
        isLoading: templateState.isStreaming,
        template: templateContent,
        metadata: {
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
        },
      },
    });
  }, [
    templateState.isStreaming,
    templateState.currentTemplate,
    templateState.reactEmailCode,
    templateState.styleDefinitions,
    canvasState.nodes,
    canvasActions,
  ]);

  // Show loading overlay when template is loading and no node exists yet
  const isLoadingTemplate = templateState.isLoading && !templateState.currentTemplate && !templateState.isStreaming;
  const hasTemplateNode = canvasState.nodes.some(
    (n) => n.id === "template-node" || n.id.startsWith("template-")
  );

  return (
    <DesignChangesProvider
      onSaveSmartEditorChanges={handleSaveSmartEditorChanges}
      onResetSmartEditorChanges={handleResetSmartEditorChanges}
      isSaving={isSaving}
    >
      <div className="h-screen w-full relative overflow-hidden flex">
        <div className="flex h-dvh">
          <FloatingNav activePanel={activePanel} onTogglePanel={handlePanelToggle} />
          <ChatPanel
            isOpen={activePanel === "chat"}
            onClose={() => {
              setActivePanel(null);
            }}
            initialPrompt={initialPrompt || undefined}
            onPromptConsumed={clearPrompt}
          />
          <SmartEditorPanel
            isOpen={activePanel === "editor"}
            onClose={() => {
              setActivePanel(null);
              editorActions.selectElement(null);
              editorActions.setDesignMode(false);
            }}
          />
        </div>
        <InfiniteCanvas />
        
        {/* Loading overlay when opening template from dashboard */}
        {isLoadingTemplate && !hasTemplateNode && (
          <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="relative w-full h-full">
              <EdgeRayLoader />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12">
                <div className="relative mb-4">
                  <MocahLoadingIcon isLoading={true} size="sm" />
                </div>
                <p className="text-muted-foreground text-sm">
                  Loading template...
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Floating save bar for unsaved design changes */}
        <SaveDesignEdit
          isVisible={hasPendingChanges}
          onSave={handleSaveChanges}
          onReset={handleResetChanges}
          isSaving={isSaving}
        />
      </div>
    </DesignChangesProvider>
  );
}

export default function TemplatePage() {
  const params = useParams();
  const templateId = params.id as string;

  return (
    <CanvasProvider>
      <TemplateProvider templateId={templateId}>
        <EditorModeProvider>
          <EditorContent />
        </EditorModeProvider>
      </TemplateProvider>
    </CanvasProvider>
  );
}

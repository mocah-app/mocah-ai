"use client";

import React, { useEffect } from "react";
import { CanvasProvider } from "./components/providers/CanvasProvider";
import {
  TemplateProvider,
  useTemplate,
} from "./components/providers/TemplateProvider";
import { EditorModeProvider } from "./components/providers/EditorModeProvider";
import { InfiniteCanvas } from "./components/canvas/InfiniteCanvas";
import { SmartEditorPanel } from "./components/floating-panels/SmartEditorPanel";
import { ChatPanel } from "./components/floating-panels/ChatPanel";
import { FloatingNav } from "./components/floating-panels/FloatingNav";
import { useCanvas } from "./components/providers/CanvasProvider";
import { useEditorMode } from "./components/providers/EditorModeProvider";
import { useParams } from "next/navigation";
import { useTemplateCreation } from "@/utils/store-prompt-in-session";

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
      // If closing editor, also deselect element
      if (panel === "editor") {
        editorActions.selectElement(null);
      }
    } else {
      // Open the new panel and close any other
      setActivePanel(panel);
      // If opening chat, close editor and deselect element
      if (panel === "chat" && editorState.selectedElement) {
        editorActions.selectElement(null);
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
          template: { sections: [] },
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

    if (
      currentContent === newContent &&
      existingNode.data.name === template.name
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

  return (
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
          }}
        />
      </div>
      <InfiniteCanvas />
    </div>
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

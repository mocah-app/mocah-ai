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
import { useParams, useSearchParams } from "next/navigation";

function EditorContent() {
  const { state: templateState, actions: templateActions } = useTemplate();
  const { state: canvasState, actions: canvasActions } = useCanvas();
  const params = useParams();
  const searchParams = useSearchParams();
  const templateId = params.id as string;
  const promptFromUrl = searchParams.get("prompt");
  const isNewTemplate = templateId === "new" || templateId === "new-draft";
  const [activePanel, setActivePanel] = React.useState<string | null>(isNewTemplate ? "chat" : null);

  // Debug logging
  useEffect(() => {
    console.log('[EditorContent] Mount:', { templateId, promptFromUrl, activePanel });
  }, []);

  useEffect(() => {
    console.log('[EditorContent] promptFromUrl changed:', promptFromUrl);
  }, [promptFromUrl]);

  // Initialize template node - either loading or with data
  useEffect(() => {
    // If we already have a template node, don't create another
    if (canvasState.nodes.some(n => n.id === 'template-node' || n.id.startsWith('template-'))) {
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

      let templateContent = { sections: [] };
      if (typeof template.content === "string") {
        try {
          templateContent = JSON.parse(template.content);
        } catch (e) {
          console.error("Failed to parse template content", e);
        }
      } else if (typeof template.content === "object") {
        templateContent = template.content;
      }

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
  }, [templateState.isStreaming, templateState.currentTemplate, canvasState.nodes, canvasActions]);

  // Update existing node when streaming completes or template changes
  useEffect(() => {
    const existingNode = canvasState.nodes.find(n => n.id === 'template-node');
    if (!existingNode) return;

    // Update node from loading to loaded state
    if (!templateState.isStreaming && templateState.currentTemplate && existingNode.data.isLoading) {
      const template = templateState.currentTemplate;

      let templateContent = { sections: [] };
      if (typeof template.content === "string") {
        try {
          templateContent = JSON.parse(template.content);
        } catch (e) {
          console.error("Failed to parse template content", e);
        }
      } else if (typeof template.content === "object") {
        templateContent = template.content;
      }

      canvasActions.updateNode(existingNode.id, {
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
      });
    }
  }, [
    templateState.isStreaming,
    templateState.currentTemplate,
    canvasState.nodes,
    canvasActions,
  ]);

  return (
    <div className="h-screen w-full relative overflow-hidden">
      <InfiniteCanvas />
      <SmartEditorPanel />
      <FloatingNav activePanel={activePanel} onTogglePanel={setActivePanel} />
      <ChatPanel
        isOpen={activePanel === "chat"}
        onClose={() => setActivePanel(null)}
        initialPrompt={promptFromUrl || undefined}
      />
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

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
import { useParams } from "next/navigation";

function EditorContent() {
  const { state: templateState } = useTemplate();
  const { state: canvasState, actions: canvasActions } = useCanvas();
  const params = useParams();
  const templateId = params.id as string;
  const [activePanel, setActivePanel] = React.useState<string | null>("chat");

  // Initialize with template data when loaded
  useEffect(() => {
    if (templateState.currentTemplate && canvasState.nodes.length === 0) {
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
        id: `template-${template.id}`,
        type: "template",
        position: { x: 250, y: 100 },
        data: {
          id: template.id,
          version: 1, // Default to 1 if not available, or use template.currentVersionId logic
          name: template.name,
          isCurrent: true,
          template: templateContent,
          metadata: {
            createdAt: template.createdAt,
            updatedAt: template.updatedAt,
          },
        },
      };

      canvasActions.addNode(initialNode);
    }
  }, [templateState.currentTemplate, canvasActions, canvasState.nodes.length]);

  return (
    <div className="h-screen w-full relative overflow-hidden">
      <InfiniteCanvas />
      <SmartEditorPanel />
      <FloatingNav activePanel={activePanel} onTogglePanel={setActivePanel} />
      <ChatPanel
        isOpen={activePanel === "chat"}
        onClose={() => setActivePanel(null)}
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

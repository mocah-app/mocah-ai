"use client";

import React, { useEffect } from "react";
import { CanvasProvider } from "./components/providers/CanvasProvider";
import { TemplateProvider } from "./components/providers/TemplateProvider";
import { EditorModeProvider } from "./components/providers/EditorModeProvider";
import { InfiniteCanvas } from "./components/canvas/InfiniteCanvas";
import { SmartEditorPanel } from "./components/floating-panels/SmartEditorPanel";
import { ChatPanel } from "./components/floating-panels/ChatPanel";
import { FloatingNav } from "./components/floating-panels/FloatingNav";
import { useCanvas } from "./components/providers/CanvasProvider";
import { useParams } from "next/navigation";

function EditorContent() {
  const { actions } = useCanvas();
  const params = useParams();
  const templateId = params.id as string;
  const [activePanel, setActivePanel] = React.useState<string | null>("chat");

  // Initialize with a sample template node
  useEffect(() => {
    const initialNode = {
      id: "template-v1",
      type: "template",
      position: { x: 250, y: 100 },
      data: {
        id: templateId,
        version: 1,
        name: "Template V1",
        isCurrent: true,
        template: {
          subject: "Welcome to Mocah!",
          previewText: "Get started with AI-powered email templates",
          sections: [
            {
              id: "header_1",
              type: "header",
              styles: { backgroundColor: "#ffffff" },
              logo: "https://via.placeholder.com/150x50?text=MOCAH",
              showNav: true,
            },
            {
              id: "hero_1",
              type: "hero",
              styles: { backgroundColor: "#f8f9fa" },
              headline: "Design Emails with AI",
              subheadline:
                "Create beautiful, responsive emails in seconds using our infinite canvas editor.",
              ctaText: "Get Started",
              image: "https://via.placeholder.com/600x300?text=Hero+Image",
            },
            {
              id: "text_1",
              type: "text",
              styles: { backgroundColor: "#ffffff" },
              content:
                "<p>Welcome to the future of email design. Mocah allows you to iterate quickly with AI-powered tools.</p>",
            },
            {
              id: "footer_1",
              type: "footer",
              styles: { backgroundColor: "#f1f1f1" },
              address: "123 Innovation Way, Tech City, TC 90210",
            },
          ],
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    };

    actions.addNode(initialNode);
  }, [templateId, actions]);

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

"use client";

import React, { useEffect } from "react";
import { CanvasProvider } from "./components/providers/CanvasProvider";
import { TemplateProvider } from "./components/providers/TemplateProvider";
import { EditorModeProvider } from "./components/providers/EditorModeProvider";
import { InfiniteCanvas } from "./components/canvas/InfiniteCanvas";
import { useCanvas } from "./components/providers/CanvasProvider";
import { useParams } from "next/navigation";

function EditorContent() {
  const { actions } = useCanvas();
  const params = useParams();
  const templateId = params.id as string;

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
          content: "",
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
    <div className="h-screen w-full">
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

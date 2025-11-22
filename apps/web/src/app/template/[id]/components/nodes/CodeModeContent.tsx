"use client";

import React, { useState } from "react";
import { Code2, FileCode, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TemplateNodeData } from "./TemplateNode";
import Editor from "@monaco-editor/react";
import { useCanvas } from "../providers/CanvasProvider";
import { Button } from "@/components/ui/button";

interface CodeModeContentProps {
  template: {
    subject?: string;
    previewText?: string;
    content?: string;
    sections: any[]; // TODO: should we have a proper type for this?
  };
  nodeId: string;
}

export function CodeModeContent({ template, nodeId }: CodeModeContentProps) {
  const [activeTab, setActiveTab] = useState<"react" | "html">("react");
  const { actions } = useCanvas();
  const setNodes = actions.setNodes;

  const handleEditorChange = (value: string | undefined) => {
    if (activeTab === "react" && value) {
      try {
        const newSections = JSON.parse(value);
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  template: {
                    ...(node.data as TemplateNodeData).template,
                    sections: newSections,
                  },
                },
              };
            }
            return node;
          })
        );
      } catch (e) {
        // Ignore invalid JSON
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex items-center border-b border-border bg-muted/50 p-1 gap-2">
        <Button
          onClick={() => setActiveTab("react")}
          variant={activeTab === "react" ? "default" : "outline"}
          size="sm"
          className="text-xs"
        >
          React
        </Button>
        <Button
          onClick={() => setActiveTab("html")}
          variant={activeTab === "html" ? "default" : "outline"}
          size="sm"
          className="text-xs"
        >
          HTML
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="icon">
          <Copy className="size-4" />
        </Button>
      </div>

      {/* Code Editor */}
      <div className="flex-1 relative bg-[#1e1e1e]">
        <Editor
          height="100%"
          language={activeTab === "react" ? "json" : "html"}
          value={
            activeTab === "react"
              ? JSON.stringify(template.sections, null, 2)
              : `<!-- HTML Preview -->\n<!-- This is a read-only preview of the generated HTML -->\n\n<div style="font-family: sans-serif;">\n  <h1>${
                  template.subject || "No Subject"
                }</h1>\n  <p>${
                  template.previewText || ""
                }</p>\n  \n  <!-- Sections would be rendered here -->\n</div>`
          }
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            padding: { top: 20 },
            scrollBeyondLastLine: false,
            wordWrap: "on",
          }}
        />
      </div>
    </div>
  );
}

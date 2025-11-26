"use client";

import React, { useState } from "react";
import type { TemplateNodeData } from "./TemplateNode";
import { ReactEmailCodeEditor } from "../code-editor/ReactEmailCodeEditor";
import { HtmlCodeViewer } from "../code-editor/HtmlCodeViewer";
import { Button } from "@/components/ui/button";
import { AlertCircle, Copy, RefreshCw } from "lucide-react";
import Loader from "@/components/loader";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface CodeModeContentProps {
  template: {
    subject?: string;
    previewText?: string;
    reactEmailCode?: string;
    styleDefinitions?: Record<string, React.CSSProperties>;
  };
  nodeId: string;
}

export function CodeModeContent({ template, nodeId }: CodeModeContentProps) {
  const [activeTab, setActiveTab] = useState<"react" | "html">("react");
  // Cache rendered HTML to prevent unnecessary re-renders when switching tabs
  const [cachedHtml, setCachedHtml] = useState<{
    code: string;
    html: string;
  } | null>(null);

  // State for HTML rendering
  const [htmlError, setHtmlError] = useState<string | null>(null);
  const [htmlLoading, setHtmlLoading] = useState(false);
  const [htmlRefreshTrigger, setHtmlRefreshTrigger] = useState(0);

  const reactEmailCode = template.reactEmailCode || "";

  return (
    <div className="h-full flex flex-col">
      {/* Tab Selector */}
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
        <div className="flex items-center gap-2">
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
        </div>

        {/* Tab actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs relative">
            Alerts
            <Badge className="absolute -top-1 -right-2 h-4 w-4 text-[9px] font-medium">15</Badge>
          </Button>
          {activeTab === "react" && (
            <>
              <span className="text-xs">
                {reactEmailCode.startsWith("import") ? null : (
                  <span className="text-muted-foreground">⚠️ Unknown code</span>
                )}
              </span>

              <Button
                variant="ghost"
                size="sm"
                className="scale-100 focus-visible:scale-105 transition-transform"
                onClick={() => {
                  navigator.clipboard.writeText(reactEmailCode);
                  toast.success("React Email code copied to clipboard");
                }}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </>
          )}

          {activeTab === "html" && (
            <>
              {htmlError && (
                <span className="text-xs text-destructive">Render failed</span>
              )}
              {htmlLoading && <Loader />}

              {cachedHtml && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(cachedHtml?.html || "");
                      toast.success("HTML code copied to clipboard");
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHtmlRefreshTrigger((prev) => prev + 1)}
                disabled={htmlLoading}
                className="h-6 px-2"
                title="Force refresh HTML"
              >
                <RefreshCw
                  className={`h-3 w-3 ${htmlLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Editor/Viewer Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "react" ? (
          <ReactEmailCodeEditor
            reactEmailCode={reactEmailCode}
            styleDefinitions={template.styleDefinitions}
            nodeId={nodeId}
          />
        ) : (
          <HtmlCodeViewer
            reactEmailCode={reactEmailCode}
            cachedHtml={cachedHtml}
            onHtmlRendered={(html) => {
              setCachedHtml({
                code: reactEmailCode,
                html,
              });
            }}
            onLoadingChange={setHtmlLoading}
            onErrorChange={setHtmlError}
            refreshTrigger={htmlRefreshTrigger}
          />
        )}
      </div>
    </div>
  );
}

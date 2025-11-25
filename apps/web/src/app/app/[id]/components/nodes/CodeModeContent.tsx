"use client";

import React, { useState } from "react";
import type { TemplateNodeData } from "./TemplateNode";
import { ReactEmailCodeEditor } from "../code-editor/ReactEmailCodeEditor";
import { HtmlCodeViewer } from "../code-editor/HtmlCodeViewer";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import Loader from "@/components/loader";

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
          {activeTab === "react" && (
            <span className="text-xs">
              {reactEmailCode.startsWith("import") ? (
                <span className="text-green-600 dark:text-green-400">
                  ✓ JSX
                </span>
              ) : (
                <span className="text-gray-600 dark:text-gray-400">
                  ⚠️ Unknown
                </span>
              )}
            </span>
          )}

          {activeTab === "html" && (
            <>
              {htmlError && (
                <span className="text-xs text-red-600 dark:text-red-400">
                  Render failed
                </span>
              )}
              {htmlLoading && <Loader />}
              {!htmlLoading &&
                cachedHtml &&
                cachedHtml.code === reactEmailCode && (
                  <span className="text-xs text-green-600 dark:text-green-400">
                    ✓ Cached
                  </span>
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

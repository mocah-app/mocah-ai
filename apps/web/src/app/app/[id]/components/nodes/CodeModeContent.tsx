"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import type { TemplateNodeData } from "./TemplateNode";
import { ReactEmailCodeEditor } from "../code-editor/ReactEmailCodeEditor";
import type { CodeEditorRef } from "../code-editor/CodeEditor";
import { HtmlCodeViewer } from "../code-editor/HtmlCodeViewer";
import { CodeAlertsDrawer } from "../code-editor/CodeAlertsDrawer";
import { Button } from "@/components/ui/button";
import { Copy, RefreshCw, AlertTriangle, Save, RotateCcw } from "lucide-react";
import Loader from "@/components/loader";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { validateReactEmailCode } from "@mocah/shared/validation/react-email-validator";

interface CodeModeContentProps {
  template: {
    subject?: string;
    previewText?: string;
    reactEmailCode?: string;
    styleDefinitions?: Record<string, React.CSSProperties>;
  };
  nodeId: string;
  hasUnsavedSmartEditorChanges?: boolean;
  onSaveSmartEditorChanges?: () => void;
  onResetSmartEditorChanges?: () => void;
  isSaving?: boolean;
}

export function CodeModeContent({
  template,
  nodeId,
  hasUnsavedSmartEditorChanges = false,
  onSaveSmartEditorChanges,
  onResetSmartEditorChanges,
  isSaving = false,
}: CodeModeContentProps) {
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

  // State for validation and alerts drawer
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState(false);

  // Ref to the code editor for scrolling to lines
  const editorRef = useRef<CodeEditorRef>(null);

  const reactEmailCode = template.reactEmailCode || "";

  // Handle "go to line" from alerts drawer
  const handleGoToLine = useCallback((line: number) => {
    // Switch to React tab if not already there
    setActiveTab("react");
    // Close the drawer
    setIsAlertsDrawerOpen(false);
    // Small delay to ensure tab switch completes and editor is mounted
    setTimeout(() => {
      editorRef.current?.scrollToLine(line);
    }, 100);
  }, []);

  // Run initial validation when code changes
  useEffect(() => {
    if (reactEmailCode) {
      const result = validateReactEmailCode(reactEmailCode);
      setValidationErrors(result.errors);
      setValidationWarnings(result.warnings || []);
    }
  }, [reactEmailCode]);

  // Handle validation state updates from the editor
  const handleValidationStateChange = useCallback(
    (errors: string[], warnings: string[]) => {
      setValidationErrors(errors);
      setValidationWarnings(warnings);
    },
    []
  );

  const totalAlerts = validationErrors.length + validationWarnings.length;

  return (
    <div className="h-full flex flex-col relative">
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
          <Button
            variant="outline"
            size="sm"
            className="text-xs relative"
            onClick={() => setIsAlertsDrawerOpen(true)}
          >
            Alerts
            {totalAlerts > 0 && (
              <Badge
                className="absolute -top-1 -right-2 h-4 min-w-4 px-1 text-[9px] font-medium"
                variant={
                  validationErrors.length > 0 ? "destructive" : "default"
                }
              >
                {totalAlerts}
              </Badge>
            )}
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
            ref={editorRef}
            reactEmailCode={reactEmailCode}
            styleDefinitions={template.styleDefinitions}
            nodeId={nodeId}
            onValidationStateChange={handleValidationStateChange}
            readOnly={hasUnsavedSmartEditorChanges}
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

      {/* Alerts Drawer */}
      <CodeAlertsDrawer
        isOpen={isAlertsDrawerOpen}
        onClose={() => setIsAlertsDrawerOpen(false)}
        errors={validationErrors}
        warnings={validationWarnings}
        reactEmailCode={reactEmailCode}
        onGoToLine={handleGoToLine}
      />

      {/* Overlay when smart editor has unsaved changes */}
      {hasUnsavedSmartEditorChanges && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-full z-50 flex items-center justify-center">
          <div className="bg-card border border-border rounded-lg shadow-xl p-6 max-w-md mx-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Smart Changes to edit
                </h3>
                <p className="text-sm text-muted-foreground">
                  You have unsaved changes from the design editor
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onResetSmartEditorChanges}
                disabled={isSaving}
              >
                Reset
              </Button>
              <Button
                size="sm"
                onClick={onSaveSmartEditorChanges}
                disabled={isSaving}
              >
                {isSaving ? <Loader /> : <span>Save</span>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

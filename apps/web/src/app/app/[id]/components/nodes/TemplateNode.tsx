"use client";

import { Handle, Position } from "@xyflow/react";
import { Plus } from "lucide-react";
import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useEditorMode } from "../providers/EditorModeProvider";
import { useDesignChanges } from "../providers/DesignChangesProvider";
import { CodeModeContent } from "./CodeModeContent";
import { NodeHeader } from "./NodeHeader";
import { ViewModeContent } from "./ViewModeContent";
import MocahLoadingIcon from "@/components/mocah-brand/MocahLoadingIcon";
import { useTemplate, GENERATION_PHASE_MESSAGES } from "../providers/TemplateProvider";
import { CodeAlertsDrawer } from "../code-editor/CodeAlertsDrawer";
import { validateReactEmailCode } from "@mocah/shared/validation/react-email-validator";

export interface TemplateNodeData {
  version: number;
  name: string;
  isCurrent: boolean;
  isLoading?: boolean; // Loading state for streaming
  template: {
    subject?: string;
    previewText?: string;
    reactEmailCode?: string;
    styleDefinitions?: Record<string, React.CSSProperties>;
  };
  metadata?: {
    createdAt: Date;
    updatedAt: Date;
    generatedFrom?: string;
  };
  [key: string]: unknown;
}

// Props interface for the TemplateNode component
interface TemplateNodeProps {
  data: TemplateNodeData;
  id: string;
}

export function TemplateNode({ data, id }: TemplateNodeProps) {
  const nodeId = id;
  const { actions, state } = useEditorMode();
  const { state: templateState } = useTemplate();
  const { onSaveSmartEditorChanges, onResetSmartEditorChanges, isSaving } = useDesignChanges();
  const mode = actions.getNodeMode(nodeId);
  
  // Code editor should be blocked when smart editor has pending changes
  const hasSmartEditorPendingChanges = state.allPendingChanges.size > 0;

  // Drawer state - managed at TemplateNode level so it works in both modes
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState(false);
  const [drawerInitialTab, setDrawerInitialTab] = useState<"linter" | "compatibility" | "test-email">("compatibility");
  
  // Validation state
  const reactEmailCode = data.template.reactEmailCode || "";
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  
  // Ref to get cachedHtml from CodeModeContent (optional, only available in code mode)
  const cachedHtmlRef = useRef<{ code: string; html: string } | null>(null);
  
  // Ref to code editor for scrolling to lines (only available in code mode)
  const codeEditorScrollRef = useRef<((line: number) => void) | null>(null);

  // Run validation when code changes
  useEffect(() => {
    if (reactEmailCode) {
      const result = validateReactEmailCode(reactEmailCode);
      setValidationErrors(result.errors);
      setValidationWarnings(result.warnings || []);
    }
  }, [reactEmailCode]);

  // Handle test email - just open drawer
  const handleTestEmail = useCallback(() => {
    setDrawerInitialTab("test-email");
    setIsAlertsDrawerOpen(true);
  }, []);

  // Handle check compatibility - just open drawer
  const handleCheckCompatibility = useCallback(() => {
    setDrawerInitialTab("compatibility");
    setIsAlertsDrawerOpen(true);
  }, []);
  
  // Handle "go to line" from drawer - switch to code mode first if needed
  const handleGoToLine = useCallback((line: number) => {
    if (mode === "view") {
      // Switch to code mode first
      actions.setNodeMode(nodeId, "code");
      // Wait for code mode to be active, then scroll
      setTimeout(() => {
        codeEditorScrollRef.current?.(line);
      }, 200);
    } else {
      // Already in code mode, just scroll
      codeEditorScrollRef.current?.(line);
    }
    // Close drawer
    setIsAlertsDrawerOpen(false);
  }, [mode, nodeId, actions]);

  // Memoized callbacks to prevent infinite loops
  const handleValidationStateChange = useCallback((errors: string[], warnings: string[]) => {
    setValidationErrors(errors);
    setValidationWarnings(warnings);
  }, []);

  const handleCachedHtmlChange = useCallback((html: { code: string; html: string } | null) => {
    cachedHtmlRef.current = html;
  }, []);

  const handleEditorScrollRef = useCallback((scrollFn: (line: number) => void) => {
    codeEditorScrollRef.current = scrollFn;
  }, []);

  const handleDrawerOpen = useCallback((tab: "linter" | "compatibility" | "test-email") => {
    setDrawerInitialTab(tab);
    setIsAlertsDrawerOpen(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setIsAlertsDrawerOpen(false);
  }, []);

  // Memoize drawer state object to prevent re-renders
  const drawerState = useMemo(() => ({
    isOpen: isAlertsDrawerOpen,
    initialTab: drawerInitialTab,
    onOpen: handleDrawerOpen,
    onClose: handleDrawerClose,
  }), [isAlertsDrawerOpen, drawerInitialTab, handleDrawerOpen, handleDrawerClose]);

  return (
    <div className="bg-background rounded-lg shadow-lg border border-border w-full max-w-[600px] sm:w-[600px] relative">
      {/* Connection handles */}
      <Handle
        type="source"
        position={Position.Right}
        className="flex items-center justify-center"
        style={{
          position: "absolute",
          right: "-20px",
        }}
      >
        <div className="bg-ring rounded-full p-1">
          <Plus className="size-3 text-white" />
        </div>
      </Handle>

      {/* Node Header */}
      <NodeHeader
        version={data.version}
        name={data.name}
        isCurrent={data.isCurrent}
        nodeId={nodeId}
        currentMode={mode}
        templateId={templateState.currentTemplate?.id}
        templateName={templateState.currentTemplate?.name}
        onTestEmail={handleTestEmail}
        onCheckCompatibility={handleCheckCompatibility}
      />

      {/* Node Body */}
      {data.isLoading && templateState.generationPhase !== 'complete' ? (
        <LoadingState />
      ) : (
        <div className="h-[400px] sm:h-[500px] lg:h-[600px] overflow-hidden relative pt-2">
          {/* Show loading overlay if still loading but in complete phase (waiting for render) */}
          {data.isLoading && templateState.generationPhase === 'complete' && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
              <div className="relative mb-4">
                <MocahLoadingIcon isLoading={true} size="sm" />
              </div>
              <p className="text-muted-foreground text-sm animate-pulse">
                {GENERATION_PHASE_MESSAGES[templateState.generationPhase]}
              </p>
            </div>
          )}
          {/* Show loading overlay when switching versions */}
          {templateState.isSwitchingVersion && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
              <div className="relative mb-4">
                <MocahLoadingIcon isLoading={true} size="sm" />
              </div>
              <p className="text-muted-foreground text-sm animate-pulse">
                Switching to version...
              </p>
            </div>
          )}
          {mode === "view" ? (
            <ViewModeContent template={data.template} />
          ) : (
            <CodeModeContent
              template={data.template}
              nodeId={nodeId}
              hasUnsavedSmartEditorChanges={hasSmartEditorPendingChanges}
              onSaveSmartEditorChanges={onSaveSmartEditorChanges}
              onResetSmartEditorChanges={onResetSmartEditorChanges}
              isSaving={isSaving}
              onTestEmailRef={null}
              onCheckCompatibilityRef={null}
              onValidationStateChange={handleValidationStateChange}
              onCachedHtmlChange={handleCachedHtmlChange}
              onEditorScrollRef={handleEditorScrollRef}
              drawerState={drawerState}
            />
          )}
        </div>
      )}
      
      {/* Alerts Drawer - available in both modes */}
      <CodeAlertsDrawer
        isOpen={isAlertsDrawerOpen}
        onClose={handleDrawerClose}
        errors={validationErrors}
        warnings={validationWarnings}
        reactEmailCode={reactEmailCode}
        onGoToLine={handleGoToLine}
        cachedHtml={cachedHtmlRef.current}
        initialTab={drawerInitialTab}
      />
      
      {/* Node Footer */}
      <div className="border-border flex items-center justify-between"></div>
    </div>
  );
}

function LoadingState() {
  const { state } = useTemplate();
  const message = GENERATION_PHASE_MESSAGES[state.generationPhase] || 'Mocah is doing its magic...';
  
  return (
    <div className="bg-background w-full relative">
      {/* Loading Content */}
      <div className="min-h-[300px] sm:min-h-[400px] lg:min-h-[500px] flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="relative mb-4">
          <MocahLoadingIcon isLoading={true} size="sm" />
        </div>

        {/* Text */}
        <p className="text-muted-foreground text-sm animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
}

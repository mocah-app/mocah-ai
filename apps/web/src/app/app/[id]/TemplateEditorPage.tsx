"use client";

import React, { useEffect, useCallback, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CanvasProvider } from "./components/providers/CanvasProvider";
import {
  TemplateProvider,
  useTemplate,
} from "./components/providers/TemplateProvider";
import { EditorModeProvider } from "./components/providers/EditorModeProvider";
import { DesignChangesProvider } from "./components/providers/DesignChangesProvider";
import { ErrorFixProvider } from "./components/providers/ErrorFixProvider";
import { InfiniteCanvas } from "./components/canvas/InfiniteCanvas";
import { FloatingNav } from "./components/floating-panels/FloatingNav";
import { SaveDesignEdit } from "./components/canvas/SaveDesignEdit";
import { useCanvas } from "./components/providers/CanvasProvider";
import { useEditorMode } from "./components/providers/EditorModeProvider";
import { useTemplateCreation } from "@/utils/store-prompt-in-session";
import type { TemplateNodeData } from "./components/nodes/TemplateNode";
import type { ElementData } from "@/lib/react-email";
import EdgeRayLoader from "@/components/EdgeLoader";
import MocahLoadingIcon from "@/components/mocah-brand/MocahLoadingIcon";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { ImageStudioProvider } from "./components/image-studio/ImageStudioContext";
import { logger } from "@mocah/shared";

const ImageLibraryPanel = dynamic(
  () =>
    import("./components/floating-panels/ImageLibraryPanel").then(
      (mod) => mod.ImageLibraryPanel
    ),
  { ssr: false }
);

const ChatPanel = dynamic(
  () => import("./components/floating-panels/ChatPanel").then(
    (mod) => mod.ChatPanel
  ),
  { ssr: false }
);

const SmartEditorPanel = dynamic(
  () => import("./components/floating-panels/SmartEditorPanel").then(
    (mod) => mod.SmartEditorPanel
  ),
  { ssr: false }
);

const ImageStudioModal = dynamic(
  () => import("./components/image-studio/ImageStudioModal").then(
    (mod) => mod.ImageStudioModal
  ),
  { ssr: false }
);

function EditorContent({ templateId }: { templateId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state: templateState, actions: templateActions } = useTemplate();
  const { state: canvasState, actions: canvasActions } = useCanvas();
  const { state: editorState, actions: editorActions } = useEditorMode();
  const { getData, clearPrompt } = useTemplateCreation();

  // Read prompt and image URLs immediately on first render for ChatPanel prop
  const dataFromStorage = React.useMemo(() => {
    const data = getData();
    logger.info("[TemplatePage] Retrieved from session storage:", { data });
    return data;
  }, [getData]);
  const [activePanel, setActivePanel] = React.useState<string | null>(null);
  const [initialPrompt] = React.useState<string | null>(dataFromStorage?.prompt || null);
  const [initialImageUrls] = React.useState<string[]>(dataFromStorage?.imageUrls || []);
  const [errorFixPrompt, setErrorFixPrompt] = React.useState<
    string | undefined
  >(undefined);
  const [initialChatInput, setInitialChatInput] = React.useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  // Check if there are ANY pending changes across all elements (smart editor)
  const hasSmartEditorChanges = editorState.allPendingChanges.size > 0;
  // Check if code editor has unsaved changes
  const hasCodeEditorChanges = templateState.isDirty && !hasSmartEditorChanges;
  // Check if code editor overlay is handling the save (code mode + smart editor changes)
  const isCodeModeWithSmartEditorChanges =
    editorState.globalMode === "code" && hasSmartEditorChanges;
  // Show SaveDesignEdit bar only when overlay is NOT handling the save
  const hasPendingChanges = isCodeModeWithSmartEditorChanges
    ? false // Overlay handles save in code mode
    : hasSmartEditorChanges || hasCodeEditorChanges;

  // Get active node for save operations
  const activeNode =
    canvasState.nodes.find((n) => n.data.isCurrent) ||
    canvasState.nodes.find((n) => n.type === "template");

  // Handle save design changes - persists ALL pending changes to database
  const handleSaveChanges = useCallback(async () => {
    setIsSaving(true);

    try {
      const allChanges = editorActions.getAllPendingChanges();

      // Handle smart editor changes
      if (allChanges.size > 0 && activeNode) {
        const { updateReactEmailCode } = await import("@/lib/react-email");

        let currentCode = (activeNode.data as TemplateNodeData).template
          .reactEmailCode!;
        let currentStyleDefs =
          (activeNode.data as TemplateNodeData).template.styleDefinitions || {};

        // Apply ALL pending changes sequentially
        for (const [_elementId, pendingChange] of allChanges) {
          // Parse element data
          const elementData: ElementData = JSON.parse(
            pendingChange.originalElement
          );

          // Update React Email code based on this element's changes
          const { updatedCode, updatedStyleDefinitions } = updateReactEmailCode(
            currentCode,
            elementData,
            pendingChange.updates,
            currentStyleDefs
          );

          // Use the updated code/styles as the base for the next iteration
          currentCode = updatedCode;
          currentStyleDefs = updatedStyleDefinitions;
        }

        // Save the final accumulated result to database
        await templateActions.saveReactEmailCode(currentCode, currentStyleDefs);

        // Clear ALL pending changes after successful save
        editorActions.clearAllPendingChanges();
      }
      // Handle code editor changes (when no smart editor changes)
      else if (templateState.isDirty) {
        await templateActions.saveTemplate();
      }
    } catch (error) {
      console.error("Failed to save changes:", error);
    } finally {
      setIsSaving(false);
    }
  }, [editorActions, activeNode, templateActions, templateState.isDirty]);

  // Handle reset changes - clears ALL pending changes (no API calls)
  const handleResetChanges = useCallback(() => {
    // Handle smart editor changes
    if (editorState.allPendingChanges.size > 0) {
      // Clear ALL pending changes
      editorActions.clearAllPendingChanges();
      // Force the preview to re-render with original content
      editorActions.refreshPreview();
    }

    // Handle code editor changes - reset to last saved version (no API call)
    if (templateState.isDirty) {
      templateActions.resetReactEmailCode();
    }
  }, [
    editorActions,
    editorState.allPendingChanges.size,
    templateState.isDirty,
    templateActions,
  ]);

  // Handle save for smart editor changes only (used by code editor overlay)
  const handleSaveSmartEditorChanges = useCallback(async () => {
    const allChanges = editorActions.getAllPendingChanges();
    if (allChanges.size === 0 || !activeNode) return;

    setIsSaving(true);

    try {
      const { updateReactEmailCode } = await import("@/lib/react-email");

      let currentCode = (activeNode.data as TemplateNodeData).template
        .reactEmailCode!;
      let currentStyleDefs =
        (activeNode.data as TemplateNodeData).template.styleDefinitions || {};

      // Apply ALL pending changes sequentially
      for (const [_elementId, pendingChange] of allChanges) {
        const elementData: ElementData = JSON.parse(
          pendingChange.originalElement
        );

        const { updatedCode, updatedStyleDefinitions } = updateReactEmailCode(
          currentCode,
          elementData,
          pendingChange.updates,
          currentStyleDefs
        );

        currentCode = updatedCode;
        currentStyleDefs = updatedStyleDefinitions;
      }

      // Save to database
      await templateActions.saveReactEmailCode(currentCode, currentStyleDefs);

      // Clear pending changes
      editorActions.clearAllPendingChanges();
    } catch (error) {
      console.error("Failed to save smart editor changes:", error);
    } finally {
      setIsSaving(false);
    }
  }, [editorActions, activeNode, templateActions]);

  // Handle reset for smart editor changes only (used by code editor overlay)
  const handleResetSmartEditorChanges = useCallback(() => {
    editorActions.clearAllPendingChanges();
    editorActions.refreshPreview();
  }, [editorActions]);

  // Auto-open chat if we have a prompt
  useEffect(() => {
    if (dataFromStorage?.prompt) {
      setActivePanel("chat");
    }
  }, [dataFromStorage]);

  // Auto-open editor panel when an element is selected
  useEffect(() => {
    if (editorState.selectedElement) {
      setActivePanel("editor");
    }
    // Note: Don't auto-close editor when element is deselected
    // User should be able to keep editor open to see instructions
  }, [editorState.selectedElement]);

  // Auto-open library panel when library URL param is set
  useEffect(() => {
    const libraryParam = searchParams.get('library');
    if (libraryParam === 'open') {
      setActivePanel('library');
      // Remove the param from URL
      const params = new URLSearchParams(searchParams.toString());
      params.delete('library');
      router.replace(`/app/${templateId}?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, router, templateId]);

  // Handle panel toggle with mutual exclusivity
  const handlePanelToggle = (panel: string) => {
    if (activePanel === panel) {
      // Close the currently open panel
      setActivePanel(null);
      // If closing editor, also deselect element and disable design mode
      if (panel === "editor") {
        editorActions.selectElement(null);
        editorActions.setDesignMode(false);
      }
    } else {
      // Open the new panel and close any other
      setActivePanel(panel);

      // If opening editor, enable design mode for element selection
      if (panel === "editor") {
        editorActions.setDesignMode(true);
      }

      // If opening chat, close editor and deselect element
      if (panel === "chat") {
        if (editorState.selectedElement) {
          editorActions.selectElement(null);
        }
        editorActions.setDesignMode(false);
      }
    }
  };

  // Handle opening chat with initial text
  const handleOpenChatWithText = useCallback((text: string) => {
    setInitialChatInput(text);
    setActivePanel("chat");
    // Close editor and deselect element if open
    if (editorState.selectedElement) {
      editorActions.selectElement(null);
    }
    editorActions.setDesignMode(false);
  }, [editorState.selectedElement, editorActions]);

  // Handle error fix request from preview component
  const handleRequestErrorFix = useCallback((error: string, _code: string) => {
    // Note: We don't need to include the template code in the prompt
    // The regeneration API automatically fetches it from the database
    const errorFixMessage = `I'm getting a rendering error in my template. Please fix it while keeping the rest of the design intact.

**Error:**
${error}`;

    setErrorFixPrompt(errorFixMessage);
    setActivePanel("chat");
  }, []);

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
          template: { reactEmailCode: "" },
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
        reactEmailCode:
          templateState.reactEmailCode || template.reactEmailCode || undefined,
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
          isLoading: templateState.isLoading, // Use actual loading state
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
      reactEmailCode:
        templateState.reactEmailCode || template.reactEmailCode || undefined,
      styleDefinitions: templateState.styleDefinitions,
    };

    // Check if content actually changed (avoid infinite updates)
    const currentContent = JSON.stringify(existingNode.data.template);
    const newContent = JSON.stringify(templateContent);
    const loadingChanged =
      existingNode.data.isLoading !== templateState.isLoading;

    if (
      currentContent === newContent &&
      existingNode.data.name === template.name &&
      !loadingChanged
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
        isLoading: templateState.isLoading, // Use actual loading state
        template: templateContent,
        metadata: {
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
        },
      },
    });
  }, [
    templateState.isStreaming,
    templateState.isLoading,
    templateState.currentTemplate,
    templateState.reactEmailCode,
    templateState.styleDefinitions,
    canvasState.nodes,
    canvasActions,
  ]);

  // Show loading overlay when template is loading and no node exists yet
  const isLoadingTemplate =
    templateState.isLoading &&
    !templateState.currentTemplate &&
    !templateState.isStreaming;
  const hasTemplateNode = canvasState.nodes.some(
    (n) => n.id === "template-node" || n.id.startsWith("template-")
  );

  // Show error UI for not found or load errors
  if (templateState.error) {
    return (
      <div className="h-screen w-full flex bg-dot items-center justify-center relative">
        <div className="bg-background/80 inset-0 backdrop-blur-ssm rounded-lg p-8 absolute" />
        <div className="max-w-md w-full mx-auto text-center space-y-6 p-8 relative z-10">
          <div className="mx-auto flex items-center justify-center">
            <MocahLoadingIcon isLoading={true} size="sm" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {templateState.error === "NOT_FOUND"
                ? "Template not found"
                : "Failed to load template"}
            </h1>
            <p className="text-muted-foreground text-balance">
              {templateState.error === "NOT_FOUND"
                ? "This template may have been deleted or you don't have access to it."
                : "Something went wrong while loading this template. Please try again."}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline">
              <Link href="/app">Dashboard</Link>
            </Button>
            <Button asChild>
              <Link href="/app/new">New Template</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ImageStudioProvider>
      <DesignChangesProvider
        onSaveSmartEditorChanges={handleSaveSmartEditorChanges}
        onResetSmartEditorChanges={handleResetSmartEditorChanges}
        isSaving={isSaving}
      >
        <ErrorFixProvider onRequestErrorFix={handleRequestErrorFix}>
          <div className="h-screen w-full relative overflow-hidden flex">
          <div className="flex h-dvh">
            <FloatingNav
              activePanel={activePanel}
              onTogglePanel={handlePanelToggle}
            />
            <ChatPanel
              isOpen={activePanel === "chat"}
              onClose={() => {
                setActivePanel(null);
              }}
              initialPrompt={initialPrompt || undefined}
              initialImageUrls={initialImageUrls}
              onPromptConsumed={clearPrompt}
              errorFixPrompt={errorFixPrompt}
              onErrorFixConsumed={() => setErrorFixPrompt(undefined)}
              initialInput={initialChatInput}
              onInputConsumed={() => setInitialChatInput(undefined)}
            />
            <SmartEditorPanel
              isOpen={activePanel === "editor"}
              onClose={() => {
                setActivePanel(null);
                editorActions.selectElement(null);
                editorActions.setDesignMode(false);
              }}
              onOpenChat={handleOpenChatWithText}
            />
            <ImageLibraryPanel
              isOpen={activePanel === "library"}
              onClose={() => setActivePanel(null)}
            />
          </div>
          <InfiniteCanvas />

          {/* Loading overlay when opening template from dashboard */}
          {isLoadingTemplate && !hasTemplateNode && (
            <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <div className="relative w-full h-full">
                <EdgeRayLoader />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12">
                  <div className="relative mb-4">
                    <MocahLoadingIcon isLoading={true} size="sm" />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Loading template...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Floating save bar for unsaved design changes */}
          <SaveDesignEdit
            isVisible={hasPendingChanges}
            onSave={handleSaveChanges}
            onReset={handleResetChanges}
            isSaving={isSaving}
          />

          {/* Image Studio Modal - triggered by URL param */}
          <Suspense fallback={null}>
            <ImageStudioModal />
          </Suspense>
        </div>
      </ErrorFixProvider>
    </DesignChangesProvider>
    </ImageStudioProvider>
  );
}

export function TemplateEditorPage({ templateId }: { templateId: string }) {
  return (
    <CanvasProvider>
      <TemplateProvider templateId={templateId}>
        <EditorModeProvider>
          <EditorContent templateId={templateId} />
        </EditorModeProvider>
      </TemplateProvider>
    </CanvasProvider>
  );
}

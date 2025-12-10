"use client";

import { trpc } from "@/utils/trpc";
import type { Template, TemplateVersion, BrandKit } from "@mocah/db";
import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
} from "react";
import { convertDates, logger } from "@mocah/shared";
import { useStreamTemplate } from "@/hooks/use-stream-template";
import { useOrganization } from "@/contexts/organization-context";
import {
  type GenerationPhase,
  type StreamingProgress,
  getNextPhase,
} from "./generation-phases";

// Re-export for consumers
export { GENERATION_PHASE_MESSAGES, type GenerationPhase } from "./generation-phases";

// Template-level error types
export type TemplateError = "NOT_FOUND" | "LOAD_ERROR" | null;

// Validation error state when AI generates invalid code
export interface ValidationError {
  errors: string[];
  warnings: string[];
  attemptedCode: string;
}

interface TemplateState {
  currentTemplate: Template | null;
  versions: TemplateVersion[];
  currentVersion: string | null;
  brandKit: BrandKit | null;
  isDirty: boolean;
  isLoading: boolean;
  isStreaming: boolean;
  streamingProgress: StreamingProgress | null;
  generationPhase: GenerationPhase;
  waitingForRender: boolean; // True when waiting for preview to render after generation
  validationError: ValidationError | null; // When AI generates code that fails validation
  error: TemplateError; // Template-level error (not found, load failed, etc.)
  
  // React Email specific state
  reactEmailCode: string | null;
  styleDefinitions: Record<string, React.CSSProperties>;
}

interface TemplateActions {
  loadTemplate: (id: string) => Promise<void>;
  saveTemplate: () => Promise<void>;
  createVersion: (name?: string) => Promise<void>;
  switchVersion: (versionId: string) => void;
  deleteVersion: (versionId: string) => Promise<void>;
  updateElement: (elementPath: string, data: any) => void;
  regenerateElement: (elementPath: string, prompt: string) => Promise<void>;
  regenerateTemplate: (prompt: string, imageUrls?: string[], includeBrandGuide?: boolean) => Promise<void>;
  generateTemplate: (prompt: string) => Promise<Template | null>;
  generateTemplateStream: (prompt: string, imageUrls?: string[], includeBrandGuide?: boolean) => Promise<void>;
  cancelGeneration: () => void;
  setIsDirty: (dirty: boolean) => void;
  onPreviewRenderComplete: () => void; // Called when preview finishes rendering
  clearValidationError: () => void; // Clear validation error state
  
  // React Email specific actions
  updateReactEmailCode: (code: string, styleDefinitions?: Record<string, React.CSSProperties>) => void;
  saveReactEmailCode: (code: string, styleDefinitions?: Record<string, React.CSSProperties>) => Promise<void>;
  resetReactEmailCode: () => void;
  refetchTemplate: () => Promise<void>;
}

interface TemplateContextValue {
  state: TemplateState;
  actions: TemplateActions;
}

const TemplateContext = createContext<TemplateContextValue | undefined>(
  undefined
);

export function useTemplate() {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error("useTemplate must be used within TemplateProvider");
  }
  return context;
}

export function TemplateProvider({
  children,
  templateId,
}: {
  children: React.ReactNode;
  templateId?: string;
}) {
  const { activeOrganization } = useOrganization();
  const [state, setState] = useState<TemplateState>({
    currentTemplate: null,
    versions: [],
    currentVersion: null,
    brandKit: null,
    isDirty: false,
    isLoading: false,
    isStreaming: false,
    streamingProgress: null,
    generationPhase: 'idle',
    waitingForRender: false,
    validationError: null,
    error: null,
    reactEmailCode: null,
    styleDefinitions: {},
  });

  // Streaming hook for initial generation
  const {
    partialTemplate,
    generate: generateStream,
    cancel: cancelStream,
    isGenerating,
    error: streamError,
  } = useStreamTemplate({
    organizationId: activeOrganization?.id || "",
    apiEndpoint: "/api/template/generate",
    onComplete: async (template) => {
      // When streaming completes, update the existing template in database
      try {
        // Update the existing template (should have been created as skeleton)
        if (!templateId) {
          throw new Error("No template ID available to update");
        }

        // Convert styleType to uppercase to match Prisma enum
        const styleTypeMap: Record<string, 'INLINE' | 'PREDEFINED_CLASSES' | 'STYLE_OBJECTS'> = {
          'inline': 'INLINE',
          'predefined-classes': 'PREDEFINED_CLASSES',
          'style-objects': 'STYLE_OBJECTS',
        };
        const mappedStyleType = template.styleType ? styleTypeMap[template.styleType] : 'STYLE_OBJECTS';

        // Parse styleDefinitions - handle both JSON string and object formats
        let styleDefinitions: Record<string, React.CSSProperties> = {};
        const templateAny = template as any;
        const styleDefsJson = templateAny.styleDefinitionsJson;
        const styleDefs = templateAny.styleDefinitions;
        
        if (styleDefsJson && typeof styleDefsJson === 'string') {
          try {
            styleDefinitions = JSON.parse(styleDefsJson);
          } catch {
            // Ignore parse errors
          }
        } else if (styleDefs && typeof styleDefs === 'object') {
          styleDefinitions = styleDefs;
        }

        // Log the data being saved for debugging
        const updatePayload = {
          id: templateId,
          name: template.subject || "AI Generated Template",
          subject: template.subject,
          reactEmailCode: template.reactEmailCode,
          styleType: mappedStyleType,
          styleDefinitions,
          previewText: template.previewText,
          status: "ACTIVE" as const, // Mark as ACTIVE - generation complete
        };
        
        logger.info("📝 [TemplateProvider] Saving streamed template data:", {
          id: updatePayload.id,
          name: updatePayload.name,
          subject: updatePayload.subject,
          previewText: updatePayload.previewText,
          styleType: updatePayload.styleType,
          reactEmailCodeLength: updatePayload.reactEmailCode?.length || 0,
          styleDefinitionsKeys: Object.keys(styleDefinitions),
        });

        // Set finalizing phase while saving
        setState((prev) => ({
          ...prev,
          generationPhase: 'finalizing',
        }));

        const result = await updateMutation.mutateAsync(updatePayload);

        // Check if the result is a validation error (returned instead of throwing)
        if ('validationFailed' in result && result.validationFailed) {
          logger.warn("⚠️ [TemplateProvider] Validation failed for generated template:", {
            errors: result.validationErrors,
            warnings: result.validationWarnings,
          });
          
          setState((prev) => ({
            ...prev,
            isStreaming: false,
            streamingProgress: null,
            isLoading: false,
            generationPhase: 'idle',
            validationError: {
              errors: result.validationErrors,
              warnings: result.validationWarnings,
              attemptedCode: result.attemptedCode,
            },
          }));
          return;
        }

        const processedResult = convertDates(result);

        setState((prev) => ({
          ...prev,
          currentTemplate: processedResult,
          reactEmailCode: template.reactEmailCode || null,
          styleDefinitions,
          isStreaming: false,
          streamingProgress: null,
          isLoading: false,
          generationPhase: 'complete',
          validationError: null, // Clear any previous validation errors
        }));

        // Refetch to get the latest data
        await refetch();
      } catch (error) {
        logger.error("❌ [TemplateProvider] Failed to save streamed template:", error as Error);
        logger.error("📋 [TemplateProvider] Error details:", {
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          templateId,
          templateData: {
            subject: template.subject,
            reactEmailCodeLength: template.reactEmailCode?.length || 0,
          },
        });
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          isLoading: false,
          waitingForRender: false,
          generationPhase: 'idle',
        }));
      }
    },
    onError: (error) => {
      console.error("Streaming error:", error);
      setState((prev) => ({
        ...prev,
        isStreaming: false,
        streamingProgress: null,
        isLoading: false,
        waitingForRender: false,
        generationPhase: 'idle',
      }));
    },
  });

  // Streaming hook for regeneration
  const {
    partialTemplate: regenerationPartialTemplate,
    generate: regenerateStream,
    cancel: cancelRegenerationStream,
    isGenerating: isRegenerating,
    error: regenerationError,
  } = useStreamTemplate({
    templateId: templateId,
    apiEndpoint: "/api/template/regenerate",
    onComplete: async (template) => {
      // When regeneration streaming completes, update the template in database
      try {
        if (!templateId) {
          throw new Error("No template ID available to update");
        }

        // Convert styleType to uppercase to match Prisma enum
        const styleTypeMap: Record<string, 'INLINE' | 'PREDEFINED_CLASSES' | 'STYLE_OBJECTS'> = {
          'inline': 'INLINE',
          'predefined-classes': 'PREDEFINED_CLASSES',
          'style-objects': 'STYLE_OBJECTS',
        };
        const mappedStyleType = template.styleType ? styleTypeMap[template.styleType] : 'STYLE_OBJECTS';

        // Parse styleDefinitions
        let styleDefinitions: Record<string, React.CSSProperties> = {};
        const templateAny = template as any;
        const styleDefsJson = templateAny.styleDefinitionsJson;
        const styleDefs = templateAny.styleDefinitions;
        
        if (styleDefsJson && typeof styleDefsJson === 'string') {
          try {
            styleDefinitions = JSON.parse(styleDefsJson);
          } catch {
            // Ignore parse errors
          }
        } else if (styleDefs && typeof styleDefs === 'object') {
          styleDefinitions = styleDefs;
        }

        const updatePayload = {
          id: templateId,
          name: template.subject || state.currentTemplate?.name || "AI Generated Template",
          subject: template.subject,
          reactEmailCode: template.reactEmailCode,
          styleType: mappedStyleType,
          styleDefinitions,
          previewText: template.previewText,
        };
        
        logger.info("🔄 [TemplateProvider] Saving regenerated template data:", {
          id: updatePayload.id,
          name: updatePayload.name,
          subject: updatePayload.subject,
          previewText: updatePayload.previewText,
          styleType: updatePayload.styleType,
          reactEmailCodeLength: updatePayload.reactEmailCode?.length || 0,
        });

        // Set finalizing phase while saving
        setState((prev) => ({
          ...prev,
          generationPhase: 'finalizing',
        }));

        const result = await updateMutation.mutateAsync(updatePayload);
        
        // Check if the result is a validation error (returned instead of throwing)
        if ('validationFailed' in result && result.validationFailed) {
          logger.warn("⚠️ [TemplateProvider] Validation failed for regenerated template:", {
            errors: result.validationErrors,
            warnings: result.validationWarnings,
          });
          
          setState((prev) => ({
            ...prev,
            isStreaming: false,
            streamingProgress: null,
            isLoading: false,
            waitingForRender: false,
            generationPhase: 'idle',
            validationError: {
              errors: result.validationErrors,
              warnings: result.validationWarnings,
              attemptedCode: result.attemptedCode,
            },
          }));
          return;
        }
        
        const processedResult = convertDates(result);

        logger.info("⏳ [TemplateProvider] Regenerated template saved, waiting for preview render", {
          reactEmailCodeLength: template.reactEmailCode?.length || 0,
        });

        setState((prev) => ({
          ...prev,
          currentTemplate: processedResult,
          reactEmailCode: template.reactEmailCode || null,
          styleDefinitions,
          isStreaming: false,
          streamingProgress: null,
          isLoading: true, // Keep loading true
          waitingForRender: true, // Wait for preview to render
          generationPhase: 'complete',
          validationError: null, // Clear any previous validation errors
        }));

        // Refetch to get the latest data
        await refetch();
      } catch (error) {
        logger.error("❌ [TemplateProvider] Failed to save regenerated template:", error as Error);
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          isLoading: false,
          waitingForRender: false,
          generationPhase: 'idle',
        }));
      }
    },
    onError: (error) => {
      console.error("Regeneration streaming error:", error);
      setState((prev) => ({
        ...prev,
        isStreaming: false,
        streamingProgress: null,
        isLoading: false,
        waitingForRender: false,
        generationPhase: 'idle',
      }));
    },
  });

  // Combine streaming progress from both hooks
  const currentStreamingProgress = partialTemplate || regenerationPartialTemplate;
  const isCurrentlyStreaming = isGenerating || isRegenerating;

  // Update streaming progress and generation phase in state
  useEffect(() => {
    if (!isCurrentlyStreaming && !currentStreamingProgress) return;

    const progress = currentStreamingProgress as StreamingProgress | null;

    setState((prev) => {
      // If streaming just started (starting/analyzing phase) and no new progress yet,
      // clear old streamingProgress to avoid showing stale data
      const shouldClearOldProgress = 
        isCurrentlyStreaming && 
        !progress && 
        (prev.generationPhase === 'starting' || prev.generationPhase === 'analyzing');

      return {
        ...prev,
        streamingProgress: shouldClearOldProgress ? null : (progress || prev.streamingProgress),
        isStreaming: isCurrentlyStreaming,
        generationPhase: getNextPhase(prev.generationPhase, isCurrentlyStreaming, progress),
      };
    });
  }, [currentStreamingProgress, isCurrentlyStreaming]);

  // Auto-transition from 'starting' to 'analyzing' after brief delay
  // This gives users visual feedback during server-side processing
  useEffect(() => {
    if (state.generationPhase !== 'starting') return;

    const timer = setTimeout(() => {
      setState((prev) => {
        // Only transition if still in starting phase
        if (prev.generationPhase === 'starting') {
          return { ...prev, generationPhase: 'analyzing' };
        }
        return prev;
      });
    }, 800);

    return () => clearTimeout(timer);
  }, [state.generationPhase]);

  // tRPC utils for cache invalidation
  const utils = trpc.useUtils();

  // tRPC mutations
  const regenerateMutation = trpc.template.regenerate.useMutation();
  const generateMutation = trpc.template.generate.useMutation({
    onSuccess: () => {
      utils.template.list.invalidate();
    },
  });
  const createMutation = trpc.template.create.useMutation({
    onSuccess: () => {
      utils.template.list.invalidate();
    },
  });
  const updateMutation = trpc.template.update.useMutation({
    onSuccess: () => {
      // Invalidate the specific template query to ensure fresh data on refetch
      if (templateId) {
        utils.template.get.invalidate({ id: templateId });
      }
    },
  });

  // tRPC queries - fetch template data
  // Note: No retry needed for NOT_FOUND since skeleton is created before navigation
  const {
    data: templateData,
    isLoading: isQueryLoading,
    refetch,
    error: queryError,
  } = trpc.template.get.useQuery(
    { id: templateId! },
    {
      enabled: !!templateId,
    }
  );

  // Sync query loading state (but don't override if waiting for render)
  useEffect(() => {
    setState((prev) => {
      // If we're waiting for render, keep isLoading true
      if (prev.waitingForRender) {
        return prev;
      }
      return {
        ...prev,
        isLoading: isQueryLoading,
      };
    });
  }, [isQueryLoading]);

  // Sync query data to state
  useEffect(() => {
    if (templateData) {
      const processedData = convertDates(templateData);

      setState((prev) => ({
        ...prev,
        currentTemplate: processedData as Template,
        versions: processedData.versions as TemplateVersion[],
        currentVersion: processedData.currentVersionId,
        brandKit: processedData.organization.brandKit as BrandKit,
        reactEmailCode: processedData.reactEmailCode || null,
        styleDefinitions: (processedData.styleDefinitions as Record<string, React.CSSProperties>) || {},
        // Only set isLoading to false if we're not waiting for render
        isLoading: prev.waitingForRender ? true : false,
      }));
    }
  }, [templateData]);

  // Handle query errors - set error state for not found UI
  useEffect(() => {
    if (queryError) {
      const errorData = queryError.data as { code?: string } | undefined;
      if (errorData?.code === "NOT_FOUND") {
        logger.warn("Template not found", { templateId });
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "NOT_FOUND",
        }));
      } else {
        logger.error("Failed to load template", queryError);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "LOAD_ERROR",
        }));
      }
    }
  }, [queryError, templateId]);

  const loadTemplate = useCallback(
    async (id: string) => {
      // If the ID matches the current prop, just refetch
      if (id === templateId) {
        await refetch();
      } else {
        // If we needed to support loading arbitrary templates not passed via props,
        // we would need to change how useQuery is used or use utils.client.template.get.fetch
        console.warn(
          "loadTemplate called with different ID than prop",
          id,
          templateId
        );
      }
    },
    [templateId, refetch]
  );

  const saveTemplate = useCallback(async () => {
    if (!state.currentTemplate) return;

    try {
      await updateMutation.mutateAsync({
        id: state.currentTemplate.id,
        reactEmailCode: state.reactEmailCode || undefined,
        styleDefinitions: state.styleDefinitions,
      });
      console.log("Template saved");
      setState((prev) => ({ ...prev, isDirty: false }));
    } catch (error) {
      console.error("Failed to save template:", error);
    }
  }, [state.currentTemplate, state.reactEmailCode, state.styleDefinitions, updateMutation]);

  const createVersion = useCallback(
    async (name?: string) => {
      if (!state.currentTemplate) return;

      try {
        // Placeholder - will be replaced with actual tRPC call
        // const newVersion = await api.template.createVersion.mutate({ templateId: state.currentTemplate.id, name });
        console.log("Creating version:", name);
      } catch (error) {
        console.error("Failed to create version:", error);
      }
    },
    [state.currentTemplate]
  );

  const switchVersion = useCallback((versionId: string) => {
    setState((prev) => ({ ...prev, currentVersion: versionId }));
  }, []);

  const deleteVersion = useCallback(async (versionId: string) => {
    try {
      // Placeholder - will be replaced with actual tRPC call
      // await api.template.deleteVersion.mutate({ versionId });
      console.log("Deleting version:", versionId);
    } catch (error) {
      console.error("Failed to delete version:", error);
    }
  }, []);

  // Legacy updateElement - now a no-op as we use React Email code directly
  // Element updates are handled via updateReactEmailCode
  const updateElement = useCallback((_elementPath: string, _data: any) => {
    console.warn("updateElement is deprecated. Use updateReactEmailCode instead.");
  }, []);

  const regenerateElement = useCallback(
    async (elementPath: string, prompt: string) => {
      try {
        // Placeholder - will be replaced with actual tRPC call
        // await api.template.regenerateElement.mutate({ elementPath, prompt });
        console.log("Regenerating element:", elementPath, prompt);
      } catch (error) {
        console.error("Failed to regenerate element:", error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [state.currentTemplate]
  );

  const regenerateTemplate = useCallback(
    async (prompt: string, imageUrls?: string[], includeBrandGuide?: boolean) => {
      if (!state.currentTemplate) {
        throw new Error("No template loaded");
      }

      setState((prev) => ({
        ...prev,
        isStreaming: true,
        isLoading: true,
        streamingProgress: null,
        generationPhase: 'starting',
      }));

      try {
        logger.info("🔄 [TemplateProvider] Starting template regeneration with streaming", {
          templateId: state.currentTemplate.id,
          promptPreview: prompt.substring(0, 100),
          imageCount: imageUrls?.length || 0,
        });

        await regenerateStream(prompt, imageUrls, includeBrandGuide);
      } catch (error) {
        console.error("Failed to regenerate template:", error);
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          isLoading: false,
          waitingForRender: false,
          generationPhase: 'idle',
        }));
        throw error;
      }
    },
    [state.currentTemplate, regenerateStream, activeOrganization]
  );

  const generateTemplate = useCallback(
    async (prompt: string): Promise<Template | null> => {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const result = await generateMutation.mutateAsync({
          prompt,
        });

        console.log("Template generated:", result);

        const processedResult = convertDates(result);

        // Update state with the new template
        setState((prev) => ({
          ...prev,
          currentTemplate: processedResult,
          isLoading: false,
          isDirty: false,
        }));

        return processedResult;
      } catch (error) {
        console.error("Failed to generate template:", error);
        setState((prev) => ({ ...prev, isLoading: false }));
        throw error;
      }
    },
    [generateMutation]
  );

  const setIsDirty = useCallback((dirty: boolean) => {
    setState((prev) => ({ ...prev, isDirty: dirty }));
  }, []);

  const updateReactEmailCode = useCallback((
    code: string,
    styleDefinitions?: Record<string, React.CSSProperties>
  ) => {
    setState((prev) => ({
      ...prev,
      reactEmailCode: code,
      styleDefinitions: styleDefinitions || prev.styleDefinitions,
      isDirty: true,
    }));
  }, []);

  // Reset React Email code to the last saved version (no API call)
  const resetReactEmailCode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      reactEmailCode: prev.currentTemplate?.reactEmailCode || null,
      styleDefinitions: (prev.currentTemplate?.styleDefinitions as Record<string, React.CSSProperties>) || {},
      isDirty: false,
    }));
  }, []);

  // Save React Email code to database
  const saveReactEmailCode = useCallback(async (
    code: string,
    styleDefinitions?: Record<string, React.CSSProperties>
  ) => {
    if (!state.currentTemplate) {
      throw new Error("No template loaded");
    }

    try {
      await updateMutation.mutateAsync({
        id: state.currentTemplate.id,
        reactEmailCode: code,
        styleDefinitions: styleDefinitions,
      });

      // Update local state
      setState((prev) => ({
        ...prev,
        reactEmailCode: code,
        styleDefinitions: styleDefinitions || prev.styleDefinitions,
        isDirty: false,
      }));

      // Refetch to ensure UI is in sync
      await refetch();
    } catch (error) {
      console.error("Failed to save React Email code:", error);
      throw error;
    }
  }, [state.currentTemplate, updateMutation, refetch]);

  // Expose refetch for revalidation
  const refetchTemplate = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const generateTemplateStream = useCallback(
    async (prompt: string, imageUrls?: string[], includeBrandGuide?: boolean) => {
      if (!activeOrganization?.id) {
        throw new Error("No organization selected");
      }

      setState((prev) => ({
        ...prev,
        isStreaming: true,
        isLoading: true,
        streamingProgress: null,
        generationPhase: 'starting',
      }));

      try {
        await generateStream(prompt, imageUrls, includeBrandGuide);
      } catch (error) {
        console.error("Failed to generate template stream:", error);
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          isLoading: false,
          waitingForRender: false,
          generationPhase: 'idle',
        }));
        throw error;
      }
    },
    [generateStream, activeOrganization?.id]
  );

  const cancelGeneration = useCallback(() => {
    // Cancel both generation and regeneration streams
    cancelStream();
    cancelRegenerationStream();
    setState((prev) => ({
      ...prev,
      isStreaming: false,
      isLoading: false,
      streamingProgress: null,
      waitingForRender: false,
      generationPhase: 'idle',
    }));
  }, [cancelStream, cancelRegenerationStream]);

  const onPreviewRenderComplete = useCallback(() => {
    setState((prev) => {
      // Only update if we were waiting for render
      if (prev.waitingForRender) {
        logger.info("✅ [TemplateProvider] Preview render complete, clearing loading state");
        return {
          ...prev,
          isLoading: false,
          waitingForRender: false,
        };
      }
      return prev;
    });
  }, []);

  const clearValidationError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      validationError: null,
    }));
  }, []);

  const actions: TemplateActions = {
    loadTemplate,
    saveTemplate,
    createVersion,
    switchVersion,
    deleteVersion,
    updateElement,
    regenerateElement,
    regenerateTemplate,
    generateTemplate,
    generateTemplateStream,
    cancelGeneration,
    setIsDirty,
    onPreviewRenderComplete,
    clearValidationError,
    updateReactEmailCode,
    saveReactEmailCode,
    resetReactEmailCode,
    refetchTemplate,
  };

  return (
    <TemplateContext.Provider value={{ state, actions }}>
      {children}
    </TemplateContext.Provider>
  );
}

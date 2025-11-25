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
import { convertDates } from "@mocah/shared";
import { useStreamTemplate } from "@/hooks/use-stream-template";
import { useOrganization } from "@/contexts/organization-context";
import { useRouter } from "next/navigation";

// Partial template for streaming progress
interface StreamingProgress {
  subject?: string;
  previewText?: string;
  reactEmailCode?: string;
  styleType?: 'INLINE' | 'PREDEFINED_CLASSES' | 'STYLE_OBJECTS';
  styleDefinitions?: Record<string, React.CSSProperties>;
  metadata?: {
    emailType?: string;
    generatedAt?: string;
    model?: string;
    tokensUsed?: number;
  };
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
  regenerateTemplate: (prompt: string) => Promise<void>;
  generateTemplate: (prompt: string) => Promise<Template | null>;
  generateTemplateStream: (prompt: string) => Promise<void>;
  setIsDirty: (dirty: boolean) => void;
  
  // React Email specific actions
  updateReactEmailCode: (code: string, styleDefinitions?: Record<string, React.CSSProperties>) => void;
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
  const router = useRouter();
  const [state, setState] = useState<TemplateState>({
    currentTemplate: null,
    versions: [],
    currentVersion: null,
    brandKit: null,
    isDirty: false,
    isLoading: false,
    isStreaming: false,
    streamingProgress: null,
    reactEmailCode: null,
    styleDefinitions: {},
  });

  // Streaming hook
  const {
    partialTemplate,
    generate: generateStream,
    isGenerating,
    error: streamError,
  } = useStreamTemplate({
    organizationId: activeOrganization?.id || "",
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

        const result = await updateMutation.mutateAsync({
          id: templateId,
          name: template.subject || "AI Generated Template",
          subject: template.subject,
          reactEmailCode: template.reactEmailCode,
          styleType: mappedStyleType,
          styleDefinitions: template.styleDefinitions,
          previewText: template.previewText,
        });

        const processedResult = convertDates(result);

        setState((prev) => ({
          ...prev,
          currentTemplate: processedResult,
          reactEmailCode: template.reactEmailCode || null,
          styleDefinitions: template.styleDefinitions || {},
          isStreaming: false,
          streamingProgress: null,
          isLoading: false,
        }));

        // Refetch to get the latest data
        await refetch();
      } catch (error) {
        console.error("Failed to save streamed template:", error);
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          isLoading: false,
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
      }));
    },
  });

  // Update streaming progress in state
  useEffect(() => {
    if (partialTemplate) {
      setState((prev) => ({
        ...prev,
        streamingProgress: partialTemplate as StreamingProgress,
        isStreaming: isGenerating,
      }));
    }
  }, [partialTemplate, isGenerating]);

  // tRPC mutations
  const regenerateMutation = trpc.template.regenerate.useMutation();
  const generateMutation = trpc.template.generate.useMutation();
  const createMutation = trpc.template.create.useMutation();
  const updateMutation = trpc.template.update.useMutation();

  // tRPC queries - fetch template data with retry for optimistic creation
  const {
    data: templateData,
    isLoading: isQueryLoading,
    refetch,
    error: queryError,
  } = trpc.template.get.useQuery(
    { id: templateId! },
    {
      enabled: !!templateId,
      retry: (failureCount, error: any) => {
        // Retry up to 3 times if template not found (might be creating in background)
        if (error?.data?.code === "NOT_FOUND" && failureCount < 3) {
          return true;
        }
        return false;
      },
      retryDelay: 500, // Wait 500ms between retries
    }
  );

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
        isLoading: false,
      }));
    }
  }, [templateData]);

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
        content: state.currentTemplate.content,
      });
      console.log("Template saved");
      setState((prev) => ({ ...prev, isDirty: false }));
    } catch (error) {
      console.error("Failed to save template:", error);
    }
  }, [state.currentTemplate, updateMutation]);

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

  const updateElement = useCallback((elementPath: string, data: any) => {
    setState((prev) => {
      if (!prev.currentTemplate) return prev;

      let content: any = prev.currentTemplate.content;
      // Parse content if it's a string
      if (typeof content === "string") {
        try {
          content = JSON.parse(content);
        } catch (e) {
          console.error("Failed to parse template content for update", e);
          return prev;
        }
      }

      // Deep clone to avoid mutation
      const newContent = JSON.parse(JSON.stringify(content));

      // Helper to set value at path
      const set = (obj: any, path: string, value: any) => {
        const parts = path.split(".");
        let current = obj;
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!current[part]) current[part] = {};
          current = current[part];
        }
        const lastPart = parts[parts.length - 1];
        // Merge data instead of replacing
        current[lastPart] = { ...current[lastPart], ...value };
      };

      try {
        set(newContent, elementPath, data);
      } catch (e) {
        console.error("Failed to update element at path", elementPath, e);
        return prev;
      }

      return {
        ...prev,
        currentTemplate: {
          ...prev.currentTemplate,
          content: JSON.stringify(newContent),
        },
        isDirty: true,
      };
    });
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
    async (prompt: string) => {
      if (!state.currentTemplate) return;
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const result = await regenerateMutation.mutateAsync({
          templateId: state.currentTemplate.id,
          prompt,
        });

        console.log("Template regenerated:", result);

        // TODO: Update the canvas with the new template version
        // This should trigger a refresh of the template node

        // We might need to refetch the template to get the new version in the list
        await refetch();

        setState((prev) => ({ ...prev, isLoading: false }));
      } catch (error) {
        console.error("Failed to regenerate template:", error);
        setState((prev) => ({ ...prev, isLoading: false }));
        throw error;
      }
    },
    [state.currentTemplate, regenerateMutation]
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

  const generateTemplateStream = useCallback(
    async (prompt: string) => {
      if (!activeOrganization?.id) {
        throw new Error("No organization selected");
      }

      setState((prev) => ({
        ...prev,
        isStreaming: true,
        isLoading: true,
        streamingProgress: null,
      }));

      try {
        await generateStream(prompt);
      } catch (error) {
        console.error("Failed to generate template stream:", error);
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          isLoading: false,
        }));
        throw error;
      }
    },
    [generateStream, activeOrganization?.id]
  );

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
    setIsDirty,
    updateReactEmailCode,
  };

  return (
    <TemplateContext.Provider value={{ state, actions }}>
      {children}
    </TemplateContext.Provider>
  );
}

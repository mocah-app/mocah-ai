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
interface TemplateState {
  currentTemplate: Template | null;
  versions: TemplateVersion[];
  currentVersion: string | null;
  brandKit: BrandKit | null;
  isDirty: boolean;
  isLoading: boolean;
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
  setIsDirty: (dirty: boolean) => void;
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
  const [state, setState] = useState<TemplateState>({
    currentTemplate: null,
    versions: [],
    currentVersion: null,
    brandKit: null,
    isDirty: false,
    isLoading: false,
  });

  // tRPC mutations
  const regenerateMutation = trpc.template.regenerate.useMutation();
  const generateMutation = trpc.template.generate.useMutation();
  const updateMutation = trpc.template.update.useMutation();

  // TODO: Replace with actual tRPC queries when router is implemented
  // tRPC queries
  const {
    data: templateData,
    isLoading: isQueryLoading,
    refetch,
  } = trpc.template.get.useQuery(
    { id: templateId! },
    { enabled: !!templateId }
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
    setIsDirty,
  };

  return (
    <TemplateContext.Provider value={{ state, actions }}>
      {children}
    </TemplateContext.Provider>
  );
}

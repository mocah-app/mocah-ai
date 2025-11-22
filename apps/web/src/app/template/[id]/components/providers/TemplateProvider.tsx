"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface Template {
  id: string;
  name: string;
  description?: string;
  content: string;
  subject?: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TemplateVersion {
  id: string;
  templateId: string;
  version: number;
  name?: string;
  content: string;
  subject?: string;
  isCurrent: boolean;
  parentVersionId?: string;
  metadata?: any;
  createdAt: Date;
}

interface BrandKit {
  id: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  logoUrl?: string;
}

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

  // TODO: Replace with actual tRPC queries when router is implemented
  const loadTemplate = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      // Placeholder - will be replaced with actual tRPC call
      // const template = await api.template.get.query({ id });
      console.log("Loading template:", id);

      // Mock data for now
      setState((prev) => ({
        ...prev,
        currentTemplate: {
          id,
          name: "Template V1",
          content: "",
          organizationId: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to load template:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const saveTemplate = useCallback(async () => {
    if (!state.currentTemplate) return;

    try {
      // Placeholder - will be replaced with actual tRPC call
      // await api.template.update.mutate({ id: state.currentTemplate.id, ... });
      console.log("Saving template...");
      setState((prev) => ({ ...prev, isDirty: false }));
    } catch (error) {
      console.error("Failed to save template:", error);
    }
  }, [state.currentTemplate]);

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
    console.log("Updating element:", elementPath, data);
    setState((prev) => ({ ...prev, isDirty: true }));
  }, []);

  const regenerateElement = useCallback(
    async (elementPath: string, prompt: string) => {
      try {
        // Placeholder - will be replaced with actual tRPC call
        // await api.template.regenerateElement.mutate({ elementPath, prompt });
        console.log("Regenerating element:", elementPath, prompt);
      } catch (error) {
        console.error("Failed to regenerate element:", error);
      }
    },
    []
  );

  const regenerateTemplate = useCallback(
    async (prompt: string) => {
      if (!state.currentTemplate) return;
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        // Placeholder - will be replaced with actual tRPC call
        // await api.template.regenerate.mutate({ templateId: state.currentTemplate.id, prompt });
        console.log("Regenerating template:", prompt);

        // Mock delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setState((prev) => ({ ...prev, isLoading: false }));
      } catch (error) {
        console.error("Failed to regenerate template:", error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [state.currentTemplate]
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
    setIsDirty,
  };

  return (
    <TemplateContext.Provider value={{ state, actions }}>
      {children}
    </TemplateContext.Provider>
  );
}

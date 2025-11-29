"use client";

const STORAGE_KEY = "template-creation-prompt";

/**
 * Simple utility functions for managing template creation prompt.
 */
export const templateCreationStorage = {
  setPrompt: (prompt: string) => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(STORAGE_KEY, prompt);
  },

  getPrompt: (): string | null => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(STORAGE_KEY);
  },

  clearPrompt: () => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(STORAGE_KEY);
  },
};

export function useTemplateCreation() {
  return templateCreationStorage;
}

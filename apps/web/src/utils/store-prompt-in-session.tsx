"use client";

const STORAGE_KEY = "template-creation-prompt";
const IMAGES_KEY = "template-creation-images";

interface TemplateCreationData {
  prompt: string;
  imageUrls?: string[];
}

/**
 * Simple utility functions for managing template creation prompt and images.
 */
export const templateCreationStorage = {
  setPrompt: (prompt: string, imageUrls?: string[]) => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(STORAGE_KEY, prompt);
    if (imageUrls && imageUrls.length > 0) {
      sessionStorage.setItem(IMAGES_KEY, JSON.stringify(imageUrls));
    } else {
      sessionStorage.removeItem(IMAGES_KEY);
    }
  },

  getPrompt: (): string | null => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(STORAGE_KEY);
  },

  getImageUrls: (): string[] => {
    if (typeof window === "undefined") return [];
    const stored = sessionStorage.getItem(IMAGES_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  },

  getData: (): TemplateCreationData | null => {
    if (typeof window === "undefined") return null;
    const prompt = sessionStorage.getItem(STORAGE_KEY);
    if (!prompt) return null;
    
    const imageUrls = templateCreationStorage.getImageUrls();
    return { prompt, imageUrls };
  },

  clearPrompt: () => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(IMAGES_KEY);
  },
};

export function useTemplateCreation() {
  return templateCreationStorage;
}

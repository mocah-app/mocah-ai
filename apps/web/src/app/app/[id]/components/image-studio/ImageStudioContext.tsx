"use client";

import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type ImageSelectCallback = (url: string, width?: number, height?: number) => void;

interface ImageStudioContextValue {
  onImageSelect: ImageSelectCallback | null;
  setOnImageSelect: (callback: ImageSelectCallback | null) => void;
  initialImageUrl: string | undefined;
  setInitialImageUrl: (url: string | undefined) => void;
  initialPrompt: string | undefined;
  setInitialPrompt: (prompt: string | undefined) => void;
  initialReferenceImageUrl: string | undefined;
  setInitialReferenceImageUrl: (url: string | undefined) => void;
}

const ImageStudioContext = createContext<ImageStudioContextValue | undefined>(undefined);

export function ImageStudioProvider({ children }: { children: ReactNode }) {
  const [onImageSelect, setOnImageSelect] = useState<ImageSelectCallback | null>(null);
  const [initialImageUrl, setInitialImageUrl] = useState<string | undefined>(undefined);
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>(undefined);
  const [initialReferenceImageUrl, setInitialReferenceImageUrl] = useState<string | undefined>(undefined);

  return (
    <ImageStudioContext.Provider
      value={{
        onImageSelect,
        setOnImageSelect,
        initialImageUrl,
        setInitialImageUrl,
        initialPrompt,
        setInitialPrompt,
        initialReferenceImageUrl,
        setInitialReferenceImageUrl,
      }}
    >
      {children}
    </ImageStudioContext.Provider>
  );
}

export function useImageStudio() {
  const context = useContext(ImageStudioContext);
  if (!context) {
    throw new Error("useImageStudio must be used within ImageStudioProvider");
  }
  return context;
}

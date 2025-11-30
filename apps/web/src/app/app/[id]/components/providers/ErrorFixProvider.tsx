"use client";

import React, { createContext, useContext } from "react";

interface ErrorFixContextValue {
  onRequestErrorFix: (error: string, code: string) => void;
}

const ErrorFixContext = createContext<ErrorFixContextValue | null>(null);

interface ErrorFixProviderProps {
  children: React.ReactNode;
  onRequestErrorFix: (error: string, code: string) => void;
}

export function ErrorFixProvider({ children, onRequestErrorFix }: ErrorFixProviderProps) {
  return (
    <ErrorFixContext.Provider value={{ onRequestErrorFix }}>
      {children}
    </ErrorFixContext.Provider>
  );
}

export function useErrorFix() {
  const context = useContext(ErrorFixContext);
  if (!context) {
    throw new Error("useErrorFix must be used within ErrorFixProvider");
  }
  return context;
}


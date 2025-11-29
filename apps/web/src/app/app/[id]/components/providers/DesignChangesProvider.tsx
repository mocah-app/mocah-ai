"use client";

import React, { createContext, useContext } from "react";

interface DesignChangesContextValue {
  onSaveSmartEditorChanges: () => Promise<void>;
  onResetSmartEditorChanges: () => void;
  isSaving: boolean;
}

const DesignChangesContext = createContext<DesignChangesContextValue | undefined>(
  undefined
);

export function useDesignChanges() {
  const context = useContext(DesignChangesContext);
  if (!context) {
    throw new Error("useDesignChanges must be used within DesignChangesProvider");
  }
  return context;
}

interface DesignChangesProviderProps {
  children: React.ReactNode;
  onSaveSmartEditorChanges: () => Promise<void>;
  onResetSmartEditorChanges: () => void;
  isSaving: boolean;
}

export function DesignChangesProvider({
  children,
  onSaveSmartEditorChanges,
  onResetSmartEditorChanges,
  isSaving,
}: DesignChangesProviderProps) {
  return (
    <DesignChangesContext.Provider
      value={{
        onSaveSmartEditorChanges,
        onResetSmartEditorChanges,
        isSaving,
      }}
    >
      {children}
    </DesignChangesContext.Provider>
  );
}


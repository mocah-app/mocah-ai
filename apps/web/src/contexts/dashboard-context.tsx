"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, type ReactNode } from "react";
import { toast } from "sonner";
import { trpc } from "@/utils/trpc";

interface DashboardContextValue {
  router: ReturnType<typeof useRouter>;
  utils: ReturnType<typeof trpc.useUtils>;
  duplicateTemplate: (templateId: string, templateName: string) => void;
  deleteTemplate: (templateId: string, templateName: string) => void;
  isDuplicating: (templateId: string) => boolean;
  isDeleting: (templateId: string) => boolean;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const duplicateMutation = trpc.template.duplicate.useMutation({
    onSuccess: (data, variables) => {
      const toastId = `duplicate-${variables.id}`;
      toast.success("Template duplicated successfully", { id: toastId });
      utils.template.list.invalidate();
      router.push(`/app/${(data as { id: string }).id}`);
    },
    onError: (error, variables) => {
      const toastId = `duplicate-${variables.id}`;
      toast.error(error.message || "Failed to duplicate template", {
        id: toastId,
      });
    },
  });

  const deleteMutation = trpc.template.delete.useMutation({
    onSuccess: (_, variables) => {
      const toastId = `delete-${variables.id}`;
      toast.success("Template deleted successfully", { id: toastId });
      utils.template.list.invalidate();
    },
    onError: (error, variables) => {
      const toastId = `delete-${variables.id}`;
      toast.error(error.message || "Failed to delete template", {
        id: toastId,
      });
    },
  });

  const duplicateTemplate = (templateId: string, templateName: string) => {
    const toastId = `duplicate-${templateId}`;
    toast.loading("Duplicating template...", { id: toastId });
    duplicateMutation.mutate({ id: templateId });
  };

  const deleteTemplate = (templateId: string, templateName: string) => {
    const toastId = `delete-${templateId}`;
    toast.loading("Deleting template...", { id: toastId });
    deleteMutation.mutate({ id: templateId });
  };

  const isDuplicating = (templateId: string) => {
    return (
      duplicateMutation.isPending &&
      duplicateMutation.variables?.id === templateId
    );
  };

  const isDeleting = (templateId: string) => {
    return (
      deleteMutation.isPending && deleteMutation.variables?.id === templateId
    );
  };

  return (
    <DashboardContext.Provider
      value={{
        router,
        utils,
        duplicateTemplate,
        deleteTemplate,
        isDuplicating,
        isDeleting,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return context;
}

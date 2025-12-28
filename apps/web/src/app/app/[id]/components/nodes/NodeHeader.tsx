"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/utils/trpc";
import { AlertTriangle, Code, Copy, Eye, Mail, MoreVertical, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useCanvas } from "../providers/CanvasProvider";
import { useEditorMode } from "../providers/EditorModeProvider";

interface NodeHeaderProps {
  version: number;
  name: string;
  isCurrent: boolean;
  nodeId: string;
  currentMode: "view" | "code";
  templateId?: string;
  templateName?: string;
  onTestEmail?: () => void;
  onCheckCompatibility?: () => void;
}

export function NodeHeader({
  version,
  name,
  isCurrent,
  nodeId,
  currentMode,
  templateId,
  templateName,
  onTestEmail,
  onCheckCompatibility,
}: NodeHeaderProps) {
  const { actions: editorActions } = useEditorMode();
  const { actions: canvasActions } = useCanvas();
  const router = useRouter();
  const utils = trpc.useUtils();

  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const duplicateMutation = trpc.template.core.duplicate.useMutation({
    onSuccess: (data: any, variables: any) => {
      const toastId = `duplicate-${variables.id}`;
      toast.success("Template duplicated successfully", { id: toastId });
      utils.template.core.list.invalidate();
      router.push(`/app/${data.id}`);
    },
    onError: (error: any, variables: any) => {
      const toastId = `duplicate-${variables.id}`;
      toast.error(error.message || "Failed to duplicate template", { id: toastId });
    },
  });

  const deleteMutation = trpc.template.core.delete.useMutation({
    onSuccess: (_: any, variables: any) => {
      const toastId = `delete-${variables.id}`;
      toast.success("Template deleted successfully", { id: toastId });
      utils.template.core.list.invalidate();
      router.push("/app");
    },
    onError: (error: any, variables: any) => {
      const toastId = `delete-${variables.id}`;
      toast.error(error.message || "Failed to delete template", { id: toastId });
    },
  });

  const handleToggleMode = () => {
    const newMode = currentMode === "view" ? "code" : "view";
    editorActions.setNodeMode(nodeId, newMode);
  };

  const handleDuplicateClick = () => {
    setShowDuplicateDialog(true);
  };

  const handleDuplicateConfirm = () => {
    if (!templateId) {
      toast.error("Template ID not found");
      return;
    }
    const toastId = `duplicate-${templateId}`;
    toast.loading("Duplicating template...", { id: toastId });
    duplicateMutation.mutate({ id: templateId });
    setShowDuplicateDialog(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (!templateId) {
      toast.error("Template ID not found");
      return;
    }
    const toastId = `delete-${templateId}`;
    toast.loading("Deleting template...", { id: toastId });
    deleteMutation.mutate({ id: templateId });
    setShowDeleteDialog(false);
  };

  return (
    <div className="px-4 py-1 bg-muted border-b border-border rounded-t-lg flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Version Badge */}

        {/* Node Title */}
        <h3 className="sr-only">{name}</h3>

        {/* Indicator */}
       {isCurrent ? (
        <Badge variant="success" className="text-xs px-1">
            V {version} - current
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs px-1">
            V {version}
          </Badge>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* View/Code Toggle */}

        <div className="flex items-center gap-2 bg-card rounded-md">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleMode}
            className={currentMode === "view" ? "bg-accent" : ""}
          >
            <Eye className="size-4 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleMode}
            className={currentMode === "code" ? "bg-accent" : ""}
          >
            <Code className="size-4 text-muted-foreground" />
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title="More Actions">
              <MoreVertical className="size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {onTestEmail && (
              <DropdownMenuItem asChild>
                <Button
                  variant="ghost"
                  onClick={onTestEmail}
                  title="Test Email"
                  className="w-full justify-start"
                >
                  <Mail className="size-4 text-muted-foreground" />
                  Test Email
                </Button>
              </DropdownMenuItem>
            )}
            {onCheckCompatibility && (
              <DropdownMenuItem asChild>
                <Button
                  variant="ghost"
                  onClick={onCheckCompatibility}
                  title="Check Compatibility"
                  className="w-full justify-start"
                >
                  <AlertTriangle className="size-4 text-muted-foreground" />
                  Check Compatibility
                </Button>
              </DropdownMenuItem>
            )}
            {templateId && (
              <DropdownMenuItem asChild>
                <Button
                  variant="ghost"
                  onClick={handleDuplicateClick}
                  title="Duplicate"
                  className="w-full justify-start"
                  disabled={duplicateMutation.isPending}
                >
                  <Copy className="size-4 text-muted-foreground" />
                  Duplicate
                </Button>
              </DropdownMenuItem>
            )}
            {templateId && (
              <DropdownMenuItem asChild>
                <Button
                  variant="ghost"
                  onClick={handleDeleteClick}
                  className="text-destructive w-full justify-start hover:text-destructive"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="size-4 text-destructive" />
                  Delete
                </Button>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Duplicate Confirmation Dialog */}
      <AlertDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to duplicate{" "}
              <span className="font-bold text-foreground">{templateName || "this template"}</span>
              ? A copy will be created in your workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={duplicateMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDuplicateConfirm}
              disabled={duplicateMutation.isPending}
            >
              {duplicateMutation.isPending ? "Duplicating..." : "Duplicate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-bold text-destructive">{templateName || "this template"}</span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

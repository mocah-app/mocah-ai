"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useDashboard } from "@/contexts/dashboard-context";
import { ChevronsUp, CopyPlus, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";

interface TemplateCardMenuProps {
  templateId: string;
  templateName: string;
}

export function TemplateCardMenu({
  templateId,
  templateName,
}: TemplateCardMenuProps) {
  const { duplicateTemplate, deleteTemplate, isDuplicating, isDeleting } =
    useDashboard();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleRemix = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateTemplate(templateId, templateName);
  };

  const handleDelete = () => {
    deleteTemplate(templateId, templateName);
    setShowDeleteDialog(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={handleRemix}
            disabled={isDuplicating(templateId)}
          >
            <CopyPlus className="h-4 w-4" />
            Remix
          </DropdownMenuItem>
          <DropdownMenuItem>
            <ChevronsUp className="h-4 w-4" />
            Export
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={handleDeleteClick}>
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-bold text-destructive">
                {templateName}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting(templateId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting(templateId) ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

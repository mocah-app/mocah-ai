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
import { Loader2, Users, AlertTriangle, Archive } from "lucide-react";

interface UnpublishConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName: string;
  remixCount: number;
  onConfirm: () => Promise<void>;
  isPermanent?: boolean;
  isLoading?: boolean;
}

export function UnpublishConfirmDialog({
  open,
  onOpenChange,
  templateName,
  remixCount,
  onConfirm,
  isPermanent = false,
  isLoading = false,
}: UnpublishConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isPermanent ? (
              <>
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Delete from Library?
              </>
            ) : (
              <>
                <Archive className="h-5 w-5 text-muted-foreground" />
                Unpublish Template?
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {/* Template name highlight */}
              <div className="p-3 bg-muted border border-border rounded-md">
                <p className="font-semibold text-foreground text-center">
                  {templateName}
                </p>
              </div>

              {/* Main message */}
              <p className="text-sm">
                {isPermanent
                  ? "This will permanently delete the template from the library. This action cannot be undone."
                  : "This will remove the template from the public library. You can republish it anytime from your workspace."}
              </p>

              {/* Remix count warning */}
              {remixCount > 0 && (
                <div className="flex items-start gap-3 p-3 bg-accent border border-border rounded-md">
                  <Users className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-accent-foreground">
                      {remixCount} {remixCount === 1 ? "remix" : "remixes"}{" "}
                      exist
                    </p>
                    <p className="text-muted-foreground mt-0.5">
                      User copies will remain unaffected
                    </p>
                  </div>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={
              isPermanent
                ? "bg-destructive hover:bg-destructive/90 focus:ring-destructive text-destructive-foreground"
                : "bg-primary hover:bg-primary/90 focus:ring-primary text-primary-foreground"
            }
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPermanent ? "Delete Permanently" : "Unpublish"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

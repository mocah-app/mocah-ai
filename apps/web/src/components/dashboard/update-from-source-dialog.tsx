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
import { RefreshCw, Loader2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Loader from "../loader";

interface UpdateFromSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  libraryEntry: {
    name: string;
    updatedAt: Date | string;
    sourceTemplate: {
      name: string;
      updatedAt: Date | string;
    } | null;
  } | null;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export function UpdateFromSourceDialog({
  open,
  onOpenChange,
  libraryEntry,
  onConfirm,
  isLoading = false,
}: UpdateFromSourceDialogProps) {
  if (!libraryEntry || !libraryEntry.sourceTemplate) return null;

  const handleConfirm = async () => {
    try {
      await onConfirm();
      // Only close dialog on successful update
      onOpenChange(false);
    } catch (error) {
      // Error is handled by React Query, dialog stays open
      // so user can retry or cancel
    }
  };

  const libraryUpdatedAt = new Date(libraryEntry.updatedAt);
  const sourceUpdatedAt = new Date(libraryEntry.sourceTemplate.updatedAt);
  const timeSinceSourceUpdate = formatDistanceToNow(sourceUpdatedAt, {
    addSuffix: true,
  });
  const timeSinceEntryUpdate = formatDistanceToNow(libraryUpdatedAt, {
    addSuffix: true,
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-ring" />
            Update from Source
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-sm">
                Sync your library entry with the latest changes from the source
                template.
              </p>

              {/* Visual Timeline */}
              <div className="relative py-4">
                <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-border" />

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-accent shrink-0">
                      <Clock className="h-5 w-5 text-ring" />
                    </div>
                    <div className="pt-2">
                      <p className="font-semibold text-foreground">
                        Source Template
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Updated {timeSinceSourceUpdate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-muted shrink-0">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="pt-2">
                      <p className="font-semibold text-foreground">
                        Your Library Entry
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Updated {timeSinceEntryUpdate}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact info note */}
              <div className="px-3 py-2 bg-muted border border-border rounded-md">
                <p className="text-xs text-foreground">
                  <strong>Updates:</strong> Code, HTML, styles, preview text &
                  thumbnail
                  <hr className="my-2" />
                  <strong>Preserved:</strong> Name, description, category, tags
                  & premium status
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isLoading}>
            {isLoading && <Loader size="sm" />}
            Update Entry
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

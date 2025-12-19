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
import {
  BookOpenText,
  ChevronsUp,
  CopyPlus,
  MoreHorizontal,
  Trash2,
  Loader2,
  Check,
  Image as ImageIcon,
  Globe,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";

interface TemplateCardMenuProps {
  templateId: string;
  templateName: string;
  libraryEntry?: {
    id: string;
    _count: {
      customizations: number;
    };
  } | null;
}

type PublishStage =
  | "confirm"
  | "generating"
  | "uploading"
  | "success"
  | "error";

export function TemplateCardMenu({
  templateId,
  templateName,
  libraryEntry,
}: TemplateCardMenuProps) {
  const {
    duplicateTemplate,
    deleteTemplate,
    isDuplicating,
    isDeleting,
    utils,
  } = useDashboard();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showUnpublishDialog, setShowUnpublishDialog] = useState(false);
  const [publishStage, setPublishStage] = useState<PublishStage>("confirm");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if user can publish to library
  const { data: canPublish, isLoading: isCheckingPermission } =
    trpc.template.canPublishToLibrary.useQuery();

  const isPublished = !!libraryEntry;

  // Publish mutation
  // Note: Using `any` for callback parameters to prevent "Type instantiation is excessively deep" error
  const publishMutation = trpc.template.publishToLibrary.useMutation({
    onSuccess: () => {
      setPublishStage("success");
      utils.template.list.invalidate();
      utils.template.getLibraryEntryForTemplate.invalidate({ templateId });
      // Auto-close after 2 seconds on success
      setTimeout(() => {
        setShowPublishDialog(false);
        toast.success("Template published to library");
      }, 2000);
    },
    onError: (error: any) => {
      setPublishStage("error");
      setErrorMessage(error.message || "Failed to publish template");
    },
  });

  // Unpublish mutation
  const unpublishMutation = trpc.template.unpublishTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template unpublished from library");
      utils.template.list.invalidate();
      utils.template.getLibraryEntryForTemplate.invalidate({ templateId });
      setShowUnpublishDialog(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to unpublish template");
    },
  });

  // Simulate progress stages (since we can't track internal mutation stages directly)
  useEffect(() => {
    if (publishMutation.isPending && publishStage === "confirm") {
      // Start with generating stage
      setPublishStage("generating");

      // After 2 seconds, move to uploading stage
      const timer = setTimeout(() => {
        if (publishMutation.isPending) {
          setPublishStage("uploading");
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [publishMutation.isPending, publishStage]);

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

  const handleLibraryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPublishStage("confirm");
    setErrorMessage(null);
    setShowPublishDialog(true);
  };

  const handlePublishConfirm = () => {
    setPublishStage("generating");
    publishMutation.mutate({ id: templateId });
  };

  const handlePublishCancel = () => {
    if (!publishMutation.isPending) {
      setShowPublishDialog(false);
      setPublishStage("confirm");
      setErrorMessage(null);
    }
  };

  const handleViewInLibrary = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (libraryEntry) {
      window.open(`/library?template=${libraryEntry.id}`, "_blank");
    }
  };

  const handleUnpublishClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowUnpublishDialog(true);
  };

  const handleUnpublishConfirm = () => {
    if (libraryEntry) {
      unpublishMutation.mutate({ libraryId: libraryEntry.id });
    }
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
          {canPublish && !isPublished && (
            <DropdownMenuItem
              onClick={handleLibraryClick}
              disabled={publishMutation.isPending || isCheckingPermission}
            >
              <BookOpenText className="h-4 w-4" />
              Publish to Library
            </DropdownMenuItem>
          )}
          {canPublish && isPublished && (
            <>
              <DropdownMenuItem onClick={handleViewInLibrary}>
                <ExternalLink className="h-4 w-4" />
                View in Library
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleUnpublishClick}>
                <Globe className="h-4 w-4" />
                Unpublish
              </DropdownMenuItem>
            </>
          )}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-bold text-destructive">{templateName}</span>
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

      {/* Publish Progress Dialog */}
      <AlertDialog open={showPublishDialog} onOpenChange={handlePublishCancel}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-2xl font-semibold">
              {publishStage === "confirm" && "Publish to Library"}
              {publishStage === "generating" && "Publishing"}
              {publishStage === "uploading" && "Publishing"}
              {publishStage === "success" && "Published"}
              {publishStage === "error" && "Publishing Failed"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-6">
                {publishStage === "confirm" && (
                  <div className="space-y-4">
                    <p className="text-base leading-relaxed">
                      Publish{" "}
                      <span className="font-medium text-foreground">
                        {templateName}
                      </span>{" "}
                      to the template library?
                    </p>
                    <p className="text-sm text-muted-foreground">
                      This will make it available to all users in the community.
                    </p>
                  </div>
                )}

                {(publishStage === "generating" ||
                  publishStage === "uploading" ||
                  publishStage === "success") && (
                  <div className="space-y-4 py-2">
                    {/* Stage 1: Generating Thumbnail */}
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5">
                        {publishStage === "generating" ? (
                          <Loader2 className="size-5 animate-spin text-foreground" />
                        ) : (
                          <div className="size-5 rounded-full bg-foreground flex items-center justify-center">
                            <Check className="size-3 text-background" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-base font-medium text-foreground">
                          Generating thumbnail
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Creating a preview image for the library
                        </p>
                      </div>
                    </div>

                    {/* Stage 2: Publishing to Library */}
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5">
                        {publishStage === "uploading" ? (
                          <Loader2 className="size-5 animate-spin text-foreground" />
                        ) : publishStage === "success" ? (
                          <div className="size-5 rounded-full bg-foreground flex items-center justify-center">
                            <Check className="size-3 text-background" />
                          </div>
                        ) : (
                          <div className="size-5 rounded-full border-2 border-border" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-base font-medium text-foreground">
                          Publishing to library
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Making your template available to everyone
                        </p>
                      </div>
                    </div>

                    {/* Success State */}
                    {publishStage === "success" && (
                      <div className="mt-6 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          Your template is now live in the community library
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {publishStage === "error" && (
                  <div className="space-y-3">
                    <p className="text-base text-foreground">{errorMessage}</p>
                    <p className="text-sm text-muted-foreground">
                      Please try again or contact support if the problem
                      persists.
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-6">
            {publishStage === "confirm" && (
              <>
                <AlertDialogCancel onClick={handlePublishCancel}>
                  Cancel
                </AlertDialogCancel>
                <Button
                  onClick={handlePublishConfirm}
                  size="default"
                  className="px-8"
                >
                  Publish
                </Button>
              </>
            )}

            {(publishStage === "generating" ||
              publishStage === "uploading") && (
              <Button disabled className="w-full" size="default">
                <Loader2 className="size-4 mr-2 animate-spin" />
                Publishing...
              </Button>
            )}

            {publishStage === "error" && (
              <>
                <AlertDialogCancel onClick={handlePublishCancel}>
                  Close
                </AlertDialogCancel>
                <Button
                  onClick={handlePublishConfirm}
                  size="default"
                  className="px-8"
                >
                  Try Again
                </Button>
              </>
            )}

            {publishStage === "success" && (
              <Button
                onClick={handlePublishCancel}
                className="w-full"
                size="default"
              >
                Done
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unpublish Confirmation Dialog */}
      <AlertDialog open={showUnpublishDialog} onOpenChange={setShowUnpublishDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Unpublish Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unpublish{" "}
              <span className="font-semibold">{templateName}</span>? It will be
              removed from the public library but can be republished later.
              {libraryEntry && libraryEntry._count.customizations > 0 && (
                <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-yellow-800 dark:text-yellow-200 text-sm">
                  {libraryEntry._count.customizations} users have remixed this
                  template. Unpublishing will not affect their copies.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unpublishMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnpublishConfirm}
              disabled={unpublishMutation.isPending}
              className="bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-600"
            >
              {unpublishMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Unpublish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/utils/trpc";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

const createCategorySchema = z.object({
  categories: z
    .string()
    .min(1, "At least one category name is required")
    .refine(
      (val) => {
        const parsed = parseCategoryNames(val);
        return parsed.length > 0 && parsed.every((name) => name.length <= 100);
      },
      {
        message: "Category names must be 100 characters or less",
      }
    ),
});

const editCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().optional(),
});

type CreateCategoryForm = z.infer<typeof createCategorySchema>;
type EditCategoryForm = z.infer<typeof editCategorySchema>;

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

interface CreateCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  mode?: "create" | "edit";
  category?: Category;
}

/**
 * Parse category names from textarea input.
 * Supports both newline-separated and comma-separated formats.
 */
function parseCategoryNames(input: string): string[] {
  if (!input.trim()) return [];

  // Split by newlines first, then by commas
  const lines = input.split(/\n/);
  const categories: string[] = [];

  for (const line of lines) {
    // Split by comma and trim each part
    const parts = line.split(",").map((part) => part.trim()).filter(Boolean);
    categories.push(...parts);
  }

  // Remove duplicates and empty strings
  return Array.from(new Set(categories.filter(Boolean)));
}

export function CreateCategoryModal({
  open,
  onOpenChange,
  onSuccess,
  mode = "create",
  category,
}: CreateCategoryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const utils = trpc.useUtils();

  const isEditMode = mode === "edit" && category;

  const createForm = useForm<CreateCategoryForm>({
    resolver: zodResolver(createCategorySchema),
  });

  const editForm = useForm<EditCategoryForm>({
    resolver: zodResolver(editCategorySchema),
    defaultValues: {
      name: category?.name || "",
      description: category?.description || "",
    },
  });

  // Update form when category changes
  useEffect(() => {
    if (isEditMode && category) {
      editForm.reset({
        name: category.name,
        description: category.description || "",
      });
    }
  }, [category, isEditMode, editForm]);

  const createCategory = trpc.template.library.createCategory.useMutation();
  const updateCategory = trpc.template.library.updateCategory.useMutation();
  const deleteCategory = trpc.template.library.deleteCategory.useMutation();

  const onSubmitCreate = async (data: CreateCategoryForm) => {
    setIsSubmitting(true);
    const categoryNames = parseCategoryNames(data.categories);
    const total = categoryNames.length;
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Create categories sequentially to avoid race conditions
    for (const name of categoryNames) {
      try {
        await createCategory.mutateAsync({
          name: name.trim(),
        });
        successCount++;
      } catch (error: any) {
        errorCount++;
        errors.push(`${name}: ${error.message || "Failed to create"}`);
      }
    }

    // Show appropriate feedback
    if (successCount === total) {
      toast.success(`Successfully created ${total} categor${total === 1 ? "y" : "ies"}`);
    } else if (successCount > 0) {
      toast.warning(
        `Created ${successCount} of ${total} categor${total === 1 ? "y" : "ies"}. ${errorCount} failed.`
      );
      // Show detailed errors
      errors.forEach((error) => {
        toast.error(error, { duration: 5000 });
      });
    } else {
      toast.error(`Failed to create ${total === 1 ? "category" : "categories"}`);
      errors.forEach((error) => {
        toast.error(error, { duration: 5000 });
      });
    }

    // Invalidate categories query to refresh the list
    utils.template.library.getCategories.invalidate();
    createForm.reset();
    onOpenChange(false);
    setIsSubmitting(false);
    onSuccess?.();
  };

  const onSubmitEdit = async (data: EditCategoryForm) => {
    if (!isEditMode || !category) return;

    setIsSubmitting(true);
    try {
      await updateCategory.mutateAsync({
        id: category.id,
        name: data.name,
        description: data.description || undefined,
      });
      toast.success("Category updated successfully");
      utils.template.library.getCategories.invalidate();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to update category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode || !category) return;

    setIsSubmitting(true);
    try {
      await deleteCategory.mutateAsync({ id: category.id });
      toast.success("Category deleted successfully");
      utils.template.library.getCategories.invalidate();
      setShowDeleteDialog(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      if (isEditMode) {
        editForm.reset();
      } else {
        createForm.reset();
      }
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Category" : "Create Categories"}</DialogTitle>
            <DialogDescription className="sr-only">
              {isEditMode
                ? "Edit template category details"
                : "Create one or more template categories. Enter category names separated by commas or on separate lines."}
            </DialogDescription>
          </DialogHeader>

          {isEditMode ? (
            <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...editForm.register("name")}
                  placeholder="e.g., Welcome Series"
                  disabled={isSubmitting}
                  className={editForm.formState.errors.name ? "border-destructive" : ""}
                />
                {editForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {editForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  {...editForm.register("description")}
                  placeholder="A brief description of this category"
                  disabled={isSubmitting}
                  rows={3}
                />
              </div>

              <div className="flex justify-between items-center pt-4">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isSubmitting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={createForm.handleSubmit(onSubmitCreate)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="categories">
                  Category Names <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="categories"
                  {...createForm.register("categories")}
                  placeholder={`Welcome Series, E-commerce, Newsletter
or one per line:
Promotional
Transactional`}
                  disabled={isSubmitting}
                  rows={6}
                  className={
                    createForm.formState.errors.categories ? "border-destructive" : ""
                  }
                />
                {createForm.formState.errors.categories && (
                  <p className="text-sm text-destructive">
                    {createForm.formState.errors.categories.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-8">
                  Enter category names separated by commas or on separate lines. Each name must be
                  100 characters or less.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Categories
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{category?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


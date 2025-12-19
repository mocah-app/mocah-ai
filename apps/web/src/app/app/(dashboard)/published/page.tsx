"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/utils/trpc";
import { PublishedTemplateCard } from "@/components/dashboard/published-template-card";
import { PublishedTemplateGridSkeleton } from "@/components/dashboard/published-template-grid-skeleton";
import { EditLibraryEntryDialog } from "@/components/dashboard/edit-library-entry-dialog";
import { UnpublishConfirmDialog } from "@/components/dashboard/unpublish-confirm-dialog";
import { UpdateFromSourceDialog } from "@/components/dashboard/update-from-source-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, BookOpen } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import MocahLoadingIcon from "@/components/mocah-brand/MocahLoadingIcon";

type SortOption = "newest" | "oldest" | "name_asc" | "name_desc";

type PublishedTemplateEntry = {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  category: string | null;
  thumbnail: string | null;
  isPremium: boolean;
  tags: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
  sourceTemplate: {
    id: string;
    name: string;
    updatedAt: Date | string;
  } | null;
  _count: {
    customizations: number;
  };
};

export default function PublishedTemplatesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("_all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [unpublishDialogOpen, setUnpublishDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedLibraryEntry, setSelectedLibraryEntry] =
    useState<PublishedTemplateEntry | null>(null);

  // Check publish permission
  const { data: canPublish, isLoading: isCheckingPermission } =
    trpc.template.canPublishToLibrary.useQuery();

  // Redirect if user doesn't have publish rights
  useEffect(() => {
    if (!isCheckingPermission && canPublish === false) {
      router.replace("/app");
    }
  }, [canPublish, isCheckingPermission, router]);

  // Queries
  const { data: publishedTemplatesData, isLoading: isLoadingTemplates } =
    trpc.template.getPublishedTemplates.useQuery(
      {
        search: searchQuery || undefined,
        category: categoryFilter === "_all" ? undefined : categoryFilter,
        sortBy,
      },
      {
        enabled: canPublish === true, // Only fetch if user has permission
      }
    );

  // Cast to explicit type to avoid deep instantiation
  const publishedTemplates = publishedTemplatesData as
    | PublishedTemplateEntry[]
    | undefined;

  const { data: categories } = trpc.template.getLibraryCategories.useQuery();

  // Mutations
  const utils = trpc.useUtils();

  const updateLibraryMutation = trpc.template.updateLibraryEntry.useMutation({
    onSuccess: () => {
      toast.success("Library entry updated", {
        description: "Your changes are now live in the public library",
      });
      utils.template.getPublishedTemplates.invalidate();
    },
    onError: (error: any) => {
      toast.error("Failed to update", {
        description: error.message,
      });
    },
  });

  const updateFromSourceMutation =
    trpc.template.updateLibraryFromSource.useMutation({
      onSuccess: () => {
        toast.success("Library entry synced", {
          description: "The published version now matches your source template",
        });
        utils.template.getPublishedTemplates.invalidate();
      },
      onError: (error: any) => {
        toast.error("Failed to sync", {
          description: error.message,
        });
      },
    });

  const unpublishMutation = trpc.template.unpublishTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template unpublished", {
        description: "The template has been removed from the public library",
      });
      utils.template.getPublishedTemplates.invalidate();
    },
    onError: (error: any) => {
      toast.error("Failed to unpublish", {
        description: error.message,
      });
    },
  });

  const deleteMutation = trpc.template.deleteLibraryEntry.useMutation({
    onSuccess: () => {
      toast.success("Template deleted", {
        description:
          "The template has been permanently removed from the library",
      });
      utils.template.getPublishedTemplates.invalidate();
    },
    onError: (error: any) => {
      toast.error("Failed to delete", {
        description: error.message,
      });
    },
  });

  // Handlers
  const handleEdit = (libraryId: string) => {
    const entry: PublishedTemplateEntry | undefined = publishedTemplates?.find(
      (t) => t.id === libraryId
    );
    if (entry) {
      setSelectedLibraryEntry(entry);
      setEditDialogOpen(true);
    }
  };

  const handleUpdateFromSource = (libraryId: string) => {
    const entry: PublishedTemplateEntry | undefined = publishedTemplates?.find(
      (t) => t.id === libraryId
    );
    if (entry && entry.sourceTemplate) {
      setSelectedLibraryEntry(entry);
      setUpdateDialogOpen(true);
    }
  };

  const handleUnpublish = (libraryId: string) => {
    const entry: PublishedTemplateEntry | undefined = publishedTemplates?.find(
      (t) => t.id === libraryId
    );
    if (entry) {
      setSelectedLibraryEntry(entry);
      setUnpublishDialogOpen(true);
    }
  };

  const handleDelete = (libraryId: string) => {
    const entry: PublishedTemplateEntry | undefined = publishedTemplates?.find(
      (t) => t.id === libraryId
    );
    if (entry) {
      setSelectedLibraryEntry(entry);
      setDeleteDialogOpen(true);
    }
  };

  const handleSaveEdit = async (data: any) => {
    await updateLibraryMutation.mutateAsync(data);
  };

  const handleConfirmUpdate = async () => {
    if (selectedLibraryEntry) {
      await updateFromSourceMutation.mutateAsync({
        libraryId: selectedLibraryEntry.id,
      });
    }
  };

  const handleConfirmUnpublish = async () => {
    if (selectedLibraryEntry) {
      await unpublishMutation.mutateAsync({
        libraryId: selectedLibraryEntry.id,
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedLibraryEntry) {
      await deleteMutation.mutateAsync({
        libraryId: selectedLibraryEntry.id,
      });
    }
  };

  const templateCount = publishedTemplates?.length ?? 0;

  // Show loading while checking permission
  if (isCheckingPermission || canPublish === false) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-full h-full">
        <MocahLoadingIcon isLoading={true} size="sm" />
      </div>
    );
  }

  return (
    <div className="p-1 w-full">
    <div className="space-y-2 relative py-4 border border-border">
      {/* Header */}
      <Card className="relative z-10 pt-0 pb-4 px-6 border-0 border-b border-border rounded-none">
        <CardHeader className="flex flex-row items-center justify-between p-0">
          <CardTitle>
            <h1 className="text-lg font-bold">Published Templates</h1>
          </CardTitle>
          <div className="flex items-center gap-4">
            {isLoadingTemplates ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <span className="text-base font-bold text-muted-foreground">
                {templateCount}
              </span>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card className="relative z-10 pt-4 pb-4 px-6 border-0 border-b border-border rounded-none">
        <CardContent className="p-0">
          <div className="flex sm:flex-row gap-4">
            {/* Search */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search published templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>

            <div className="flex w-full justify-end gap-2">
            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as SortOption)}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                <SelectItem value="name_desc">Name (Z-A)</SelectItem>
              </SelectContent>
            </Select>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-4 px-2">
        {/* Loading State */}
        {isLoadingTemplates && (
          <Card className="relative z-10 border-border rounded-none">
            <CardContent className="px-4">
              <PublishedTemplateGridSkeleton />
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoadingTemplates && publishedTemplates?.length === 0 && (
          <Card className="relative z-10 border-border rounded-none">
            <CardContent className="py-10 text-center space-y-4">
              <BookOpen className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <div className="text-muted-foreground">
                <p className="text-lg font-semibold mb-2">
                  No published templates
                </p>
                <p className="max-w-md mx-auto">
                  {searchQuery || (categoryFilter && categoryFilter !== "_all")
                    ? "No templates match your search criteria. Try adjusting your filters."
                    : "You haven't published any templates to the library yet. Publish a template from your workspace to get started."}
                </p>
              </div>
              {!searchQuery && categoryFilter === "_all" && (
                <Button asChild>
                  <Link href="/app">Browse Your Templates</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Grid */}
        {!isLoadingTemplates &&
          publishedTemplates &&
          publishedTemplates.length > 0 && (
            <Card className="relative z-10 border-border rounded-none">
              <CardContent className="px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {publishedTemplates.map((entry) => (
                    <PublishedTemplateCard
                      key={entry.id}
                      libraryEntry={entry}
                      onEdit={handleEdit}
                      onUpdateFromSource={handleUpdateFromSource}
                      onUnpublish={handleUnpublish}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
      </div>

      {/* Dialogs */}
      <EditLibraryEntryDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        libraryEntry={selectedLibraryEntry}
        categories={categories || []}
        onSave={handleSaveEdit}
        isSaving={updateLibraryMutation.isPending}
      />

      <UpdateFromSourceDialog
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
        libraryEntry={selectedLibraryEntry}
        onConfirm={handleConfirmUpdate}
        isLoading={updateFromSourceMutation.isPending}
      />

      <UnpublishConfirmDialog
        open={unpublishDialogOpen}
        onOpenChange={setUnpublishDialogOpen}
        templateName={selectedLibraryEntry?.name || ""}
        remixCount={selectedLibraryEntry?._count?.customizations || 0}
        onConfirm={handleConfirmUnpublish}
        isLoading={unpublishMutation.isPending}
      />

      <UnpublishConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        templateName={selectedLibraryEntry?.name || ""}
        remixCount={selectedLibraryEntry?._count?.customizations || 0}
        onConfirm={handleConfirmDelete}
        isPermanent
        isLoading={deleteMutation.isPending}
      />
    </div>
    </div>
  );
}

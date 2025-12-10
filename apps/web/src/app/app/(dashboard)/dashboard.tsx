"use client";
import BrandKitSetupBanner from "@/components/brand-kit/BrandKitSetupBanner";
import Loader from "@/components/loader";
import { TemplatePreview } from "@/components/template/TemplatePreview";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganization } from "@/contexts/organization-context";
import { trpc } from "@/utils/trpc";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronsUp,
  CopyPlus,
  FileText,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface TemplateCardProps {
  template: {
    id: string;
    name: string;
    updatedAt: string | Date;
    isFavorite: boolean | null;
    htmlCode: string | null;
    _count: {
      versions: number;
    };
  };
}

const TemplateCardMenu = ({
  template,
}: {
  template: TemplateCardProps["template"];
}) => {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const duplicateMutation = trpc.template.duplicate.useMutation({
    onSuccess: (data) => {
      toast.success("Template duplicated successfully");
      utils.template.list.invalidate();
      router.push(`/app/${(data as { id: string }).id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to duplicate template");
    },
  });

  const deleteMutation = trpc.template.delete.useMutation({
    onSuccess: () => {
      utils.template.list.invalidate();
      setShowDeleteDialog(false);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to delete template", {
        id: `delete-${template.id}`,
      });
    },
  });

  const handleRemix = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.loading("Duplicating template...", {
      id: `duplicate-${template.id}`,
    });
    duplicateMutation.mutate(
      { id: template.id },
      {
        onSuccess: () => {
          toast.success("Template duplicated successfully", {
            id: `duplicate-${template.id}`,
          });
        },
        onError: (error) => {
          toast.error(error.message || "Failed to duplicate template", {
            id: `duplicate-${template.id}`,
          });
        },
      }
    );
  };

  const handleDelete = () => {
    const toastId = `delete-${template.id}`;
    toast.loading("Deleting template...", { id: toastId });
    deleteMutation.mutate(
      { id: template.id },
      {
        onSuccess: () => {
          toast.success("Template deleted successfully", { id: toastId });
        },
      }
    );
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={handleRemix}
            disabled={duplicateMutation.isPending}
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
                {template.name}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const TemplateCard = ({ template }: TemplateCardProps) => {
  return (
    <Card className="gap-0 hover:shadow-md transition-all duration-300 p-0 h-full overflow-hidden">
      <Link href={`/app/${template.id}`}>
        <CardHeader className="p-0 group">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="relative  group-hover:scale-105 group-focus:scale-105 transition-all duration-300">
                <TemplatePreview htmlCode={template.htmlCode} />
              </div>
              <CardTitle className="group-hover:text-primary truncate  w-[95%] transition-colors duration-300 p-4 text-lg">
                {template.name}
              </CardTitle>
            </div>
            {template.isFavorite && (
              <span className="text-yellow-500 text-sm">★</span>
            )}
          </div>
        </CardHeader>
      </Link>
      <CardFooter className="p-0 w-full border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 p-4 w-full">
          <div className="flex items-center gap-2">
            <FileText className="h-3 w-3" />
            <span className="truncate w-[95%]">
              {template._count.versions} versions
            </span>
          </div>
          <span className="truncate w-[95%]">
            {formatDistanceToNow(new Date(template.updatedAt), {
              addSuffix: true,
            })}
          </span>
          <div className="flex items-center justify-end">
            <TemplateCardMenu template={template} />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

const TemplateListSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {[1, 2, 3].map((i) => (
      <Card key={i}>
        <CardHeader>
          <Skeleton className="h-28 w-full mb-2" />
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2 mt-2" />
        </CardHeader>
      </Card>
    ))}
  </div>
);

const TEMPLATES_PER_PAGE = 6;

export default function Dashboard() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const {
    activeOrganization,
    organizations,
    isLoading: orgLoading,
  } = useOrganization();

  // Show first organization if we have orgs but no active one set yet
  const displayOrg =
    activeOrganization || (organizations.length > 0 ? organizations[0] : null);

  // Infinite query for templates with cursor-based pagination
  const {
    data: templatesData,
    isLoading: templatesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.template.list.useInfiniteQuery(
    { limit: TEMPLATES_PER_PAGE },
    {
      enabled: !!activeOrganization?.id,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  // Invalidate templates only when org actually changes (not on mount)
  const prevOrgIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (
      activeOrganization?.id &&
      prevOrgIdRef.current &&
      prevOrgIdRef.current !== activeOrganization.id
    ) {
      utils.template.list.invalidate();
    }
    prevOrgIdRef.current = activeOrganization?.id;
  }, [activeOrganization?.id, utils]);

  // Flatten all pages into a single array
  const templates =
    templatesData?.pages.flatMap((page) => page.templates) ?? [];
  const templateCount = templatesData?.pages[0]?.totalCount ?? 0;

  // Intersection observer for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "100px",
      threshold: 0,
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  const handleCreateTemplate = () => {
    if (!activeOrganization) {
      toast.error("Please select a workspace first");
      return;
    }

    // Navigate to new template page with AI streaming
    router.push("/app/new");
  };

  // Combined loading state - also loading if activeOrganization isn't set yet but we have orgs
  const isQueryPending = !activeOrganization?.id && organizations.length > 0;
  const isDataLoading = orgLoading || templatesLoading || isQueryPending;

  if (!displayOrg && !orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>No Brand Selected</CardTitle>
            <CardDescription>
              Create your first brand to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/brand-setup")}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Brand
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  interface TopStats {
    title: string;
    value: number | string;
    description: string | React.ReactNode;
  }

  // Check if brand kit is set up
  const hasBrandKit = displayOrg?.metadata?.setupCompleted;

  return (
    <div className="space-y-6 relative">
      <h1 className="sr-only">{displayOrg?.name}</h1>

      {/* Brand Kit Setup Call-to-Action */}
      {!orgLoading && !hasBrandKit && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <BrandKitSetupBanner />
        </div>
      )}

      {/* Your Templates */}
      <Card className="relative z-10 p-2 px-6">
        <CardHeader className="flex flex-row items-center justify-between p-0">
          <CardTitle>
            <h1 className="text-lg font-bold">Your Templates</h1>
          </CardTitle>
          {isDataLoading ? (
            <Skeleton className="h-6 w-20" />
          ) : (
            <span className="text-base font-bold text-muted-foreground">
              {templates.length} of {templateCount}
            </span>
          )}
          <Button
            onClick={handleCreateTemplate}
            className="self-end ml-auto"
            disabled={orgLoading}
          >
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </CardHeader>
      </Card>

      {/* Recent Templates */}
      {isDataLoading ? (
        <Card className="relative z-10">
          <CardContent>
            <TemplateListSkeleton />
          </CardContent>
        </Card>
      ) : templateCount > 0 ? (
        <Card className="relative z-10">
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>

            {/* Load more trigger */}
            <div ref={loadMoreRef} className="mt-6 flex justify-center">
              {isFetchingNextPage ? (
                <div className="flex items-center gap-2 text-muted-foreground py-4">
                  <Loader />
                  <span className="sr-only">Loading more...</span>
                </div>
              ) : hasNextPage ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  className="text-muted-foreground"
                >
                  Load more templates
                </Button>
              ) : templates.length > TEMPLATES_PER_PAGE ? (
                <p className="text-sm text-muted-foreground py-4">
                  All templates loaded
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="relative z-10">
          <CardContent className="py-10 text-center space-y-4">
            <div className="text-muted-foreground">
              <p className="text-lg font-semibold mb-2">No templates yet</p>
              <p>Create your first template</p>
            </div>
            <Button onClick={handleCreateTemplate} size={"lg"}>
              <Plus className="h-4 w-4" />
              Create
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

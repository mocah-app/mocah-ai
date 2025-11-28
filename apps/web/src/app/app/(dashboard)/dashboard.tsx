"use client";
import { useEffect, useRef, useCallback } from "react";
import BrandKitSetupBanner from "@/components/brand-kit/BrandKitSetupBanner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganization } from "@/contexts/organization-context";
import { FileText, Plus, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { trpc } from "@/utils/trpc";
import { Textarea } from "@/components/ui/textarea";
import Loader from "@/components/loader";
import { toast } from "sonner";

interface TemplateCardProps {
  template: {
    id: string;
    name: string;
    updatedAt: string | Date;
    isFavorite: boolean | null;
    _count: {
      versions: number;
    };
  };
}

const TemplateCard = ({ template }: TemplateCardProps) => {
  return (
    <Link href={`/app/${template.id}`}>
      <Card className="gap-0 hover:shadow-md transition-all duration-300 group p-0 h-full overflow-hidden">
        <CardHeader className="p-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 w-full h-28 bg-primary/10 bg-dot opacity-25">
                <span className="text-muted-foreground w-full text-center">
                  Preview
                </span>
              </div>
              <CardTitle className="group-hover:text-primary transition-colors duration-300 p-4 text-lg lg:text-xl">
                {template.name}
              </CardTitle>
            </div>
            {template.isFavorite && (
              <span className="text-yellow-500 text-sm">★</span>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 p-2">
            <div className="flex items-center gap-2">
              <FileText className="h-3 w-3" />
              <span>{template._count.versions} versions</span>
            </div>
            <span>
              {formatDistanceToNow(new Date(template.updatedAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </CardHeader>
      </Card>
    </Link>
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

const StatsSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-3 relative z-10">
    {[1, 2, 3].map((i) => (
      <Card key={i} className="gap-2 py-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-12" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-3 w-32 mt-1" />
        </CardContent>
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

  const topStats: TopStats[] = [
    {
      title: "Templates",
      value: templateCount,
      description: "Your email templates",
    },
    { title: "AI Credits", value: 0, description: "50 remaining this month" },
    {
      title: "Plan",
      value: 0,
      description: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/pricing")}
        >
          Upgrade Plan
        </Button>
      ),
    },
  ];

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
          <Button onClick={handleCreateTemplate} className="self-end ml-auto">
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </CardHeader>
      </Card>

      {/* Recent Templates */}
      {isDataLoading ? (
        <Card className="relative z-10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Templates</CardTitle>
          </CardHeader>
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

const PromptInput = () => {
  const handleGenerate = () => {
    console.log("Generate");
  };
  return (
    <div className="mx-auto max-w-2xl flex flex-col items-center justify-center gap-4 py-8">
      <h2 className="text-2xl font-bold">What do you want to create?</h2>
      <div className="w-full relative">
        <Textarea
          placeholder="Describe the email template you want to generate..."
          rows={4}
          maxLength={1000}
          className="w-full bg-card focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-2 focus-visible:ring-offset-ring/5 focus:outline-none focus-visible:border-ring outline-none resize-none max-h-[180px] disabled:opacity-50 shadow-2xl"
        />
        <Button
          size="icon"
          onClick={handleGenerate}
          className="absolute bottom-0.5 right-0.5 rounded-md w-10 h-8"
          aria-label="Generate template"
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
};

"use client";

import BrandKitSetupBanner from "@/components/brand-kit/BrandKitSetupBanner";
import { EmptyState } from "@/components/dashboard/empty-state";
import { NoBrandState } from "@/components/dashboard/no-brand-state";
import { TemplateList } from "@/components/dashboard/template-list";
import { TemplateListSkeleton } from "@/components/dashboard/template-list-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardProvider, useDashboard } from "@/contexts/dashboard-context";
import { useOrganization } from "@/contexts/organization-context";
import { trpc } from "@/utils/trpc";
import { Plus } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

const TEMPLATES_PER_PAGE = 6;

function DashboardContent() {
  const { router, utils } = useDashboard();
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

  const handleCreateTemplate = () => {
    if (!activeOrganization) {
      toast.error("Please select a workspace first");
      return;
    }
    router.push("/app/new");
  };

  // Combined loading state
  const isQueryPending = !activeOrganization?.id && organizations.length > 0;
  const isDataLoading = orgLoading || templatesLoading || isQueryPending;

  if (!displayOrg && !orgLoading) {
    return <NoBrandState />;
  }

  // Check if key brand data is present (main colors and logo)
  const brandKit = displayOrg?.brandKit;
  const hasKeyBrandData =
    brandKit &&
    brandKit.primaryColor &&
    brandKit.accentColor &&
    brandKit.logo;

  return (
    <div className="space-y-6 relative">
      <h1 className="sr-only">{displayOrg?.name}</h1>

      {/* Brand Kit Setup Banner */}
      {!orgLoading && !hasKeyBrandData && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <BrandKitSetupBanner />
        </div>
      )}

      {/* Templates Header */}
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

      {/* Templates Content */}
      {isDataLoading ? (
        <Card className="relative z-10">
          <CardContent>
            <TemplateListSkeleton />
          </CardContent>
        </Card>
      ) : templateCount > 0 ? (
        <TemplateList
          templates={templates}
          hasNextPage={hasNextPage ?? false}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          templatesPerPage={TEMPLATES_PER_PAGE}
        />
      ) : (
        <EmptyState onCreateTemplate={handleCreateTemplate} />
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}

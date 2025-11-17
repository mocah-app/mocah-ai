"use client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useSidebar } from "./ui/sidebar";
import { useOrganization } from "@/contexts/organization-context";
import { Skeleton } from "./ui/skeleton";

export default function DashboardHeader() {
  const { isMobile } = useSidebar();

  const { activeOrganization, isLoading } = useOrganization();

  return (
    <div>
      <div className="flex flex-row items-center justify-between p-2 bg-secondary/15">
        <div className="flex items-center gap-2">
          {isMobile && <SidebarTrigger className="size-8" />}
          <span className="text-xl font-base text-muted-foreground">
            {isLoading ? (
              <Skeleton className="w-[100px] h-6" />
            ) : (
              activeOrganization?.name || "Select Workspace"
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Search template..."
            className="w-64 bg-background"
          />
          <Button>
            New Template <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <hr />
    </div>
  );
}

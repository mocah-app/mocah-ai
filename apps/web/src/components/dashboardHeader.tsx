"use client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { navigationConfig } from "@/config/navigation";
import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useSidebar } from "./ui/sidebar";

export default function DashboardHeader() {
  const { isMobile } = useSidebar();
  return (
    <div>
      <div className="flex flex-row items-center justify-between p-2 bg-secondary/15">
        <div className="flex items-center gap-2">
          {isMobile && <SidebarTrigger className="size-8" />}
          <h1 className="text-xl font-base text-muted-foreground">
            {navigationConfig.workspace.name}
          </h1>
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

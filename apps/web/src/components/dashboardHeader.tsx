"use client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useOrganization } from "@/contexts/organization-context";
import { Plus, Search } from "lucide-react";
import * as motion from "motion/react-client";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { useSidebar } from "./ui/sidebar";
import { Skeleton } from "./ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import Link from "next/link";

export default function DashboardHeader() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const { activeOrganization, isLoading } = useOrganization();
  const [openSearch, setOpenSearch] = useState(false);

  const handleCreateTemplate = () => {
    if (!activeOrganization) {
      toast.error("Please select a workspace first");
      return;
    }

    // Navigate to new template page with AI streaming
    router.push("/app/new");
  };

  const shouldHideAddButton = pathname === "/app" || pathname === "/app/new";

  const handleSearch = () => {
    setOpenSearch(true);
  };

  return (
    <div>
      <div className="flex flex-row items-center justify-between p-2 bg-secondary/15">
        <div className="flex items-center gap-2">
          {isMobile && <SidebarTrigger className="size-8" />}
          <div className="hidden md:block">
            {isLoading ? (
              <Skeleton className="w-[100px] h-6" />
            ) : (
              <Button variant="ghost" asChild className="text-xl font-base text-muted-foreground">
                <Link href="/app">
                  {activeOrganization?.name || "Select Workspace"}
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          <Button variant="outline" onClick={handleSearch} disabled={!activeOrganization}>
            <Search className="w-4 h-4" /> Search
          </Button>

          <motion.div
            initial={false}
            animate={{
              opacity: shouldHideAddButton ? 0 : 1,
              scale: shouldHideAddButton ? 0.8 : 1,
              width: shouldHideAddButton ? 0 : 40,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
            style={{
              pointerEvents: shouldHideAddButton ? "none" : "auto",
              overflow: "hidden",
              minWidth: shouldHideAddButton ? 0 : undefined,
            }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleCreateTemplate}
                  disabled={!activeOrganization}
                  size="icon"
                  className="shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New template</TooltipContent>
            </Tooltip>
          </motion.div>
        </div>
      </div>
      <hr />

      <SearchCommandPanel open={openSearch} onOpenChange={setOpenSearch} />
    </div>
  );
}

function SearchCommandPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      showCloseButton={false}
    >
      <CommandInput placeholder="Search template..." />
      <CommandList>
        <CommandEmpty>This will be the search results</CommandEmpty>
      </CommandList>
    </CommandDialog>
  );
}
"use client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useSidebar } from "./ui/sidebar";
import { useOrganization } from "@/contexts/organization-context";
import { Skeleton } from "./ui/skeleton";
import { useRouter } from "next/navigation";
import { trpc } from "@/utils/trpc";
import { useState } from "react";
import { toast } from "sonner";

export default function DashboardHeader() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { activeOrganization, isLoading } = useOrganization();
  const [isCreating, setIsCreating] = useState(false);
  const createMutation = trpc.template.create.useMutation();

  const handleCreateTemplate = async () => {
    if (!activeOrganization) return;

    setIsCreating(true);
    try {
      const newTemplate = await createMutation.mutateAsync({
        name: "Untitled Template",
        content: JSON.stringify({
          subject: "Untitled",
          previewText: "",
          sections: [],
        }),
        isPublic: false,
      });

      toast.success("Template created!");
      router.push(`/template/${newTemplate.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create template");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      <div className="flex flex-row items-center justify-between p-2 bg-secondary/15">
        <div className="flex items-center gap-2">
          {isMobile && <SidebarTrigger className="size-8" />}
          <span className="text-xl font-base text-muted-foreground hidden md:block">
            {isLoading ? (
              <Skeleton className="w-[100px] h-6" />
            ) : (
              activeOrganization?.name || "Select Workspace"
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 relative">
          <Input
            type="text"
            placeholder="Search template..."
            className="w-52 bg-background"
          />
          <Button
            onClick={handleCreateTemplate}
            disabled={isCreating || !activeOrganization}
          >
            {isCreating ? "Creating..." : "New Template"}
            {!isCreating && <Plus className="w-4 h-4 hidden md:block ml-2" />}
          </Button>
        </div>
      </div>
      <hr />
    </div>
  );
}

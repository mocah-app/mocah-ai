"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { format } from "date-fns";
import {
  Check,
  History,
  X
} from "lucide-react";
import { useParams } from "next/navigation";
import React, { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTemplate } from "../providers/TemplateProvider";

interface VersionHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VersionHistoryPanel = ({
  isOpen,
  onClose,
}: VersionHistoryPanelProps) => {
  const params = useParams();
  const templateId = params.id as string;
  const { state: templateState, actions: templateActions } = useTemplate();

  // Fetch versions - always enabled to preload data
  // This prevents loading state when opening the panel
  const { data: versions, isLoading } = trpc.template.versions.useQuery(
    { templateId },
    { enabled: !!templateId }
  );

  const currentVersionId = templateState.currentVersion;

  // Transition delay pattern (same as ChatPanel)
  const [enableTransition, setEnableTransition] = useState(false);

  React.useLayoutEffect(() => {
    if (!enableTransition) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setEnableTransition(true));
      });
    }
  }, [enableTransition]);

  const handleSwitchVersion = useCallback(
    async (versionId: string) => {
      if (versionId === currentVersionId) return;

      try {
        await templateActions.switchToVersion(versionId);
        // Close panel after switching
        onClose();
      } catch (error) {
        console.error("Failed to switch version:", error);
        toast.error("Failed to switch version", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [currentVersionId, templateActions, onClose]
  );

  type VersionItem = {
    id: string;
    version: number;
    name: string | null;
    createdAt: string | Date;
    changeNote: string | null;
    createdBy: string | null;
    metadata: unknown;
  };

  const sortedVersions = useMemo(() => {
    if (!versions) return [];
    return [...versions].sort(
      (a, b) => (b.version || 0) - (a.version || 0)
    ) as VersionItem[];
  }, [versions]);

  return (
    <div
      className={cn(
        "bg-card rounded-r-xl shadow-2xl border border-border overflow-hidden flex flex-col z-40 h-dvh",
        enableTransition && "transition-all duration-300 ease-in-out",
        isOpen
          ? "translate-x-0 opacity-100 w-80"
          : "-translate-x-full opacity-0 pointer-events-none w-0"
      )}
    >
      {/* Header */}
      <div className="p-2 border-b border-border flex justify-between items-center bg-muted">
        <div className="flex items-center gap-2">
          <History className="size-3 text-primary" />
          <h3 className="font-semibold text-sm">Version History</h3>
        </div>
        <Button onClick={onClose} variant="outline" size="icon">
          <X size={16} />
        </Button>
      </div>

      {/* Versions List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading versions...
          </div>
        ) : sortedVersions.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No versions yet. Versions are created when you save changes.
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {sortedVersions.map((version: VersionItem) => {
              const isCurrent = version.id === currentVersionId;
             
              return (
                <div
                  key={version.id}
                  className={cn(
                    "rounded-lg border border-border cursor-pointer transition-colors",
                    isCurrent ? "border-primary/50" : "hover:bg-muted/50"
                  )}
                  onClick={() => handleSwitchVersion(version.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 p-2">
                        <span className="font-medium text-sm">
                          {version.name || `V ${version.version}`}
                        </span>

                        {isCurrent && (
                          <Badge variant="default" className="text-xs p-1">
                            <Check className="w-3 h-3" />
                          </Badge>
                        )}
                      </div>

                      {version.changeNote && (
                        <div className="flex items-center bg-accent/50 border-y border-border p-2 gap-2">
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {version.changeNote}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground p-2">
                        <div className="flex items-center justify-between w-full gap-1">
                          <span>
                            {format(
                              typeof version.createdAt === "string"
                                ? new Date(version.createdAt)
                                : version.createdAt,
                              "MMM d, yyyy HH:mm"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

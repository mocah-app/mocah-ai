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
  X,
  Eye
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
  const { data: versions, isLoading } = trpc.template.versions.list.useQuery(
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

  const handlePreviewVersion = useCallback(
    (versionId: string) => {
      // Allow clicking current version if we're previewing something else
      // to go back to current
      if (versionId === currentVersionId && !templateState.previewingVersionId) {
        return;
      }
      
      // If clicking the current version while previewing, cancel preview
      if (versionId === currentVersionId && templateState.previewingVersionId) {
        templateActions.cancelVersionPreview();
        return;
      }
      
      // Instant preview - no API call, no loading state
      templateActions.previewVersion(versionId);
    },
    [currentVersionId, templateState.previewingVersionId, templateActions]
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
      <ScrollArea className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading versions...
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {/* Current Version Section */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                Current Version
              </h4>
              <div
                className={cn(
                  "rounded-lg border-2 cursor-pointer transition-colors",
                  templateState.previewingVersionId
                    ? "border-border bg-muted/30"
                    : "border-primary bg-primary/5"
                )}
                onClick={() => {
                  if (templateState.previewingVersionId) {
                    templateActions.cancelVersionPreview();
                  }
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 p-3">
                      <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-primary animate-pulse" />
                        <span className="font-medium text-sm">Active</span>
                      </div>
                      {!templateState.previewingVersionId && (
                        <Badge variant="default" className="text-xs px-2 py-0.5">
                          <Check className="w-3 h-3" />
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Version History Section */}
            {sortedVersions.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                  Version History ({sortedVersions.length}/10)
                </h4>
                <div className="space-y-2">
                  {sortedVersions.map((version: VersionItem) => {
              const isPreviewing = templateState.previewingVersionId === version.id;
             
              return (
                <div
                  key={version.id}
                  className={cn(
                    "rounded-lg border border-border cursor-pointer transition-colors",
                    isPreviewing && "border-amber-500 bg-amber-500/5",
                    !isPreviewing && "hover:bg-muted/50"
                  )}
                  onClick={() => handlePreviewVersion(version.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 p-2">
                        <span className="font-medium text-sm">
                          {version.name || `V ${version.version}`}
                        </span>

                        {isPreviewing && (
                          <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-400">
                            <Eye className="w-3 h-3 mr-1" />
                            Previewing
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
              </div>
            )}

            {sortedVersions.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">
                No version history yet. Versions are created when you save changes.
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

"use client";

import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { FileText, Star } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
import { TemplateCardMenu } from "./template-card-menu";

interface Template {
  id: string;
  name: string;
  updatedAt: string | Date;
  isFavorite: boolean | null;
  htmlCode: string | null;
  _count: {
    versions: number;
  };
}

interface TemplateListViewProps {
  templates: Template[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  templatesPerPage: number;
}

export function TemplateListView({
  templates,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  templatesPerPage,
}: TemplateListViewProps) {
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

  return (
    <Card className="relative z-10 border-border rounded-none">
      <CardContent className="px-0">
        <div className="divide-y divide-border">
          {templates.map((template) => (
            <Link
              key={template.id}
              href={`/app/${template.id}`}
              className="block hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-4 px-4 py-4">
                {/* Template Name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold truncate">
                      {template.name}
                    </h3>
                    {template.isFavorite && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 shrink-0" />
                    )}
                  </div>
                </div>

                {/* Versions Count */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
                  <FileText className="h-4 w-4" />
                  <span>{template._count.versions} versions</span>
                </div>

                {/* Last Updated */}
                <div className="text-sm text-muted-foreground shrink-0 hidden sm:block">
                  {formatDistanceToNow(new Date(template.updatedAt), {
                    addSuffix: true,
                  })}
                </div>

                {/* Actions Menu */}
                <div className="shrink-0" onClick={(e) => e.preventDefault()}>
                  <TemplateCardMenu
                    templateId={template.id}
                    templateName={template.name}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Load more trigger */}
        <div ref={loadMoreRef} className="mt-6 flex justify-center pb-4">
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
          ) : templates.length > templatesPerPage ? (
            <p className="text-sm text-muted-foreground py-4">
              All templates loaded
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

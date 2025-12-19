"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Loader from "@/components/loader";
import { TemplateCard } from "./template-card";
import { useCallback, useEffect, useRef } from "react";

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

interface TemplateGridViewProps {
  templates: Template[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  templatesPerPage: number;
}

export function TemplateGridView({
  templates,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  templatesPerPage,
}: TemplateGridViewProps) {
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
      <CardContent className="px-4">
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


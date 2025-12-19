import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PublishedTemplateGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card
          key={i}
          className="hover:shadow-md bg-accent/50 transition-all duration-300 overflow-hidden flex flex-col border-border rounded-md h-full pt-0"
        >
          <CardHeader className="p-0 relative">
            {/* Thumbnail skeleton */}
            <div className="relative w-full aspect-16/10 bg-muted">
              <Skeleton className="h-full w-full" />
            </div>
            {/* Badges overlay skeleton */}
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              <Skeleton className="h-5 w-20" />
            </div>
          </CardHeader>

          <CardContent className="p-4 flex-1 flex flex-col gap-2">
            {/* Title skeleton */}
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />

            {/* Category and Tags skeleton */}
            <div className="flex flex-wrap gap-1.5 mt-auto">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-14" />
            </div>
          </CardContent>

          <CardFooter className="p-0 px-4 flex flex-col gap-3 border-t border-border mt-auto">
            {/* Stats skeleton */}
            <div className="flex items-center justify-between text-xs text-muted-foreground w-full">
              <Skeleton className="h-3 w-32" />
            </div>

            {/* Actions skeleton */}
            <div className="flex items-center gap-2 w-full">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 w-24" />
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}


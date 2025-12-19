import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TemplateListViewSkeleton() {
  return (
    <Card className="relative z-10 border-border rounded-none">
      <CardContent className="px-0">
        <div className="divide-y divide-border">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4">
              <div className="flex-1 min-w-0">
                <Skeleton className="h-5 w-48 mb-1" />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-24 shrink-0 hidden sm:block" />
              <Skeleton className="h-8 w-8 shrink-0" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

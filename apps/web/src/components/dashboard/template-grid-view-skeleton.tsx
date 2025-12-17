import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TemplateGridViewSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3].map((i) => (
    <Card className="relative z-10 border-border rounded-none" key={i}>
          <CardHeader>
            <Skeleton className="h-28 w-full mb-2" />
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2 mt-2" />
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

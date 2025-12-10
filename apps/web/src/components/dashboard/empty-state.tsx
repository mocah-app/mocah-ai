import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

interface EmptyStateProps {
  onCreateTemplate: () => void;
}

export function EmptyState({ onCreateTemplate }: EmptyStateProps) {
  return (
    <Card className="relative z-10">
      <CardContent className="py-10 text-center space-y-4">
        <div className="text-muted-foreground">
          <p className="text-lg font-semibold mb-2">No templates yet</p>
          <p>Create your first template</p>
        </div>
        <Button onClick={onCreateTemplate} size="lg">
          <Plus className="h-4 w-4" />
          Create
        </Button>
      </CardContent>
    </Card>
  );
}

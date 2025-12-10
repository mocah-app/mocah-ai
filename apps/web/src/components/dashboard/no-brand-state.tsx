import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDashboard } from "@/contexts/dashboard-context";
import { Plus } from "lucide-react";

export function NoBrandState() {
  const { router } = useDashboard();

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>No Brand Selected</CardTitle>
          <CardDescription>
            Create your first brand to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => router.push("/brand-setup")}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Brand
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

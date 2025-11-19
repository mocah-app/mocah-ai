"use client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette } from "lucide-react";
import { useRouter } from "next/navigation";

function BrandKitSetupBanner() {
  const router = useRouter();

  return (
    <Card className="border-border border border-dashed relative z-10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex flex-col gap-1">
          <div className="flex gap-2">
            <Palette className="h-5 w-5" />
            Complete your Brand setup
          </div>
          <p className="text-sm text-muted-foreground">
            Configure to create perfectly on-brand templates automatically.
          </p>
        </CardTitle>

        <Button
          onClick={() => router.push("/dashboard/settings")}
          className="justify-end"
        >
          Complete Setup
        </Button>
      </CardHeader>
    </Card>
  );
}

export default BrandKitSetupBanner;

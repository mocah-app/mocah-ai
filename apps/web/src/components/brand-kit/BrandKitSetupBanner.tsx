"use client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { Route } from "next";
import { useRouter } from "next/navigation";

function BrandKitSetupBanner() {
  const router = useRouter();

  return (
    <Card className="border-border border border-dashed relative z-10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex flex-col gap-1">
          <div className="flex gap-2">
            Complete Brand setup
          </div>
          <p className="text-xs text-muted-foreground hidden md:block text-pretty">
            Configure to create perfectly on-brand templates automatically.
          </p>
        </CardTitle>

        <Button
          onClick={() => router.push("/app/?brand=configuration" as Route)}
          className="justify-end "
        >
          Complete
        </Button>
      </CardHeader>
    </Card>
  );
}

export default BrandKitSetupBanner;

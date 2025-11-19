"use client";

import type { ReactNode } from "react";
import MocahIcon from "../mocah-brand/MocahIcon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

interface AuthCardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <main className="w-screen h-svh flex items-center justify-center gap-4">
      <Card className="mx-auto w-full max-w-md rounded-none relative">
        <CardHeader className="pb-2">
          <div className="flex flex-col items-center justify-center">
            <MocahIcon className="h-12 w-auto" />
          </div>
          <CardTitle className="text-center text-xl md:text-2xl font-semibold">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-center text-sm text-balance text-muted-foreground mt-2">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="pt-0">{children}</CardContent>
      </Card>
    </main>
  );
}

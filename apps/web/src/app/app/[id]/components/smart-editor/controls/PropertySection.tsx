"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface PropertySectionProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function PropertySection({
  label,
  children,
  className,
}: PropertySectionProps) {
  return (
    <div
      className={cn("py-3 border-b border-border last:border-b-0", className)}
    >
      <div className="px-3 pb-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </h4>
      </div>
      <div className="px-3 space-y-3">{children}</div>
    </div>
  );
}

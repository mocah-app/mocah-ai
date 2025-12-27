"use client";

import { useState, Fragment as ReactFragment } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { COMPARISON_DATA } from "./pricing-data";

// ============================================================================
// Helper Components
// ============================================================================

function FeatureValue({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="h-4 w-4 text-primary mx-auto" />
    ) : (
      <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
    );
  }
  return <span className="text-sm">{value}</span>;
}

// ============================================================================
// Component
// ============================================================================

export function FeatureComparison() {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleRows = isExpanded ? COMPARISON_DATA : COMPARISON_DATA.slice(0, 10);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Compare Plans</h2>
        <p className="text-muted-foreground">
          See all features side by side
        </p>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[300px]">Feature</TableHead>
              <TableHead className="text-center">Starter</TableHead>
              <TableHead className="text-center bg-primary/5">
                <div className="flex items-center justify-center gap-1">
                  Pro
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                    Popular
                  </span>
                </div>
              </TableHead>
              <TableHead className="text-center">Scale</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((row, index) => {
              // Check if this is first row of a new category
              const isNewCategory =
                index === 0 ||
                visibleRows[index - 1]?.category !== row.category;

              return (
                <ReactFragment key={`row-${row.feature}-${index}`}>
                  {isNewCategory && row.category && (
                    <TableRow key={`category-${row.category}`} className="bg-muted/30">
                      <TableCell
                        colSpan={4}
                        className="py-2 font-semibold text-xs uppercase tracking-wider text-muted-foreground"
                      >
                        {row.category}
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell className="font-medium">{row.feature}</TableCell>
                    <TableCell className="text-center">
                      <FeatureValue value={row.starter} />
                    </TableCell>
                    <TableCell className="text-center bg-primary/5">
                      <FeatureValue value={row.pro} />
                    </TableCell>
                    <TableCell className="text-center">
                      <FeatureValue value={row.scale} />
                    </TableCell>
                  </TableRow>
                </ReactFragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {COMPARISON_DATA.length > 10 && (
        <div className="flex justify-center mt-4">
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-1"
          >
            {isExpanded ? (
              <>
                Show Less <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Show All Features <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}


"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "../ui/button";
import { Switch } from "@/components/ui/switch";

// ============================================================================
// Types
// ============================================================================

interface PricingToggleProps {
  isAnnual: boolean;
  onToggle: (isAnnual: boolean) => void;
}

// ============================================================================
// Component
// ============================================================================

export function PricingToggle({ isAnnual, onToggle }: PricingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-3 border border-input rounded-full p-2 w-fit mx-auto bg-card shadow-2xl">
      <Button
        variant={!isAnnual ? "outline" : "ghost"}
        onClick={() => onToggle(false)}
        size="sm"
        className="rounded-full"
      >
        Monthly
      </Button>

      {/* Toggle Switch */}
      <Switch
        checked={isAnnual}
        onCheckedChange={onToggle}
        size="lg"
      />

      <div className="flex items-center gap-2">
        <Button
          variant={isAnnual ? "outline" : "ghost"}
          onClick={() => onToggle(true)}
          size="sm"
          className="rounded-full"
        >
          Annual
        </Button>
        <Badge 
        >
          Save 20%
        </Badge>
      </div>
    </div>
  );
}


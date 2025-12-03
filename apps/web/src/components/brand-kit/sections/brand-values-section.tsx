"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BrandKitData } from "../brand-configuration-modal";
import { Heart, Plus, X, GripVertical, Sparkles } from "lucide-react";
import { useState } from "react";

interface BrandValuesSectionProps {
  data: BrandKitData;
  onUpdate: (updates: Partial<BrandKitData>) => void;
  disabled?: boolean;
}

const SUGGESTED_VALUES = [
  "Innovation",
  "Integrity",
  "Customer-First",
  "Quality",
  "Transparency", 
  "Sustainability",
  "Excellence",
  "Collaboration",
  "Trust",
  "Creativity",
  "Diversity",
  "Community",
];

export function BrandValuesSection({
  data,
  onUpdate,
  disabled,
}: BrandValuesSectionProps) {
  const [newValue, setNewValue] = useState("");
  const values = data.brandValues || [];

  const addValue = (value?: string) => {
    const toAdd = (value || newValue).trim();
    if (!toAdd || values.includes(toAdd)) return;
    
    onUpdate({ brandValues: [...values, toAdd] });
    setNewValue("");
  };

  const removeValue = (index: number) => {
    const updated = values.filter((_, i) => i !== index);
    onUpdate({ brandValues: updated.length > 0 ? updated : null });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addValue();
    }
  };

  // Filter out already added values from suggestions
  const availableSuggestions = SUGGESTED_VALUES.filter(
    (v) => !values.includes(v)
  );

  return (
    <div className="space-y-8 px-6">
      {/* Section Header */}
      <div>
        <h3 className="text-base font-semibold">Brand Values</h3>
        <p className="sr-only">
          Core values that define your brand identity and guide communication
        </p>
      </div>

      {/* Add New Value */}
      <div className="space-y-2">
        <Label>Add Brand Value</Label>
        <div className="flex gap-2">
          <Input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter a brand value"
            disabled={disabled}
            className="flex-1"
          />
          <Button
            onClick={() => addValue()}
            disabled={disabled || !newValue.trim()}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {/* Quick Add Suggestions */}
      {availableSuggestions.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-3 w-3" />
            Quick Add
          </Label>
          <div className="flex flex-wrap gap-2">
            {availableSuggestions.slice(0, 8).map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                onClick={() => addValue(suggestion)}
                disabled={disabled}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Values List */}
      {values.length > 0 ? (
        <div className="space-y-2">
          <Label>Your Brand Values ({values.length})</Label>
          <div className="rounded-lg border divide-y">
            {values.map((value, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors group"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                <Heart className="h-4 w-4 text-pink-500" />
                <span className="flex-1 text-sm font-medium">{value}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeValue(index)}
                  disabled={disabled}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-xl border-2 border-dashed text-center">
          <Heart className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No brand values defined yet
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Brand values help maintain consistent messaging across all emails
          </p>
        </div>
      )}

      {/* Values Display Preview */}
      {values.length > 0 && (
        <div className="p-4 rounded-xl border bg-muted/30">
          <p className="text-xs text-muted-foreground mb-3 font-medium">
            Values at a Glance
          </p>
          <div className="flex flex-wrap gap-2">
            {values.map((value, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20"
              >
                <Heart className="h-3 w-3 mr-1 fill-current" />
                {value}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react";

interface LayoutEditorProps {
  styles?: {
    padding?: string;
    margin?: string;
    textAlign?: "left" | "center" | "right" | "justify";
    backgroundColor?: string;
  };
  onChange: (styles: Partial<LayoutEditorProps["styles"]>) => void;
}

export function LayoutEditor({ styles = {}, onChange }: LayoutEditorProps) {
  return (
    <div className="space-y-4">
      {/* Alignment */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Alignment
        </Label>
        <ToggleGroup
          type="single"
          value={styles.textAlign || "left"}
          onValueChange={(value) => {
            if (value) onChange({ textAlign: value as any });
          }}
          className="justify-start"
        >
          <ToggleGroupItem value="left" aria-label="Align left" size="sm">
            <AlignLeft className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Align center" size="sm">
            <AlignCenter className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Align right" size="sm">
            <AlignRight className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="justify" aria-label="Justify" size="sm">
            <AlignJustify className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Spacing */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Padding
        </Label>
        <Input
          value={styles.padding || ""}
          onChange={(e) => onChange({ padding: e.target.value })}
          placeholder="e.g., 16px or 1rem"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Margin
        </Label>
        <Input
          value={styles.margin || ""}
          onChange={(e) => onChange({ margin: e.target.value })}
          placeholder="e.g., 16px or 1rem"
        />
      </div>

      {/* Background Color */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Background Color
        </Label>
        <div className="flex gap-2">
          <Input
            type="text"
            value={styles.backgroundColor || ""}
            onChange={(e) => onChange({ backgroundColor: e.target.value })}
            placeholder="#ffffff"
            className="flex-1"
          />
          <Input
            type="color"
            value={styles.backgroundColor || "#ffffff"}
            onChange={(e) => onChange({ backgroundColor: e.target.value })}
            className="w-12 h-10 p-1 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}

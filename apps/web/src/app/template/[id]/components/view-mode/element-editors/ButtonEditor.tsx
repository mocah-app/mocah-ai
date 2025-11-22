import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ButtonEditorProps {
  text?: string;
  url?: string;
  onChange: (data: { text?: string; url?: string }) => void;
}

export function ButtonEditor({
  text = "",
  url = "",
  onChange,
}: ButtonEditorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Button Text
        </Label>
        <Input
          value={text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Click here"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Button URL
        </Label>
        <Input
          value={url}
          onChange={(e) => onChange({ url: e.target.value })}
          placeholder="https://..."
        />
      </div>
    </div>
  );
}

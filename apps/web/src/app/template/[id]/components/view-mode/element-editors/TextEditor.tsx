import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function TextEditor({
  value,
  onChange,
  label = "Content",
}: TextEditorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {label}
      </Label>
      {value && value.length > 50 ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="resize-none font-sans"
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-sans"
        />
      )}
    </div>
  );
}

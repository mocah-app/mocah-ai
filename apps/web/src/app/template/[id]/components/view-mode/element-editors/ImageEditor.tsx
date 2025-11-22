import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";

interface ImageEditorProps {
  src?: string;
  alt?: string;
  onChange: (data: { src?: string; alt?: string }) => void;
}

export function ImageEditor({
  src = "",
  alt = "",
  onChange,
}: ImageEditorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Image URL
        </Label>
        <div className="flex gap-2">
          <Input
            value={src}
            onChange={(e) => onChange({ src: e.target.value })}
            placeholder="https://..."
          />
          <Button variant="outline" size="icon" title="Generate with AI">
            <Wand2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Alt Text
        </Label>
        <Input
          value={alt}
          onChange={(e) => onChange({ alt: e.target.value })}
          placeholder="Image description"
        />
      </div>

      {src && (
        <div className="relative aspect-video rounded-md overflow-hidden border border-border bg-muted">
          <img src={src} alt={alt} className="object-cover w-full h-full" />
        </div>
      )}
    </div>
  );
}

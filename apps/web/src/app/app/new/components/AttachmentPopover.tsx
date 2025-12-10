"use client";

import { Plus, Upload, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";

export interface AttachmentPopoverProps {
  onUploadClick: () => void;
  onPasteUrlClick: () => void;
  disabled?: boolean;
}

export default function AttachmentPopover({
  onUploadClick,
  onPasteUrlClick,
  disabled = false,
}: AttachmentPopoverProps) {
  const [open, setOpen] = useState(false);

  const handleUpload = () => {
    setOpen(false);
    onUploadClick();
  };

  const handlePasteUrl = () => {
    setOpen(false);
    onPasteUrlClick();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          aria-label="attachment" 
          disabled={disabled}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-auto py-2.5 px-3"
            onClick={handleUpload}
          >
            <Upload className="w-4 h-4" />
            <span>Upload from device</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-auto py-2.5 px-3"
            onClick={handlePasteUrl}
          >
            <Link2 className="w-4 h-4" />
            <span>Paste image URL</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

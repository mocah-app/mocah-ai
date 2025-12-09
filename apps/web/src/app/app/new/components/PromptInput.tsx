"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import React from "react";
import Loader from "@/components/loader";
import AttachmentPopover from "./AttachmentPopover";
import ImagePreviewBlob from "./ImagePreviewBlob";

export interface Attachment {
  id: string;
  url: string;
  type: "upload" | "url";
  status: "uploading" | "ready" | "error";
  previewUrl: string;
  fileName?: string;
}

export interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
  attachments: Attachment[];
  onAttachmentRemove: (id: string) => void;
  onUploadClick: () => void;
  onPasteUrlClick: () => void;
  onPaste?: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
}

export default function PromptInput({
  value,
  onChange,
  onSubmit,
  onKeyDown,
  isLoading,
  attachments,
  onAttachmentRemove,
  onUploadClick,
  onPasteUrlClick,
  onPaste,
  placeholder = "Please create black friday email showing our trending products",
}: PromptInputProps) {
  const hasUploadingAttachment = attachments.some(
    (att) => att.status === "uploading"
  );
  const isSubmitDisabled = !value.trim() || isLoading || hasUploadingAttachment;

  return (
    <div className="bg-card border border-border rounded-2xl shadow-2xl md:max-w-2xl lg:max-w-3xl w-full mx-auto has-focus-visible:border-blue-500/30 transition-colors">
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          rows={4}
          placeholder={placeholder}
          className="w-full border-0 dark:bg-transparent text-foreground placeholder:text-muted-foreground px-6 py-7 h-auto pr-16 min-h-[120px] max-h-[250px] resize-none scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 leading-relaxed"
        />

        {/* Action Buttons */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <AttachmentPopover
              onUploadClick={onUploadClick}
              onPasteUrlClick={onPasteUrlClick}
              disabled={isLoading}
            />
            
            {/* Attachment Preview Blobs */}
            {attachments.map((attachment) => (
              <ImagePreviewBlob
                key={attachment.id}
                id={attachment.id}
                previewUrl={attachment.previewUrl}
                status={attachment.status}
                fileName={attachment.fileName}
                onRemove={onAttachmentRemove}
              />
            ))}
          </div>

          <Button
            onClick={onSubmit}
            disabled={isSubmitDisabled}
            size="icon"
            aria-label="generate template"
            className="h-10 w-10"
          >
            {isLoading ? <Loader /> : <Send className="size-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

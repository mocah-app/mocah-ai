import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { isSafari } from "@/lib/browser-detect";
import { MessageCircle, Send, Square, X, Plus } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  useTemplate,
  GENERATION_PHASE_MESSAGES,
} from "../providers/TemplateProvider";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import type { Message, GenerationResult } from "../chat-panel/MessageItem";
import { MessageList } from "../chat-panel/MessageList";
import AttachmentPopover from "@/app/app/new/components/AttachmentPopover";
import FilterPopover from "@/app/app/new/components/FilterPopover";
import ImagePreviewBlob from "@/app/app/new/components/ImagePreviewBlob";
import { useImageUpload } from "../image-studio/hooks/useImageUpload";
import { useOrganization } from "@/contexts/organization-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Attachment } from "@/types/images";
import dynamic from "next/dynamic";

const ChatImagePreviewModal = dynamic(
  () =>
    import("../chat-panel/ChatImagePreviewModal").then(
      (mod) => mod.ChatImagePreviewModal
    ),
  { ssr: false }
);

export const ChatPanel = ({
  isOpen,
  onClose,
  initialPrompt,
  initialImageUrls = [],
  onPromptConsumed,
  errorFixPrompt,
  onErrorFixConsumed,
  initialInput,
  onInputConsumed,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  initialImageUrls?: string[];
  onPromptConsumed?: () => void;
  errorFixPrompt?: string;
  onErrorFixConsumed?: () => void;
  initialInput?: string;
  onInputConsumed?: () => void;
}) => {
  const { state: templateState, actions: templateActions } = useTemplate();
  const { activeOrganization } = useOrganization();
  const params = useParams();
  const templateId = params.id as string;

  // ==================== LOCAL STATE (Source of truth during session) ====================
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [textareaMinHeight, setTextareaMinHeight] = useState(100);
  const [includeBrandGuide, setIncludeBrandGuide] = useState(true);

  // Image preview modal state
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewInitialIndex, setPreviewInitialIndex] = useState(0);

  // Refs for tracking
  const hasAutoSentRef = useRef(false);
  const currentStreamingIdRef = useRef<string | null>(null);
  const latestStreamingProgressRef = useRef<GenerationResult | null>(null);
  const initialImageUrlsRef = useRef<string[]>(initialImageUrls);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==================== tRPC for persistence ====================
  const utils = trpc.useUtils();
  const { data: persistedMessages, isLoading: isLoadingMessages } =
    trpc.chat.list.useQuery(
      { templateId },
      { enabled: !!templateId && !!templateState.currentTemplate }
    );

  // Fetch brand guide preference
  const { data: brandGuidePreference } = trpc.brandGuide.getPreference.useQuery(
    undefined,
    {
      enabled: !!activeOrganization?.id,
      refetchOnWindowFocus: false,
    }
  );

  // Update local state when preference is fetched
  React.useEffect(() => {
    if (brandGuidePreference !== undefined) {
      setIncludeBrandGuide(brandGuidePreference);
    }
  }, [brandGuidePreference]);

  const createMessageMutation = trpc.chat.create.useMutation();
  const updateMessageMutation = trpc.chat.update.useMutation();

  // ==================== IMAGE UPLOAD ====================
  const { uploadFile, isUploading } = useImageUpload({
    organizationId: activeOrganization?.id,
    templateId: templateId,
    purpose: "template-reference",
    onSuccess: (image) => {
      setAttachments((prev) =>
        prev.map((att) =>
          att.status === "uploading" && att.previewUrl.startsWith("blob:")
            ? { ...att, status: "ready", url: image.url }
            : att
        )
      );
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
      setAttachments((prev) =>
        prev.map((att) =>
          att.status === "uploading" ? { ...att, status: "error" } : att
        )
      );
    },
  });

  // ==================== BROWSER DETECTION ====================
  useEffect(() => {
    // Safari has issues with textarea auto-grow, so use fixed max height
    if (isSafari()) {
      setTextareaMinHeight(140);
    }
  }, []);

  // ==================== TRANSITIONS ====================
  const [enableTransition, setEnableTransition] = useState(
    () => !initialPrompt
  );

  React.useLayoutEffect(() => {
    if (!enableTransition) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setEnableTransition(true));
      });
    }
  }, [enableTransition]);

  // ==================== INITIALIZATION ====================
  // Load messages from DB on mount (only once when data arrives)
  useEffect(() => {
    if (!isInitialized && persistedMessages && !isLoadingMessages) {
      const dbMessages: Message[] = persistedMessages.map((msg) => {
        const metadata = msg.metadata as any;
        return {
          id: msg.id,
          role: msg.role as "user" | "assistant",
          content: msg.content,
          isStreaming: msg.isStreaming,
          isPersisted: true,
          generationResult:
            msg.role === "assistant"
              ? ((metadata as GenerationResult | null) ?? undefined)
              : undefined,
          imageUrls:
            msg.role === "user" && metadata?.imageUrls
              ? metadata.imageUrls
              : undefined,
        };
      });

      // If no messages, add greeting
      if (dbMessages.length === 0) {
        const isNewTemplate = !templateState.currentTemplate?.reactEmailCode;
        dbMessages.push({
          id: "greeting",
          role: "assistant",
          content: isNewTemplate
            ? 'Hi! I can help you create your email template. Try asking me to "Create a Black Friday sale template".'
            : "Hi! I can help you edit this email template. Ask me to make changes or regenerate sections.",
          isPersisted: false, // Greeting doesn't need persistence
        });
      }

      setMessages(dbMessages);
      setIsInitialized(true);
    }
  }, [
    persistedMessages,
    isLoadingMessages,
    isInitialized,
    templateState.currentTemplate,
  ]);

  // ==================== STREAMING PHASE UPDATES ====================
  // Update the streaming message content based on generation phase
  useEffect(() => {
    if (
      templateState.isStreaming &&
      templateState.generationPhase !== "idle" &&
      currentStreamingIdRef.current
    ) {
      const phaseMessage =
        GENERATION_PHASE_MESSAGES[templateState.generationPhase];
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === currentStreamingIdRef.current
            ? { ...msg, content: phaseMessage }
            : msg
        )
      );
    }
  }, [templateState.generationPhase, templateState.isStreaming]);

  // Track latest streaming progress in ref (to avoid stale closure issues)
  useEffect(() => {
    if (templateState.streamingProgress) {
      const code = templateState.streamingProgress.reactEmailCode;
      latestStreamingProgressRef.current = {
        subject: templateState.streamingProgress.subject,
        previewText: templateState.streamingProgress.previewText,
        // Only save a preview snippet (full code is in template)
        codePreview: code
          ? code.substring(0, 500) + (code.length > 500 ? "..." : "")
          : undefined,
      };
    }
  }, [templateState.streamingProgress]);

  // ==================== IMAGE ATTACHMENT HANDLERS ====================
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const file = files[0];

      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      const blobUrl = URL.createObjectURL(file);
      const attachmentId = crypto.randomUUID();

      const newAttachment: Attachment = {
        id: attachmentId,
        url: "",
        type: "upload",
        status: "uploading",
        previewUrl: blobUrl,
        fileName: file.name,
      };

      setAttachments((prev) => [...prev, newAttachment]);
      await uploadFile(file);
      e.target.value = "";
    },
    [uploadFile]
  );

  const handlePasteUrlClick = useCallback(() => {
    setIsUrlDialogOpen(true);
  }, []);

  const handleUrlSubmit = useCallback(() => {
    if (!urlInput.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    try {
      new URL(urlInput);
    } catch {
      toast.error("Invalid URL format");
      return;
    }

    const attachmentId = crypto.randomUUID();
    const newAttachment: Attachment = {
      id: attachmentId,
      url: urlInput,
      type: "url",
      status: "ready",
      previewUrl: urlInput,
    };

    setAttachments((prev) => [...prev, newAttachment]);
    setUrlInput("");
    setIsUrlDialogOpen(false);
    toast.success("Image URL added");
  }, [urlInput]);

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.type.startsWith("image/")) {
          e.preventDefault();

          const file = item.getAsFile();
          if (!file) continue;

          const blobUrl = URL.createObjectURL(file);
          const attachmentId = crypto.randomUUID();

          const newAttachment: Attachment = {
            id: attachmentId,
            url: "",
            type: "upload",
            status: "uploading",
            previewUrl: blobUrl,
            fileName: `pasted-${Date.now()}.png`,
          };

          setAttachments((prev) => [...prev, newAttachment]);
          await uploadFile(file);
          return;
        }
      }
    },
    [uploadFile]
  );

  const handleAttachmentRemove = useCallback((id: string) => {
    setAttachments((prev) => {
      const attachment = prev.find((att) => att.id === id);
      if (attachment?.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
      return prev.filter((att) => att.id !== id);
    });
  }, []);

  // ==================== IMAGE PREVIEW ====================
  const handleImageClick = useCallback(
    (imageUrls: string[], clickedIndex: number) => {
      setPreviewImages(imageUrls);
      setPreviewInitialIndex(clickedIndex);
      setImagePreviewOpen(true);
    },
    []
  );

  // ==================== SEND MESSAGE ====================
  const handleSend = useCallback(
    async (promptText: string) => {
      const trimmedPrompt = promptText.trim();
      if (!trimmedPrompt || isLoading) return;

      // Check if any attachments are still uploading
      const hasUploadingAttachment = attachments.some(
        (att) => att.status === "uploading"
      );
      if (hasUploadingAttachment) {
        toast.error("Please wait for image uploads to complete");
        return;
      }

      setInput("");
      setIsLoading(true);

      // 1. Create local messages immediately (optimistic UI)
      const userMsgId = crypto.randomUUID();
      const assistantMsgId = crypto.randomUUID();

      // Check if this is the first message and we have initial image URLs
      // Otherwise use current attachments
      let imageUrls: string[] | undefined;
      if (!hasAutoSentRef.current && initialImageUrlsRef.current.length > 0) {
        imageUrls = initialImageUrlsRef.current;
      } else if (attachments.length > 0) {
        imageUrls = attachments
          .filter((att) => att.status === "ready")
          .map((att) => att.url);
      }

      const userMessage: Message = {
        id: userMsgId,
        role: "user",
        content: trimmedPrompt,
        isPersisted: false,
        imageUrls: imageUrls && imageUrls.length > 0 ? imageUrls : undefined,
      };

      const assistantMessage: Message = {
        id: assistantMsgId,
        role: "assistant",
        content: GENERATION_PHASE_MESSAGES.starting,
        isStreaming: true,
        isPersisted: false,
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      currentStreamingIdRef.current = assistantMsgId;

      // 2. Determine generation type
      const isNewTemplate = !templateState.currentTemplate?.reactEmailCode;

      try {
        // 3. Start generation immediately (UX: user sees streaming right away)
        // imageUrls was already determined above when creating the user message
        const generationPromise = isNewTemplate
          ? templateActions.generateTemplateStream(trimmedPrompt, imageUrls, includeBrandGuide)
          : templateActions.regenerateTemplate(trimmedPrompt, imageUrls, includeBrandGuide);

        // 4. Define message persistence function
        const persistMessages = async () => {
          try {
            // Persist user message (with imageUrls in metadata if present)
            const dbUser = await createMessageMutation.mutateAsync({
              templateId,
              role: "user",
              content: trimmedPrompt,
              isStreaming: false,
              metadata:
                imageUrls && imageUrls.length > 0 ? { imageUrls } : undefined,
            } as any);

            // Persist assistant message
            const dbAssistant = await createMessageMutation.mutateAsync({
              templateId,
              role: "assistant",
              content: GENERATION_PHASE_MESSAGES.starting,
              isStreaming: true,
            });

            // Atomically update both message IDs in a single operation
            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id === userMsgId) {
                  return {
                    ...msg,
                    id: dbUser.id,
                    isPersisted: true,
                    persistenceError: false,
                  };
                }
                if (msg.id === assistantMsgId) {
                  return {
                    ...msg,
                    id: dbAssistant.id,
                    isPersisted: true,
                    persistenceError: false,
                  };
                }
                return msg;
              })
            );

            currentStreamingIdRef.current = dbAssistant.id;
            return dbAssistant.id;
          } catch (error) {
            console.error("Message persistence failed:", error);

            // Mark messages as failed in UI
            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id === userMsgId || msg.id === assistantMsgId) {
                  return { ...msg, isPersisted: false, persistenceError: true };
                }
                return msg;
              })
            );

            // Surface error to user with actionable information
            toast.error("Failed to save chat messages", {
              description:
                "Your messages are shown locally but weren't saved. The template was still created successfully.",
              duration: 5000,
            });

            return null;
          }
        };

        // 5. Wait for generation to complete first
        await generationPromise;

        // 6. Now persist messages (template is guaranteed to exist)
        // This ensures no race condition with template creation
        const dbAssistantId = await persistMessages();

        // 7. Capture the generation result from ref (not state - avoids stale closure)
        const generationResult: GenerationResult =
          latestStreamingProgressRef.current ?? {};
        // Clear the ref for next generation
        latestStreamingProgressRef.current = null;

        // 8. Update local message to completion with generation result
        const finalContent = isNewTemplate
          ? "I've created a new template based on your request. You can now edit it in the canvas!"
          : "I've updated the template based on your request.";

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === currentStreamingIdRef.current ||
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: finalContent,
                  isStreaming: false,
                  generationResult,
                }
              : msg
          )
        );

        // 9. Update DB with final content and metadata
        if (dbAssistantId) {
          try {
            await updateMessageMutation.mutateAsync({
              id: dbAssistantId,
              content: finalContent,
              isStreaming: false,
              metadata: generationResult,
            });
          } catch (error) {
            console.error(
              "Failed to update message with final content:",
              error
            );
            toast.error("Failed to save final message", {
              description:
                "The message is visible but the final state wasn't saved.",
              duration: 4000,
            });
          }
        }

        currentStreamingIdRef.current = null;

        // Clear attachments after successful send
        attachments.forEach((att) => {
          if (att.previewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(att.previewUrl);
          }
        });
        setAttachments([]);
      } catch (error) {
        console.error("Generation error:", error);

        // Update local message with error
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === currentStreamingIdRef.current ||
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: "Sorry, I encountered an error. Please try again.",
                  isStreaming: false,
                }
              : msg
          )
        );

        currentStreamingIdRef.current = null;
      } finally {
        setIsLoading(false);
        // Refresh from DB to sync state
        utils.chat.list.invalidate({ templateId });
      }
    },
    [
      isLoading,
      attachments,
      messages,
      templateId,
      templateState.currentTemplate,
      templateState.generationPhase,
      templateActions,
      createMessageMutation,
      updateMessageMutation,
      utils.chat.list,
    ]
  );

  // ==================== AUTO-SEND INITIAL PROMPT ====================
  useEffect(() => {
    if (
      !isOpen ||
      !initialPrompt ||
      hasAutoSentRef.current ||
      !templateId ||
      !templateState.currentTemplate ||
      !isInitialized
    ) {
      return;
    }

    // Send the initial prompt (hasAutoSentRef is still false, so imageUrls will be used)
    handleSend(initialPrompt);

    // Mark as sent AFTER calling handleSend
    hasAutoSentRef.current = true;
    onPromptConsumed?.();
  }, [
    isOpen,
    initialPrompt,
    templateId,
    templateState.currentTemplate,
    isInitialized,
    handleSend,
    onPromptConsumed,
  ]);

  // ==================== AUTO-SEND ERROR FIX PROMPT ====================
  useEffect(() => {
    if (
      !isOpen ||
      !errorFixPrompt ||
      !templateId ||
      !templateState.currentTemplate ||
      !isInitialized ||
      isLoading
    ) {
      return;
    }

    // Send the error fix prompt
    handleSend(errorFixPrompt);
    onErrorFixConsumed?.();
  }, [
    isOpen,
    errorFixPrompt,
    templateId,
    templateState.currentTemplate,
    isInitialized,
    isLoading,
    handleSend,
    onErrorFixConsumed,
  ]);

  // ==================== SET INITIAL INPUT (without auto-sending) ====================
  useEffect(() => {
    if (!isOpen || !initialInput) {
      return;
    }

    // Set the input value without auto-sending
    setInput(initialInput);
    onInputConsumed?.();
  }, [isOpen, initialInput, onInputConsumed]);

  // ==================== CANCEL GENERATION ====================
  const handleCancel = useCallback(async () => {
    templateActions.cancelGeneration();
    setIsLoading(false);

    // Update local message
    if (currentStreamingIdRef.current) {
      const msgId = currentStreamingIdRef.current;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === msgId
            ? { ...msg, content: "Generation cancelled.", isStreaming: false }
            : msg
        )
      );

      // Update DB with cancellation
      try {
        await updateMessageMutation.mutateAsync({
          id: msgId,
          content: "Generation cancelled.",
          isStreaming: false,
        });
      } catch (error) {
        console.error("Failed to update cancelled message:", error);
        // Non-critical error, don't show toast for cancellation updates
      }

      currentStreamingIdRef.current = null;
    }
  }, [templateActions, updateMessageMutation]);

  // ==================== RENDER ====================
  const showLoading = !isInitialized && isLoadingMessages;

  return (
    <div
      className={cn(
        "bg-card rounded-r-xl shadow-2xl border border-border overflow-hidden flex flex-col z-40 h-dvh",
        enableTransition && "transition-all duration-300 ease-in-out",
        isOpen
          ? "translate-x-0 opacity-100 w-80"
          : "-translate-x-full opacity-0 pointer-events-none w-0"
      )}
    >
      {/* Header */}
      <div className="p-2 border-b border-border flex justify-between items-center bg-muted">
        <div className="flex items-center gap-2">
          <MessageCircle className="size-3 text-primary" />
          <h3 className="font-semibold text-sm">Chat</h3>
        </div>
        <Button onClick={onClose} variant="outline" size="icon">
          <X size={16} />
        </Button>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        isLoading={showLoading}
        isOpen={isOpen}
        onImageClick={handleImageClick}
      />

      {/* Input */}
      <div
        className={cn(
          "border-t border-border transition-all duration-300 ease-in-out overflow-hidden",
          isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}
        style={{ transitionDelay: isOpen ? "150ms" : "0ms" }}
      >
        <div className="relative px-2 pb-2 pt-2">
          {attachments.map((attachment) => (
            <ImagePreviewBlob
              key={attachment.id}
              id={attachment.id}
              previewUrl={attachment.previewUrl}
              status={attachment.status}
              fileName={attachment.fileName}
              onRemove={handleAttachmentRemove}
            />
          ))}
          <Textarea
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!isLoading) handleSend(input);
              }
            }}
            onPaste={handlePaste}
            placeholder={isLoading ? "Generating..." : "Write your message..."}
            maxLength={1000}
            rows={3}
            style={{ minHeight: `${textareaMinHeight}px`, maxHeight: "180px" }}
            disabled={isLoading}
            className="focus:outline-none focus:ring-[0.2px] rounded-nodne rounded-2xl focus:ring-teal-500 focus:ring-offset-0 focus:ring-offset-transparent resize-none disabled:opacity-50 pr-10 pb-10"
          />

          {/* Attachment Controls */}
          <div className="absolute px-1 pr-5 left-2 bottom-2 w-full flex items-center gap-1 mt-1 mb-1  justify-between">
            <div className="flex items-center gap-1">
              <AttachmentPopover
                onUploadClick={handleUploadClick}
                onPasteUrlClick={handlePasteUrlClick}
                disabled={isLoading}
              />
              <FilterPopover
                disabled={isLoading}
                includeBrandGuide={includeBrandGuide}
                onBrandGuideChange={setIncludeBrandGuide}
              />
            </div>

            {isLoading ? (
              <Button
                onClick={handleCancel}
                size="icon"
                className="w-8 h-8"
                title="Cancel generation"
              >
                <Square size={14} />
              </Button>
            ) : (
              <Button
                onClick={() => handleSend(input)}
                size="icon"
                disabled={!input.trim()}
                className="w-8 h-8"
              >
                <Send size={14} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* URL Dialog */}
      <Dialog open={isUrlDialogOpen} onOpenChange={setIsUrlDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paste Image URL</DialogTitle>
            <DialogDescription>
              Enter the URL of an image you want to attach
            </DialogDescription>
          </DialogHeader>
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleUrlSubmit();
              }
            }}
            placeholder="https://example.com/image.jpg"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUrlDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUrlSubmit}>Add Image</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <ChatImagePreviewModal
        open={imagePreviewOpen}
        onOpenChange={setImagePreviewOpen}
        images={previewImages}
        initialIndex={previewInitialIndex}
      />
    </div>
  );
};

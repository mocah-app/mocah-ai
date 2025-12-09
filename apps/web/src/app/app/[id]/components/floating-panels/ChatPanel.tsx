import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MessageCircle, Send, Square, X } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTemplate, GENERATION_PHASE_MESSAGES } from "../providers/TemplateProvider";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import type { Message, GenerationResult } from "../chat-panel/MessageItem";
import { MessageList } from "../chat-panel/MessageList";

export const ChatPanel = ({
  isOpen,
  onClose,
  initialPrompt,
  initialImageUrls = [],
  onPromptConsumed,
  errorFixPrompt,
  onErrorFixConsumed,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  initialImageUrls?: string[];
  onPromptConsumed?: () => void;
  errorFixPrompt?: string;
  onErrorFixConsumed?: () => void;
}) => {
  const { state: templateState, actions: templateActions } = useTemplate();
  const params = useParams();
  const templateId = params.id as string;

  // ==================== LOCAL STATE (Source of truth during session) ====================
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Refs for tracking
  const hasAutoSentRef = useRef(false);
  const currentStreamingIdRef = useRef<string | null>(null);
  const latestStreamingProgressRef = useRef<GenerationResult | null>(null);
  const initialImageUrlsRef = useRef<string[]>(initialImageUrls);

  // ==================== tRPC for persistence ====================
  const utils = trpc.useUtils();
  const { data: persistedMessages, isLoading: isLoadingMessages } = trpc.chat.list.useQuery(
    { templateId },
    { enabled: !!templateId && !!templateState.currentTemplate }
  );

  const createMessageMutation = trpc.chat.create.useMutation();
  const updateMessageMutation = trpc.chat.update.useMutation();

  // ==================== TRANSITIONS ====================
  const [enableTransition, setEnableTransition] = useState(() => !initialPrompt);

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
          generationResult: msg.role === "assistant" ? (metadata as GenerationResult | null) ?? undefined : undefined,
          imageUrls: msg.role === "user" && metadata?.imageUrls ? metadata.imageUrls : undefined,
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
  }, [persistedMessages, isLoadingMessages, isInitialized, templateState.currentTemplate]);

  // ==================== STREAMING PHASE UPDATES ====================
  // Update the streaming message content based on generation phase
  useEffect(() => {
    if (
      templateState.isStreaming &&
      templateState.generationPhase !== "idle" &&
      currentStreamingIdRef.current
    ) {
      const phaseMessage = GENERATION_PHASE_MESSAGES[templateState.generationPhase];
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
        codePreview: code ? code.substring(0, 500) + (code.length > 500 ? '...' : '') : undefined,
      };
    }
  }, [templateState.streamingProgress]);

  // ==================== SEND MESSAGE ====================
  const handleSend = useCallback(
    async (promptText: string) => {
      const trimmedPrompt = promptText.trim();
      if (!trimmedPrompt || isLoading) return;

      setInput("");
      setIsLoading(true);

      // 1. Create local messages immediately (optimistic UI)
      const userMsgId = crypto.randomUUID();
      const assistantMsgId = crypto.randomUUID();

      // Check if this is the first message and we have initial image URLs
      const imageUrls = !hasAutoSentRef.current ? initialImageUrlsRef.current : undefined;

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
          ? templateActions.generateTemplateStream(trimmedPrompt, imageUrls)
          : templateActions.regenerateTemplate(trimmedPrompt);

        // 4. Define message persistence function
        const persistMessages = async () => {
          try {
            // Persist user message (with imageUrls in metadata if present)
            const dbUser = await createMessageMutation.mutateAsync({
              templateId,
              role: "user",
              content: trimmedPrompt,
              isStreaming: false,
              metadata: imageUrls && imageUrls.length > 0 ? { imageUrls } : undefined,
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
                  return { ...msg, id: dbUser.id, isPersisted: true, persistenceError: false };
                }
                if (msg.id === assistantMsgId) {
                  return { ...msg, id: dbAssistant.id, isPersisted: true, persistenceError: false };
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
              description: "Your messages are shown locally but weren't saved. The template was still created successfully.",
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
        const generationResult: GenerationResult = latestStreamingProgressRef.current ?? {};
        // Clear the ref for next generation
        latestStreamingProgressRef.current = null;

        // 8. Update local message to completion with generation result
        const finalContent = isNewTemplate
          ? "I've created a new template based on your request. You can now edit it in the canvas!"
          : "I've updated the template based on your request.";

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === currentStreamingIdRef.current || msg.id === assistantMsgId
              ? { ...msg, content: finalContent, isStreaming: false, generationResult }
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
            console.error("Failed to update message with final content:", error);
            toast.error("Failed to save final message", {
              description: "The message is visible but the final state wasn't saved.",
              duration: 4000,
            });
          }
        }

        currentStreamingIdRef.current = null;
      } catch (error) {
        console.error("Generation error:", error);

        // Update local message with error
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === currentStreamingIdRef.current || msg.id === assistantMsgId
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
      />

      {/* Input */}
      <div
        className={cn(
          "border-t border-border transition-all duration-300 ease-in-out",
          isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}
        style={{ transitionDelay: isOpen ? "150ms" : "0ms" }}
      >
        <div className="relative px-2 pb-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!isLoading) handleSend(input);
              }
            }}
            placeholder={isLoading ? "Generating..." : "Write your message..."}
            maxLength={1000}
            rows={3}
            disabled={isLoading}
            className="focus:outline-none focus:ring-[0.2px] rounded-none focus:ring-teal-500 focus:ring-offset-0 focus:ring-offset-transparent resize-none max-h-[180px] disabled:opacity-50"
          />
          {isLoading ? (
            <Button
              onClick={handleCancel}
              size="icon"
              // variant="destructive"
              className="absolute right-3 bottom-3 w-8 h-8"
              title="Cancel generation"
            >
              <Square size={14} />

            </Button>
          ) : (
            <Button
              onClick={() => handleSend(input)}
              size="icon"
              disabled={!input.trim()}
              className="absolute right-3 bottom-3 w-8 h-8"
            >
              <Send size={14} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

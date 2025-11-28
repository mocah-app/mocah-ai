import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Code2,
  FileText,
  Loader2,
  MessageCircle,
  Send,
  StopCircleIcon,
  Type,
  X,
} from "lucide-react";
import { useParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTemplate, GENERATION_PHASE_MESSAGES } from "../providers/TemplateProvider";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { trpc } from "@/utils/trpc";

interface GenerationResult {
  subject?: string;
  previewText?: string;
  codePreview?: string; // First ~500 chars
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  isPersisted?: boolean;
  generationResult?: GenerationResult; // Store the generated content with this message
}

export const ChatPanel = ({
  isOpen,
  onClose,
  initialPrompt,
  onPromptConsumed,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  onPromptConsumed?: () => void;
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
      const dbMessages: Message[] = persistedMessages.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        isStreaming: msg.isStreaming,
        isPersisted: true,
        generationResult: (msg.metadata as GenerationResult | null) ?? undefined,
      }));

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

      // Check for duplicates
      if (messages.some((m) => m.content === trimmedPrompt && m.role === "user")) {
        return;
      }

      setInput("");
      setIsLoading(true);

      // 1. Create local messages immediately (optimistic UI)
      const userMsgId = crypto.randomUUID();
      const assistantMsgId = crypto.randomUUID();

      const userMessage: Message = {
        id: userMsgId,
        role: "user",
        content: trimmedPrompt,
        isPersisted: false,
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
        // 3. Start generation immediately (don't wait for DB)
        const generationPromise = isNewTemplate
          ? templateActions.generateTemplateStream(trimmedPrompt)
          : templateActions.regenerateTemplate(trimmedPrompt);

        // 4. Persist messages to DB in background (fire-and-forget)
        const persistPromise = (async () => {
          try {
            // Wait a moment for template to be fully ready
            await new Promise((resolve) => setTimeout(resolve, 100));
            
            await createMessageMutation.mutateAsync({
              templateId,
              role: "user",
              content: trimmedPrompt,
              isStreaming: false,
            });

            const dbAssistant = await createMessageMutation.mutateAsync({
              templateId,
              role: "assistant",
              content: GENERATION_PHASE_MESSAGES.starting,
              isStreaming: true,
            });

            // Update local message with DB id for future updates
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId
                  ? { ...msg, id: dbAssistant.id, isPersisted: true }
                  : msg.id === userMsgId
                  ? { ...msg, isPersisted: true }
                  : msg
              )
            );
            currentStreamingIdRef.current = dbAssistant.id;

            return dbAssistant.id;
          } catch (error) {
            console.error("Background persist failed:", error);
            return null;
          }
        })();

        // 5. Wait for generation to complete
        await generationPromise;

        // 6. Capture the generation result from ref (not state - avoids stale closure)
        const generationResult: GenerationResult = latestStreamingProgressRef.current ?? {};
        // Clear the ref for next generation
        latestStreamingProgressRef.current = null;

        // 7. Update local message to completion with generation result
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

        // 8. Update DB in background with metadata
        const dbId = await persistPromise;
        if (dbId) {
          updateMessageMutation.mutate({
            id: dbId,
            content: finalContent,
            isStreaming: false,
            metadata: generationResult,
          });
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

    hasAutoSentRef.current = true;
    
    // Send the initial prompt
    handleSend(initialPrompt);
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

  // ==================== CANCEL GENERATION ====================
  const handleCancel = useCallback(() => {
    templateActions.cancelGeneration();
    setIsLoading(false);

    // Update local message
    if (currentStreamingIdRef.current) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === currentStreamingIdRef.current
            ? { ...msg, content: "Generation cancelled.", isStreaming: false }
            : msg
        )
      );

      // Update DB in background
      const msgId = currentStreamingIdRef.current;
      updateMessageMutation.mutate({
        id: msgId,
        content: "Generation cancelled.",
        isStreaming: false,
      });

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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {showLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={msg.id}>
              <div
                className={cn(
                  "flex gap-3 transition-all duration-300 ease-in-out",
                  msg.role === "user" ? "flex-row-reverse" : "",
                  isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                )}
                style={{ transitionDelay: isOpen ? `${index * 50}ms` : "0ms" }}
              >
                <div
                  className={cn(
                    "p-3 rounded-lg text-sm max-w-[80%]",
                    msg.role === "assistant"
                      ? "text-muted-foreground"
                      : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {msg.isStreaming ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{msg.content}</span>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>

              {/* Generation result - show live progress while streaming, or saved result after completion */}
              {msg.role === "assistant" && (
                <>
                  {/* While streaming: show live progress with full code */}
                  {msg.isStreaming && templateState.streamingProgress?.reactEmailCode && (
                    <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-bottom-4">
                      <StreamingProgress
                        progress={templateState.streamingProgress}
                        isComplete={false}
                      />
                    </div>
                  )}
                  {/* After completion: show saved generation result with code preview */}
                  {!msg.isStreaming && msg.generationResult?.codePreview && (
                    <div className="mt-3 space-y-2">
                      <StreamingProgress
                        progress={{
                          subject: msg.generationResult.subject,
                          previewText: msg.generationResult.previewText,
                          reactEmailCode: msg.generationResult.codePreview, // Use preview for display
                        }}
                        isComplete={true}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>

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
              variant="destructive"
              className="absolute right-3 bottom-3 w-8 h-8"
              title="Cancel generation"
            >
              <StopCircleIcon size={14} />
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

// ==================== STREAMING PROGRESS COMPONENT ====================
function StreamingProgress({
  progress,
  isComplete = false,
}: {
  progress: {
    subject?: string;
    previewText?: string;
    reactEmailCode?: string;
    styleType?: string;
  };
  isComplete?: boolean;
}) {
  const sections = [
    {
      key: "subject",
      label: "Subject Line",
      icon: Type,
      value: progress.subject,
      color: "text-blue-400",
    },
    {
      key: "previewText",
      label: "Preview Text",
      icon: FileText,
      value: progress.previewText,
      color: "text-purple-400",
    },
    {
      key: "reactEmailCode",
      label: "React Email Code",
      icon: Code2,
      value: progress.reactEmailCode,
      color: "text-green-400",
      isCode: true,
    },
  ];

  const completedSections = sections.filter((s) => s.value);
  const currentSection = completedSections[completedSections.length - 1];

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {sections.map((section) => {
          const isCompleted = !!section.value;
          const isCurrent = currentSection?.key === section.key;
          const Icon = section.icon;

          if (!isCompleted) return null;

          return (
            <div
              key={section.key}
              className={`space-y-2 transition-all duration-300 ${
                isCurrent && !isComplete ? "animate-in slide-in-from-bottom-2" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`h-3.5 w-3.5 ${section.color}`} />
                <span className="text-xs font-medium text-muted-foreground">
                  {section.label}
                </span>
                {/* Show bouncing dots only while streaming, checkmark when complete */}
                {isCurrent && !isComplete && (
                  <div className="flex gap-1 ml-auto">
                    {[0, 150, 300].map((delay) => (
                      <div
                        key={delay}
                        className="w-1 h-1 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                )}
                {isComplete && (
                  <span className="text-xs text-green-500 ml-auto">✓</span>
                )}
              </div>

              {section.isCode && section.value ? (
                <CodePreview code={section.value} />
              ) : (
                <div className="bg-card/50 rounded-lg p-3 border border-border/50">
                  <p className="text-sm leading-relaxed">{section.value}</p>
                </div>
              )}

              {section.key === "reactEmailCode" && section.value && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>{section.value.split("\n").length} lines</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                  <span>{(section.value.length / 1024).toFixed(1)} KB</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== CODE PREVIEW COMPONENT ====================
function CodePreview({ code }: { code: string }) {
  const lines = code.split("\n");
  const previewLines = lines.slice(0, 12);
  const hasMore = lines.length > 12;

  return (
    <div className="relative">
      <div className="bg-[#1e1e1e] rounded-md overflow-hidden border border-gray-800">
        <SyntaxHighlighter
          language="tsx"
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: "12px",
            background: "#1e1e1e",
            fontSize: "12px",
            lineHeight: "1.5",
          }}
          showLineNumbers={true}
          lineNumberStyle={{
            minWidth: "2.5em",
            paddingRight: "1em",
            color: "#858585",
            textAlign: "right",
            userSelect: "none",
          }}
          wrapLines={true}
        >
          {previewLines.join("\n")}
        </SyntaxHighlighter>
        {hasMore && (
          <div className="px-3 py-2 text-xs text-gray-500 font-mono border-t border-gray-800">
            ... {lines.length - 12} more lines
          </div>
        )}
      </div>
    </div>
  );
}

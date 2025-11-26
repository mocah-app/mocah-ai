import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Code2,
  FileText,
  Loader2,
  MessageCircle,
  Palette,
  Send,
  Sparkles,
  StopCircleIcon,
  Type,
  X,
} from "lucide-react";
import { useParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTemplate } from "../providers/TemplateProvider";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
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

  // Track if this is the first time opening with an initial prompt
  // If so, we skip the transition to make it appear instantly
  const [enableTransition, setEnableTransition] = React.useState(
    () => !initialPrompt
  );

  // Use layoutEffect + RAF for frame-synchronized transition enabling
  React.useLayoutEffect(() => {
    // If we started without transition (had initialPrompt), enable it after paint
    if (!enableTransition) {
      // Double RAF ensures the transition class is added after the initial render is painted
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setEnableTransition(true);
        });
      });
    }
  }, [enableTransition]);

  // Check if template is a skeleton (needs generation)
  const isNewTemplate = React.useMemo(() => {
    if (!templateState.currentTemplate) return true;
    // Template is new/skeleton if it doesn't have React Email code
    return !templateState.currentTemplate.reactEmailCode;
  }, [templateState.currentTemplate]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const hasAutoSentRef = useRef(false);

  // Initialize greeting message based on template context
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "1",
          role: "assistant",
          content: isNewTemplate
            ? 'Hi! I can help you create your email template. Try asking me to "Create a Black Friday sale template".'
            : "Hi! I can help you edit this email template. Ask me to make changes or regenerate sections.",
        },
      ]);
    }
  }, [isNewTemplate, messages.length]);

  const handleSendWithPrompt = useCallback(
    async (promptText: string) => {
      if (!promptText.trim() || isLoading) {
        console.log("handleSendWithPrompt: Invalid prompt or already loading", {
          promptText,
          isLoading,
        });
        return;
      }

      console.log("handleSendWithPrompt: Starting to send", promptText);

      const newMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: promptText,
      };

      // Use functional update to avoid dependency on messages
      setMessages((prev) => {
        // Check for duplicates using current state
        if (prev.some((m) => m.content === promptText && m.role === "user")) {
          console.log(
            "handleSendWithPrompt: Duplicate message found, skipping"
          );
          return prev;
        }
        return [...prev, newMessage];
      });

      setInput("");
      setIsLoading(true);

      // Add streaming message placeholder
      const streamingMessageId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        {
          id: streamingMessageId,
          role: "assistant",
          content: "Generating your template...",
          isStreaming: true,
        },
      ]);

      try {
        // Check if we're generating for the first time (skeleton template) or updating
        const isGeneratingFirstTime =
          !templateState.currentTemplate?.reactEmailCode;

        if (isGeneratingFirstTime) {
          // Use streaming for first-time generation
          console.log(
            "Calling generateTemplateStream with prompt:",
            promptText
          );
          await templateActions.generateTemplateStream(promptText);

          // Update message when streaming completes
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === streamingMessageId
                ? {
                    ...msg,
                    content:
                      "I've created a new template based on your request. You can now edit it in the canvas!",
                    isStreaming: false,
                  }
                : msg
            )
          );
        } else {
          // Use regenerate for existing templates (non-streaming for now)
          await templateActions.regenerateTemplate(promptText);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === streamingMessageId
                ? {
                    ...msg,
                    content: "I've updated the template based on your request.",
                    isStreaming: false,
                  }
                : msg
            )
          );
        }
      } catch (error) {
        console.error("Chat error:", error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamingMessageId
              ? {
                  ...msg,
                  content: "Sorry, I encountered an error. Please try again.",
                  isStreaming: false,
                }
              : msg
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [templateId, templateState.currentTemplate, templateActions, isLoading]
  );

  // Auto-send initial prompt if provided
  useEffect(() => {
    // Only auto-send when panel is open AND we have a prompt AND haven't sent yet
    if (!isOpen || !initialPrompt || hasAutoSentRef.current) {
      return;
    }

    console.log("Auto-send triggered:", {
      isOpen,
      initialPrompt,
      hasAutoSent: hasAutoSentRef.current,
    });

    // Mark as sent immediately to prevent double-send
    hasAutoSentRef.current = true;
    console.log("Sending prompt:", initialPrompt);

    // Trigger send after a small delay to ensure UI is ready
    const timeoutId = setTimeout(async () => {
      console.log("Timeout fired, calling handleSendWithPrompt");
      await handleSendWithPrompt(initialPrompt);
      // Clear the prompt from context after it's been sent
      onPromptConsumed?.();
    }, 500);

    return () => {
      console.log("Cleaning up auto-send timeout");
      clearTimeout(timeoutId);
    };
  }, [isOpen, initialPrompt, handleSendWithPrompt, onPromptConsumed]);

  const handleSend = async () => {
    await handleSendWithPrompt(input);
  };

  return (
    <div
      className={cn(
        "bg-card rounded-r-xl shadow-2xl border border-border overflow-hidden flex flex-col z-40 h-dvh",
        // Skip transition on first render if opening with initialPrompt
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
        {messages.map((msg, index) => (
          <div key={msg.id}>
            <div
              className={cn(
                "flex gap-3 transition-all duration-300 ease-in-out",
                msg.role === "user" ? "flex-row-reverse" : "",
                isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              )}
              style={{
                transitionDelay: isOpen ? `${index * 50}ms` : "0ms",
              }}
            >
              <div
                className={cn(
                  "p-3 rounded-lg text-sm max-w-[80%]",
                  msg.role === "assistant"
                    ? "text-muted-foreground"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                {msg.isStreaming && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{msg.content}</span>
                  </div>
                )}
                {!msg.isStreaming && msg.content}
              </div>
            </div>

            {/* Show streaming progress for assistant messages */}
            {msg.isStreaming &&
              msg.role === "assistant" &&
              templateState.isStreaming &&
              templateState.streamingProgress && (
                <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-bottom-4">
                  <StreamingProgress
                    progress={templateState.streamingProgress}
                  />
                </div>
              )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div
        className={cn(
          "border-t border-border transition-all duration-300 ease-in-out",
          isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}
        style={{
          transitionDelay: isOpen ? "150ms" : "0ms",
        }}
      >
        <div className="relative px-2 pb-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isLoading ? "Generating..." : "Write your message..."}
            maxLength={1000}
            rows={3}
            disabled={isLoading}
            className="focus:outline-none focus:ring-[0.2px] rounded-none focus:ring-teal-500 focus:ring-offset-0 focus:ring-offset-transparent resize-none max-h-[180px] disabled:opacity-50"
          />
          <Button
            onClick={handleSend}
            size="icon"
            disabled={isLoading || !input.trim()}
            className="absolute right-3 bottom-3 w-8 h-8"
          >
            {isLoading ? <StopCircleIcon /> : <Send size={14} />}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Code preview with proper syntax highlighting
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

// Main streaming progress component
function StreamingProgress({
  progress,
}: {
  progress: {
    subject?: string;
    previewText?: string;
    reactEmailCode?: string;
    styleType?: string;
  };
}) {
  const [dots, setDots] = useState("");

  // Animated dots effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

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
    <div className="">
      <div className="p-4 space-y-4">
        {/* Sections */}
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
                  isCurrent ? "animate-in slide-in-from-bottom-2" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`h-3.5 w-3.5 ${section.color}`} />
                  <span className="text-xs font-medium text-muted-foreground">
                    {section.label}
                  </span>
                  {isCurrent && (
                    <div className="flex gap-1 ml-auto">
                      <div
                        className="w-1 h-1 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="w-1 h-1 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-1 h-1 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
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
    </div>
  );
}

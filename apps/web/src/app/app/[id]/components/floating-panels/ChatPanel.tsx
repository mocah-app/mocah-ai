import React, { useState, useEffect, useCallback, useRef } from "react";
import { Send, X, Bot, User, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTemplate } from "../providers/TemplateProvider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useParams } from "next/navigation";

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
  const isNewTemplate = templateId === "new" || templateId === "new-draft";

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

  const handleSendWithPrompt = useCallback(async (promptText: string) => {
    if (!promptText.trim() || isLoading) {
      console.log('handleSendWithPrompt: Invalid prompt or already loading', { promptText, isLoading });
      return;
    }

    console.log('handleSendWithPrompt: Starting to send', promptText);

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: promptText,
    };
    
    // Use functional update to avoid dependency on messages
    setMessages((prev) => {
      // Check for duplicates using current state
      if (prev.some((m) => m.content === promptText && m.role === "user")) {
        console.log('handleSendWithPrompt: Duplicate message found, skipping');
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
      // Check if we're creating a new template or updating existing one
      const isCreatingNew =
        templateId === "new" ||
        templateId === "new-draft" ||
        !templateState.currentTemplate;

      if (isCreatingNew) {
        // Use streaming for new templates
        console.log('Calling generateTemplateStream with prompt:', promptText);
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
  }, [templateId, templateState.currentTemplate, templateActions, isLoading]);

  // Auto-send initial prompt if provided
  useEffect(() => {
    // Only auto-send when panel is open AND we have a prompt AND haven't sent yet
    if (!isOpen || !initialPrompt || hasAutoSentRef.current) {
      return;
    }

    console.log('Auto-send triggered:', { isOpen, initialPrompt, hasAutoSent: hasAutoSentRef.current });

    // Mark as sent immediately to prevent double-send
    hasAutoSentRef.current = true;
    console.log('Sending prompt:', initialPrompt);
    
    // Trigger send after a small delay to ensure UI is ready
    const timeoutId = setTimeout(async () => {
      console.log('Timeout fired, calling handleSendWithPrompt');
      await handleSendWithPrompt(initialPrompt);
      // Clear the prompt from context after it's been sent
      onPromptConsumed?.();
    }, 500);

    return () => {
      console.log('Cleaning up auto-send timeout');
      clearTimeout(timeoutId);
    };
  }, [isOpen, initialPrompt, handleSendWithPrompt, onPromptConsumed]);

  const handleSend = async () => {
    await handleSendWithPrompt(input);
  };

  return (
    <div
      className={cn(
        "absolute top-0 left-14 w-96 bg-background rounded-r-xl shadow-2xl border border-border overflow-hidden flex flex-col z-40 h-dvh",
        "transition-all duration-300 ease-in-out",
        isOpen
          ? "translate-x-0 opacity-100"
          : "-translate-x-full opacity-0 pointer-events-none"
      )}
    >
      {/* Header */}
      <div className="p-2 border-b border-border flex justify-between items-center bg-muted">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Mocah AI
          </h3>
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
        <div className="relative">
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
            className="w-full bg-card rounded-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus-visible:border-none outline-none resize-none max-h-[180px] disabled:opacity-50"
          />
          <Button
            onClick={handleSend}
            size="icon"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 bottom-0 -translate-y-1/4"
          >
            {isLoading ? (
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <Send size={14} />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Component to show streaming progress
function StreamingProgress({
  progress,
}: {
  progress: {
    subject?: string;
    previewText?: string;
    sections?: Array<{
      type?: string;
      content?: {
        headline?: string;
        subheadline?: string;
        body?: string;
      };
    }>;
  };
}) {
  return (
    <Card className="bg-muted/30 border-primary/20">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2 text-xs text-primary">
          <Sparkles className="h-3 w-3" />
          <span className="font-medium">Generating...</span>
        </div>

        {progress.subject && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Subject:</p>
            <p className="text-sm font-medium">{progress.subject}</p>
          </div>
        )}

        {progress.previewText && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Preview:</p>
            <p className="text-xs">{progress.previewText}</p>
          </div>
        )}

        {progress.sections && progress.sections.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Sections: {progress.sections.length}
            </p>
            <div className="space-y-1">
              {progress.sections.slice(-2).map((section, idx) => (
                <div key={idx} className="text-xs bg-background/50 p-2 rounded">
                  <span className="text-muted-foreground uppercase">
                    {section.type}
                  </span>
                  {section.content?.headline && (
                    <p className="font-medium truncate">
                      {section.content.headline}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

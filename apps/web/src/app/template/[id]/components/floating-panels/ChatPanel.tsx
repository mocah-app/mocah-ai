import React, { useState } from "react";
import { Send, X, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTemplate } from "../providers/TemplateProvider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export const ChatPanel = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { state: templateState, actions: templateActions } = useTemplate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        'Hi! I can help you design your email. Try asking me to "Create a Black Friday sale template".',
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, newMessage]);
    const userPrompt = input;
    setInput("");
    setIsLoading(true);

    try {
      // If no template exists, generate a new one
      // Otherwise, regenerate the existing template
      if (!templateState.currentTemplate) {
        await templateActions.generateTemplate(userPrompt);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content:
              "I've created a new template based on your request. You can now edit it in the canvas!",
          },
        ]);
      } else {
        await templateActions.regenerateTemplate(userPrompt);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "I've updated the template based on your request.",
          },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
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
          <div
            key={msg.id}
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
              {msg.content}
            </div>
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

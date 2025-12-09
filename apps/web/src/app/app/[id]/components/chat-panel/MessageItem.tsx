import { cn } from "@/lib/utils";
import Loader from "@/components/loader";
import { useTemplate } from "../providers/TemplateProvider";
import { StreamingProgress } from "./StreamingProgress";
import Image from "next/image";

export interface GenerationResult {
  subject?: string;
  previewText?: string;
  codePreview?: string; // First ~500 chars
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  isPersisted?: boolean;
  persistenceError?: boolean; // Indicates message failed to save to DB
  generationResult?: GenerationResult; // Store the generated content with this message
  imageUrls?: string[]; // Reference images attached to the message
}

interface MessageItemProps {
  message: Message;
  index: number;
  isOpen: boolean;
}

export const MessageItem = ({ message, index, isOpen }: MessageItemProps) => {
  const { state: templateState } = useTemplate();

  return (
    <div>
      <div
        className={cn(
          "flex gap-3 transition-all duration-300 ease-in-out",
          message.role === "user" ? "flex-row-reverse" : "",
          isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}
        style={{ transitionDelay: isOpen ? `${index * 50}ms` : "0ms" }}
      >
        <div
          className={cn(
            "p-3 rounded-lg text-sm max-w-[80%] whitespace-pre-wrap wrap-break-word relative",
            message.role === "assistant"
              ? "text-muted-foreground"
              : "bg-secondary text-secondary-foreground max-h-80 overflow-y-auto",
            message.persistenceError && "border-2 border-amber-500/50"
          )}
        >
          {message.isStreaming ? (
            <div className="flex items-center gap-2">
              <Loader />
              <span>{message.content}</span>
            </div>
          ) : (
            <>
              {message.content}
              
              {/* Show attached images for user messages */}
              {message.role === "user" && message.imageUrls && message.imageUrls.length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {message.imageUrls.map((url, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                      <Image
                        src={url}
                        alt={`Attachment ${idx + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
              )}
              
              {message.persistenceError && (
                <div className="mt-2 text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1">
                  <span>⚠️</span>
                  <span>Not saved to database</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Generation result - show live progress while streaming, or saved result after completion */}
      {message.role === "assistant" && (
        <>
          {/* While streaming: show live progress with full code */}
          {message.isStreaming && templateState.streamingProgress?.reactEmailCode && (
            <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-bottom-4">
              <StreamingProgress
                progress={templateState.streamingProgress}
                isComplete={false}
              />
            </div>
          )}
          {/* After completion: show saved generation result with code preview */}
          {!message.isStreaming && message.generationResult?.codePreview && (
            <div className="mt-3 space-y-2">
              <StreamingProgress
                progress={{
                  subject: message.generationResult.subject,
                  previewText: message.generationResult.previewText,
                  reactEmailCode: message.generationResult.codePreview, // Use preview for display
                }}
                isComplete={true}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};


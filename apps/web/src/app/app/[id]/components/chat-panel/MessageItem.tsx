import { cn } from "@/lib/utils";
import Loader from "@/components/loader";
import { useTemplate } from "../providers/TemplateProvider";
import { StreamingProgress } from "./StreamingProgress";
import { StreamingReasoningPanel } from "./StreamingReasoningPanel";
import Image from "next/image";

export interface GenerationResult {
  subject?: string;
  previewText?: string;
  codePreview?: string; // First ~500 chars
}

export interface ReasoningData {
  text: string;
  timestamp: number;
}

export interface ToolCallData {
  toolName: string;
  timestamp: number;
  args?: any;
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
  reasoning?: ReasoningData[]; // AI reasoning steps (V2 only) - persisted
  toolCalls?: ToolCallData[]; // Tool calls made (V2 only) - persisted
  // Live V2 streaming data (only during streaming)
  v2Reasoning?: string;
  v2ToolCalls?: Array<{ name: string; status: "pending" | "complete" }>;
}

interface MessageItemProps {
  message: Message;
  index: number;
  isOpen: boolean;
  onImageClick?: (imageUrls: string[], clickedIndex: number) => void;
}

export const MessageItem = ({
  message,
  index,
  isOpen,
  onImageClick,
}: MessageItemProps) => {
  const { state: templateState } = useTemplate();

  return (
    <div>
      {/* Show attached images for user messages - above the message bubble */}
      {message.role === "user" &&
        message.imageUrls &&
        message.imageUrls.length > 0 && (
          <div className="flex justify-end mb-2">
            <MessageImageList
              imageUrls={message.imageUrls}
              onImageClick={onImageClick}
            />
          </div>
        )}

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
            "p-3 rounded-lg text-sm max-w-[95%] whitespace-pre-wrap wrap-break-word relative",
            message.role === "assistant"
              ? "text-muted-foreground"
              : "bg-secondary text-secondary-foreground max-h-80 overflow-y-auto",
            message.persistenceError && "border-2 border-amber-500/50"
          )}
        >
          {message.isStreaming ? (
            <div className="flex items-end gap-2">
              <Loader />
              <span>{message.content}</span>
            </div>
          ) : (
            <>
              {message.content}

              {/* Show reasoning if available (V2 feature) */}
              {message.reasoning && message.reasoning.length > 0 && (
                <details className="mt-3 text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                    🧠 Show AI Reasoning ({message.reasoning.length} steps)
                  </summary>
                  <div className="mt-2 space-y-2 pl-4 border-l-2 border-muted">
                    {message.reasoning.map((step, idx) => (
                      <div key={idx} className="text-muted-foreground">
                        <div className="font-mono text-[10px] text-muted-foreground/60">
                          Step {idx + 1}
                        </div>
                        <div className="mt-1">{step.text}</div>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Show tool calls if available (V2 feature) */}
              {message.toolCalls && message.toolCalls.length > 0 && (
                <details className="mt-3 text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                    🔧 Tool Calls ({message.toolCalls.length})
                  </summary>
                  <div className="mt-2 space-y-1.5 pl-4 border-l-2 border-muted">
                    {message.toolCalls.map((call, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-green-500">✓</span>
                        <span className="font-mono text-[11px]">{call.toolName}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {message.persistenceError && (
                <div className="mt-2 text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1">
                  <span>⚠️</span>
                  <span>Message not saved</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* V2 Reasoning Panel - show when we have streaming V2 data */}
      {message.role === "assistant" &&
        (message.v2Reasoning || (message.v2ToolCalls && message.v2ToolCalls.length > 0)) && (
          <StreamingReasoningPanel
            reasoning={message.v2Reasoning || ""}
            toolCalls={message.v2ToolCalls || []}
            isStreaming={message.isStreaming || false}
          />
        )}

      {/* Generation result - show live progress while streaming, or saved result after completion */}
      {message.role === "assistant" && (
        <>
          {/* While streaming: show live progress with full code */}
          {message.isStreaming &&
            templateState.streamingProgress?.reactEmailCode && (
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

interface MessageImageListProps {
  imageUrls: string[];
  onImageClick?: (imageUrls: string[], clickedIndex: number) => void;
}

const MessageImageList = ({
  imageUrls,
  onImageClick,
}: MessageImageListProps) => {
  return (
    <div className="flex gap-2 flex-wrap">
      {imageUrls.map((url, idx) => (
        <button
          key={idx}
          onClick={() => onImageClick?.(imageUrls, idx)}
          className="relative w-20 h-20 rounded-lg overflow-hidden border border-border hover:border-primary transition-all hover:scale-105 cursor-pointer group"
          title="Click to preview"
        >
          <Image
            src={url}
            alt={`Attachment ${idx + 1}`}
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
        </button>
      ))}
    </div>
  );
};

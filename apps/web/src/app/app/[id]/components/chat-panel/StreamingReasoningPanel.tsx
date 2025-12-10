"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Brain, Wrench, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface StreamingReasoningPanelProps {
  reasoning: string;
  toolCalls: Array<{ name: string; status: "pending" | "complete" }>;
  isStreaming: boolean;
}

export function StreamingReasoningPanel({
  reasoning,
  toolCalls,
  isStreaming,
}: StreamingReasoningPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const reasoningRef = useRef<HTMLDivElement>(null);

  // Auto-scroll reasoning to bottom as new content streams
  useEffect(() => {
    if (reasoningRef.current && reasoning) {
      reasoningRef.current.scrollTop = reasoningRef.current.scrollHeight;
    }
  }, [reasoning]);

  // Don't render if no content
  const hasContent = reasoning || toolCalls.length > 0;
  if (!hasContent) return null;

  return (
    <div className="mt-2 rounded-lg border border-border/50 bg-muted/20 overflow-hidden text-xs">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between px-2.5 py-1.5 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              {isStreaming ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Brain className="h-3 w-3 text-purple-500" />
              )}
              <span className="text-[11px]">
                {isStreaming ? "Thinking..." : "AI Reasoning"}
              </span>
              {toolCalls.length > 0 && (
                <span className="text-[10px] text-muted-foreground/60">
                  • {toolCalls.length} tool{toolCalls.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <ChevronDown
              className={cn(
                "h-3 w-3 text-muted-foreground/60 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-border/30">
            {/* Tool Calls - compact list */}
            {toolCalls.length > 0 && (
              <div className="px-2.5 py-1.5 border-b border-border/30 flex flex-wrap gap-x-3 gap-y-1">
                {toolCalls.map((tool, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground"
                  >
                    {tool.status === "pending" ? (
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    ) : (
                      <span className="text-green-500">✓</span>
                    )}
                    <span className="font-mono">{tool.name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Reasoning Text */}
            {reasoning && (
              <div
                ref={reasoningRef}
                className="px-2.5 py-2 max-h-32 overflow-y-auto text-[11px] text-muted-foreground/80 leading-relaxed"
                style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(var(--muted)) transparent" }}
              >
                <pre className="whitespace-pre-wrap font-sans">{reasoning}</pre>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

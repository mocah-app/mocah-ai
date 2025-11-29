import Loader from "@/components/loader";
import { MessageItem } from "./MessageItem";
import type { Message } from "./MessageItem";
import { useEffect, useRef } from "react";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  isOpen: boolean;
}

export const MessageList = ({ messages, isLoading, isOpen }: MessageListProps) => {
  const showLoading = isLoading;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {showLoading ? (
        <div className="flex items-center justify-center h-full">
          <Loader />
        </div>
      ) : (
        <>
          {messages.map((msg, index) => (
            <MessageItem key={msg.id} message={msg} index={index} isOpen={isOpen} />
          ))}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
};


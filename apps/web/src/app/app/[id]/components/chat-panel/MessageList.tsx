import Loader from "@/components/loader";
import { MessageItem } from "./MessageItem";
import type { Message } from "./MessageItem";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  isOpen: boolean;
}

export const MessageList = ({ messages, isLoading, isOpen }: MessageListProps) => {
  const showLoading = isLoading;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {showLoading ? (
        <div className="flex items-center justify-center h-full">
          <Loader />
        </div>
      ) : (
        messages.map((msg, index) => (
          <MessageItem key={msg.id} message={msg} index={index} isOpen={isOpen} />
        ))
      )}
    </div>
  );
};


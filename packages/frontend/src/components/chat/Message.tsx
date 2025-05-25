import React, { useMemo } from "react";
import { Message as MessageType } from "../../types";
import { MarkdownRenderer } from "../common/MarkdownRenderer";

interface MessageProps {
  message: MessageType;
}

export const MessageComponent: React.FC<MessageProps> = ({ message }) => {
  // Filter out CODE_ARTIFACT tags and their content for AI messages
  const cleanedContent = useMemo(() => {
    if (message.sender !== "ai") return message.content;

    // Remove the CODE_ARTIFACT tags and their content
    let content = message.content;
    const regex = /<CODE_ARTIFACT>[\s\S]*?<\/CODE_ARTIFACT>/g;
    content = content.replace(regex, "");

    // Clean up any extra newlines that might be left
    content = content.replace(/\n{3,}/g, "\n\n");
    return content.trim();
  }, [message.content, message.sender]);

  return (
    <div
      className={`max-w-[80%] p-4 rounded-xl relative animate-[fadeIn_0.3s_ease-in-out] ${
        message.sender === "user"
          ? "self-end bg-blue-600 text-white rounded-br-sm"
          : "self-start bg-white/10 border border-white/20 rounded-bl-sm"
      }`}
      data-component-name="MessageComponent"
    >
      <div className="whitespace-pre-wrap leading-6 break-words">
        {message.sender === "ai" ? (
          <MarkdownRenderer content={cleanedContent} />
        ) : (
          message.content
        )}
      </div>
      <div className="text-xs text-white/60 mt-2 text-right">
        {message.timestamp.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    </div>
  );
};

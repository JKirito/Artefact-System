import React, { useMemo } from "react";
import { Message as MessageType } from "../../types";
import { MarkdownRenderer } from "../common/MarkdownRenderer";
import { ThinkingIndicator } from "./ThinkingIndicator";

interface MessageProps {
  message: MessageType;
}

export const MessageComponent: React.FC<MessageProps> = ({ message }) => {
  // Use parsed content if available, otherwise fall back to cleaning content manually
  const displayContent = useMemo(() => {
    if (message.sender !== "ai") return message.content;

    // If we have parsed content, use it
    if (message.parsedContent) {
      return message.parsedContent.displayContent;
    }

    // Fallback: Remove the CODE_ARTIFACT tags and their content manually
    let content = message.content;
    const regex = /<CODE_ARTIFACT>[\s\S]*?<\/CODE_ARTIFACT>/g;
    content = content.replace(regex, "");

    // Also remove think tags for backward compatibility
    const thinkRegex = /<think>[\s\S]*?<\/think>/g;
    content = content.replace(thinkRegex, "");

    // Clean up any extra newlines that might be left
    content = content.replace(/\n{3,}/g, "\n\n");
    return content.trim();
  }, [message.content, message.sender, message.parsedContent]);

  return (
    <div className="flex flex-col gap-2">
      {/* Show thinking indicator for AI messages that have thinking content */}
      {message.sender === "ai" && message.parsedContent?.thinkingContent && (
        <div className="max-w-[80%] self-start">
          <ThinkingIndicator
            isActive={false}
            thinkingContent={message.parsedContent.thinkingContent}
            showContent={true}
          />
        </div>
      )}

      {/* Main message content */}
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
            <MarkdownRenderer content={displayContent} />
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
    </div>
  );
};

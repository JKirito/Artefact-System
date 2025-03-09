import React, { useMemo } from "react";
import { Message as MessageType } from "../../types";
import { MarkdownRenderer } from "../common/MarkdownRenderer";
import "./Message.css";

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
    content = content.replace(regex, '');
    
    // Clean up any extra newlines that might be left
    content = content.replace(/\n{3,}/g, '\n\n');
    return content.trim();
  }, [message.content, message.sender]);

  return (
    <div
      className={`message ${
        message.sender === "user" ? "user-message" : "ai-message"
      }`}
      data-component-name="MessageComponent"
    >
      <div className="message-content">
        {message.sender === "ai" ? (
          <MarkdownRenderer content={cleanedContent} />
        ) : (
          message.content
        )}
      </div>
      <div className="message-timestamp">
        {message.timestamp.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    </div>
  );
};

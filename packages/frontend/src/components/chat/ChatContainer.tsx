import React, { useRef, useEffect } from "react";
import { Message as MessageType } from "../../types";
import { MessageComponent } from "./Message";
import { ChatInput } from "./ChatInput";
import { MarkdownRenderer } from "../common/MarkdownRenderer";
import "./ChatContainer.css";

interface ChatContainerProps {
  messages: MessageType[];
  currentResponse: string;
  isTyping: boolean;
  error: string;
  onSendMessage: (message: string) => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  currentResponse,
  isTyping,
  error,
  onSendMessage,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentResponse]);

  return (
    <div className="chat-container">
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>Send a message to start chatting with the AI</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageComponent key={msg.id} message={msg} />
          ))
        )}

        {currentResponse && (
          <div className="message ai-message">
            <div className="message-content markdown-content">
              <MarkdownRenderer content={currentResponse} />
            </div>
          </div>
        )}

        {isTyping && (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSendMessage={onSendMessage} isDisabled={isTyping} />

      {error && <div className="error">{error}</div>}
    </div>
  );
};

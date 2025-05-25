import React, { useRef, useEffect } from "react";
import { Message as MessageType } from "../../types";
import { MessageComponent } from "./Message";
import { ChatInput } from "./ChatInput";
import { MarkdownRenderer } from "../common/MarkdownRenderer";
import { ThinkingIndicator } from "./ThinkingIndicator";

interface ChatContainerProps {
  messages: MessageType[];
  currentResponse: string;
  isTyping: boolean;
  error: string;
  isThinking: boolean;
  currentThinkingContent: string;
  onSendMessage: (message: string) => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  currentResponse,
  isTyping,
  error,
  isThinking,
  currentThinkingContent,
  onSendMessage,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentResponse]);

  return (
    <div className="w-full max-w-full h-screen flex flex-col bg-white/5 rounded-none border-none overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 scroll-smooth">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/50 italic text-center">
            <p>Send a message to start chatting with the AI</p>
          </div>
        ) : (
          messages.map((msg) => <MessageComponent key={msg.id} message={msg} />)
        )}

        {/* Thinking indicator - shows when AI is thinking */}
        {isThinking && (
          <div className="self-start max-w-[80%]">
            <ThinkingIndicator
              isActive={isThinking}
              thinkingContent={currentThinkingContent}
              showContent={true}
            />
          </div>
        )}

        {/* Current response - shows the actual response content */}
        {currentResponse && (
          <div className="max-w-[80%] p-4 rounded-xl relative animate-[fadeIn_0.3s_ease-in-out] self-start bg-white/10 border border-white/20 rounded-bl-sm">
            <div className="whitespace-pre-wrap leading-6 break-words">
              <MarkdownRenderer content={currentResponse} />
            </div>
          </div>
        )}

        {/* Regular typing indicator - shows when not thinking but still processing */}
        {isTyping && !isThinking && !currentResponse && (
          <div className="self-start bg-white/10 rounded-xl p-4 flex items-center gap-1">
            <span className="w-2 h-2 bg-white/50 rounded-full inline-block animate-[bounce_1.5s_infinite_ease-in-out] [animation-delay:0s]"></span>
            <span className="w-2 h-2 bg-white/50 rounded-full inline-block animate-[bounce_1.5s_infinite_ease-in-out] [animation-delay:0.2s]"></span>
            <span className="w-2 h-2 bg-white/50 rounded-full inline-block animate-[bounce_1.5s_infinite_ease-in-out] [animation-delay:0.4s] mr-0"></span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSendMessage={onSendMessage} isDisabled={isTyping} />

      {error && (
        <div className="text-red-400 bg-red-400/10 border border-red-400/30 p-3 rounded-lg mt-2 text-center text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

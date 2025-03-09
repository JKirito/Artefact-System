import React, { useState, FormEvent } from "react";
import { PromptType } from "../../hooks/useSocket";
import "./ChatInput.css";

interface ChatInputProps {
  onSendMessage: (message: string, promptType?: PromptType) => void;
  isDisabled: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isDisabled }) => {
  const [message, setMessage] = useState("");
  const [promptType, setPromptType] = useState<PromptType>(PromptType.DEFAULT);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    onSendMessage(message, promptType);
    setMessage(""); // Clear input field
  };

  return (
    <form onSubmit={handleSubmit} className="message-form">
      <div className="input-container">
        <select 
          value={promptType} 
          onChange={(e) => setPromptType(e.target.value as PromptType)}
          disabled={isDisabled}
          className="prompt-type-selector"
        >
          <option value={PromptType.DEFAULT}>General</option>
          <option value={PromptType.FRONTEND}>Frontend</option>
          <option value={PromptType.BACKEND}>Backend</option>
        </select>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          disabled={isDisabled}
          className="message-input"
        />
      </div>
      <button type="submit" disabled={isDisabled || !message.trim()}>
        Send
      </button>
    </form>
  );
};

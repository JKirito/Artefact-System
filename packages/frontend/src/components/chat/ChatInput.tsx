import React, { useState, FormEvent } from "react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isDisabled: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isDisabled,
}) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!message.trim()) return;

    onSendMessage(message);
    setMessage(""); // Clear input field
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex p-4 gap-2 bg-black/20 border-t border-white/10"
    >
      <div className="flex flex-1 gap-2 items-center">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          disabled={isDisabled}
          className="flex-1 px-4 py-3 rounded-3xl bg-white/10 border border-white/20 text-white text-base outline-none transition-all duration-200 focus:border-blue-500 focus:shadow-[0_0_0_2px_rgba(100,108,255,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>
      <button
        type="submit"
        disabled={isDisabled || !message.trim()}
        className="px-6 py-3 rounded-3xl bg-blue-600 text-white font-medium border-none cursor-pointer transition-colors duration-200 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        Send
      </button>
    </form>
  );
};

import React from "react";
import "./Sidebar.css";

export interface ChatSummary {
  id: string;
  title: string;
}

interface SidebarProps {
  isOpen: boolean;
  chats: ChatSummary[];
  currentChatId: string;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  chats,
  currentChatId,
  onNewChat,
  onSelectChat,
}) => {
  return (
    <aside className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <button className="new-chat-button" onClick={onNewChat}>
        + New Chat
      </button>
      {chats.length === 0 ? (
        <div className="conversation-placeholder">
          <p>No conversations yet</p>
        </div>
      ) : (
        <div className="chat-list">
          {chats.map((chat, index) => (
            <div
              key={chat.id}
              className={`chat-item ${chat.id === currentChatId ? "active" : ""}`}
              onClick={() => onSelectChat(chat.id)}
            >
              {chat.title || `Chat ${index + 1}`}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
};

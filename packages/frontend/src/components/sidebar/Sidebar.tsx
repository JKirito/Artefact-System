import React from "react";
import "./Sidebar.css";

interface SidebarProps {
  isOpen: boolean;
  onNewChat: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onNewChat }) => {
  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <button className="new-chat-button" onClick={onNewChat}>
        + New Chat
      </button>
      <div className="conversation-placeholder">
        <p>No conversations yet</p>
      </div>
    </aside>
  );
};

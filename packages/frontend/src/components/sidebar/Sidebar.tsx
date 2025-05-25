import React from "react";
import { ChatSummary } from "../../types";

interface SidebarProps {
  isOpen: boolean;
  chats: ChatSummary[];
  currentChatId: string;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  chats = [],
  currentChatId,
  onNewChat,
  onSelectChat,
  onClose,
}) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-64 bg-gray-800 border-r border-white/10 p-4 flex flex-col transition-all duration-300 ease-in-out z-50 ${
          // Mobile: fixed positioning with transform
          isOpen
            ? "fixed left-0 top-0 bottom-0 translate-x-0"
            : "fixed left-0 top-0 bottom-0 -translate-x-full"
        } ${
          // Desktop: relative positioning with visibility
          isOpen
            ? "md:relative md:translate-x-0 md:top-auto md:bottom-auto md:block"
            : "md:hidden"
        }`}
      >
        <button
          className="bg-blue-600 text-white border-none px-4 py-2 rounded cursor-pointer mb-4 hover:bg-blue-700 transition-colors duration-200"
          onClick={onNewChat}
        >
          + New Chat
        </button>
        {chats.length === 0 ? (
          <div className="text-white/60 text-sm">
            <p>No conversations yet</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {chats.map((chat, index) => (
              <div
                key={chat.id}
                className={`p-2 rounded cursor-pointer mb-2 transition-colors duration-200 ${
                  chat.id === currentChatId
                    ? "bg-blue-600/40"
                    : "bg-white/5 hover:bg-white/10"
                }`}
                onClick={() => onSelectChat(chat.id)}
              >
                <div className="font-medium text-white">
                  {chat.title || `Chat ${index + 1}`}
                </div>
                {chat.lastMessage && (
                  <div className="text-xs text-white/60 mt-1 truncate">
                    {chat.lastMessage}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </aside>
    </>
  );
};

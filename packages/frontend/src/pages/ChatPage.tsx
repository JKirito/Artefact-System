import { useSocket } from "../hooks/useSocket";
import { ChatContainer } from "../components/chat/ChatContainer";
import { Layout } from "../components/common/Layout";
import { ArtifactWindow } from "../components/artifacts/ArtifactWindow";
import { Sidebar } from "../components/sidebar/Sidebar";
import { useEffect, useState } from "react";
import { useSettings } from "../context/SettingsContext";
import { PromptType } from "../hooks/useSocket";
import "../App.css";

function ChatPage() {
  const {
    isConnected,
    isTyping,
    currentResponse,
    messages,
    error,
    artifact,
    isArtifactOpen,
    closeArtifact,
    toggleArtifact,
    sendMessage,
    resetChat,
    currentSessionId,
    chatSessions,
    createNewChat,
    loadChatSession,
    // New thinking-related state
    isThinking,
    currentThinkingContent,
  } = useSocket();

  const { defaultSidebarOpen } = useSettings();

  // State to track if there's a new artifact that hasn't been viewed
  const [hasNewArtifact, setHasNewArtifact] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(defaultSidebarOpen);

  useEffect(() => {
    setIsSidebarOpen(defaultSidebarOpen);
  }, [defaultSidebarOpen]);

  // Reset the new artifact indicator when the artifact window is opened
  useEffect(() => {
    if (isArtifactOpen) {
      setHasNewArtifact(false);
    }
  }, [isArtifactOpen]);

  // Set the new artifact indicator when a new artifact is received
  useEffect(() => {
    if (artifact && !isArtifactOpen) {
      setHasNewArtifact(true);
    }
  }, [artifact, isArtifactOpen]);

  // Wrapper function to handle simplified sendMessage interface
  const handleSendMessage = (message: string) => {
    sendMessage(message, PromptType.DEFAULT);
  };

  // Handle new chat creation
  const handleNewChat = () => {
    createNewChat();
  };

  // Handle chat selection
  const handleSelectChat = (chatId: string) => {
    loadChatSession(chatId);
  };

  // Always show the toggle button after the first message
  const hasMessages = messages.length > 0;

  return (
    <div className="w-full h-screen">
      <Layout
        sidebar={
          <Sidebar
            isOpen={isSidebarOpen}
            onNewChat={handleNewChat}
            chats={chatSessions}
            currentChatId={currentSessionId || ""}
            onSelectChat={handleSelectChat}
            onClose={() => setIsSidebarOpen(false)}
          />
        }
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
      >
        {isConnected && (
          <ChatContainer
            messages={messages}
            currentResponse={currentResponse}
            isTyping={isTyping}
            error={error}
            isThinking={isThinking}
            currentThinkingContent={currentThinkingContent}
            onSendMessage={handleSendMessage}
          />
        )}

        {/* Artifact Toggle Button - always show after first message */}
        {hasMessages && (
          <button
            className={`fixed bottom-5 right-5 px-5 py-2.5 rounded-full text-white text-sm font-bold shadow-lg z-50 flex items-center justify-center transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:shadow-md ${
              hasNewArtifact
                ? "bg-red-500 hover:bg-red-600 animate-pulse"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            onClick={toggleArtifact}
            title="Toggle Code Artifacts"
          >
            {isArtifactOpen
              ? "❌ Close Code"
              : hasNewArtifact
              ? "🔔 New Code!"
              : "📋 View Code"}
          </button>
        )}

        {/* Artifact Window */}
        <ArtifactWindow
          isOpen={isArtifactOpen}
          onClose={closeArtifact}
          artifact={artifact}
        />
      </Layout>
    </div>
  );
}

export default ChatPage;

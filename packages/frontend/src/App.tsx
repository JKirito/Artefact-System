import { useSocket } from "./hooks/useSocket";
import { ChatContainer } from "./components/chat/ChatContainer";
import { Layout } from "./components/common/Layout";
import { ArtifactWindow } from "./components/artifacts/ArtifactWindow";
import { Sidebar, ChatSummary } from "./components/sidebar/Sidebar";
import { Message } from "./types";
import { useEffect, useState } from "react";
import "./App.css";

function App() {
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
    setChatMessages,
    resetChat,
  } = useSocket();

  interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
  }

  const [chats, setChats] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>("");

  // Load chats from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("chatSessions");
    if (stored) {
      const parsed: ChatSession[] = JSON.parse(stored);
      setChats(parsed);
      if (parsed.length > 0) {
        setCurrentChatId(parsed[0].id);
        setChatMessages(parsed[0].messages);
      }
    } else {
      handleNewChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist chats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("chatSessions", JSON.stringify(chats));
  }, [chats]);

  // Update current chat messages when socket messages change
  useEffect(() => {
    if (!currentChatId) return;
    setChats((prev) => {
      const idx = prev.findIndex((c) => c.id === currentChatId);
      if (idx === -1) return prev;
      const updated = [...prev];
      const existing = updated[idx];
      const title = existing.title || messages.find((m) => m.sender === "user")?.content?.slice(0, 20) || "";
      updated[idx] = { ...existing, messages, title };
      return updated;
    });
  }, [messages, currentChatId]);

  const handleNewChat = () => {
    const newChat: ChatSession = { id: Date.now().toString(), title: "", messages: [] };
    setChats((prev) => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    resetChat();
  };

  const handleSelectChat = (id: string) => {
    const chat = chats.find((c) => c.id === id);
    if (!chat) return;
    setCurrentChatId(id);
    resetChat();
    setChatMessages(chat.messages);
  };

  // State to track if there's a new artifact that hasn't been viewed
  const [hasNewArtifact, setHasNewArtifact] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
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
  
  // Always show the toggle button after the first message
  const hasMessages = messages.length > 0;

  return (
    <Layout
      sidebar={
        <Sidebar
          isOpen={isSidebarOpen}
          chats={chats.map(({ id, title }) => ({ id, title }))}
          currentChatId={currentChatId}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
        />
      }
      onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
    >
      {isConnected && (
        <ChatContainer
          messages={messages}
          currentResponse={currentResponse}
          isTyping={isTyping}
          error={error}
          onSendMessage={sendMessage}
        />
      )}
      
      {/* Artifact Toggle Button - always show after first message */}
      {hasMessages && (
        <button 
          className={`artifact-toggle-button ${hasNewArtifact ? 'has-new-artifact' : ''}`}
          onClick={toggleArtifact}
          title="Toggle Code Artifacts"
        >
          {isArtifactOpen ? '❌ Close Code' : hasNewArtifact ? '🔔 New Code!' : '📋 View Code'}
        </button>
      )}
      
      {/* Artifact Window */}
      <ArtifactWindow
        isOpen={isArtifactOpen}
        onClose={closeArtifact}
        artifact={artifact}
      />
    </Layout>
  );
}

export default App;

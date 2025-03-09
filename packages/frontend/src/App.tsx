import { useSocket } from "./hooks/useSocket";
import { ChatContainer } from "./components/chat/ChatContainer";
import { Layout } from "./components/common/Layout";
import { ArtifactWindow } from "./components/artifacts/ArtifactWindow";
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
  } = useSocket();
  
  // Always show the toggle button after the first message
  const hasMessages = messages.length > 0;

  return (
    <Layout>
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
          className="artifact-toggle-button" 
          onClick={toggleArtifact}
          title="Toggle Code Artifacts"
        >
          {isArtifactOpen ? '❌ Close Code' : '📋 View Code'}
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

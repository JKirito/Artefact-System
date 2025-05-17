import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { Message, Artifact } from "../types";

/**
 * Enum for prompt types to help with code completion
 */
export enum PromptType {
  DEFAULT = 'default',
  FRONTEND = 'frontend',
  BACKEND = 'backend'
}

interface UseSocketReturn {
  isConnected: boolean;
  connectionStatus: string;
  isTyping: boolean;
  currentResponse: string;
  messages: Message[];
  error: string;
  artifact: Artifact | null;
  isArtifactOpen: boolean;
  openArtifact: (artifact: Artifact) => void;
  closeArtifact: () => void;
  toggleArtifact: () => void;
  sendMessage: (message: string, promptType?: PromptType) => void;
}

export const useSocket = (): UseSocketReturn => {
  const [connectionStatus, setConnectionStatus] = useState("Loading...");
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentResponse, setCurrentResponse] = useState("");
  const [error, setError] = useState("");
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [isArtifactOpen, setIsArtifactOpen] = useState(false);
  
  // Socket reference
  const socketRef = useRef<Socket | null>(null);



  useEffect(() => {
    const setupSocket = () => {
      // Initialize socket connection
      console.log('Attempting to connect to Socket.IO server at http://localhost:3002');
      // Explicitly connect to the backend server
      const socket = io('http://localhost:3002', {
        path: '/socket.io/',
        transports: ['websocket', 'polling'], // Prioritize WebSocket over polling
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: false, // We'll manually connect after health check
        withCredentials: true // Enable CORS credentials
      });
      
      socketRef.current = socket;
      
      return socket;
    };
    
    const checkBackendConnection = async () => {
      try {
        // First try to connect to the backend API
        const response = await axios.get("/api/health");
        if (response.data.status === "healthy") {
          setIsConnected(true);
          setConnectionStatus("Connected to backend successfully!");
          
          // Then set up the socket connection
          const socket = setupSocket();
          socketRef.current = socket;
          
          // Set up all event handlers before connecting
          // Socket event handlers
          socket.on("connect", () => {
            console.log("Socket connected with ID:", socket.id);
          });

          socket.on("connect_error", (error) => {
            console.error("Socket connection error:", error);
          });

          socket.on("connect_timeout", () => {
            console.error("Socket connection timeout");
          });

          socket.on("chat:typing", (data: { status: boolean }) => {
            setIsTyping(data.status);
          });

          socket.on("chat:response:chunk", (data: { content: string }) => {
            // Only update the current response if there's actual content
            if (data.content && data.content.trim()) {
              // The backend should now handle the artifact extraction and cleaning
              // Just update the current response with the cleaned content from the backend
              setCurrentResponse((prev) => prev + data.content);
            }
          });

          socket.on(
            "chat:response:complete",
            (data: { id: string; content: string }) => {
              // Response is complete
              
              // Add the complete message to the messages array
              // The backend now provides a clean version without artifact tags
              setMessages((prev) => [
                ...prev,
                {
                  id: data.id,
                  content: data.content, // This should be clean already from backend
                  sender: "ai",
                  timestamp: new Date(),
                },
              ]);
              setCurrentResponse("");
            }
          );

          socket.on("chat:error", (data: { message: string }) => {
            setError(data.message);
            setIsTyping(false);
          });

          // Handle artifact events from the server
          socket.on("artifact:new", (data: { id: string; content: string; language?: string; title?: string }) => {
            console.log('Received artifact from server:', data);
            const newArtifact: Artifact = {
              id: data.id,
              content: data.content,
              language: data.language,
              title: data.title || 'Code Artifact',
              timestamp: new Date(),
            };
            setArtifact(newArtifact);
            setIsArtifactOpen(true);
          });

          // Extract code artifacts from AI messages
          socket.on("chat:response", (data: { content: string }) => {
            const regex = /<CODE_ARTIFACT>([\s\S]*?)<\/CODE_ARTIFACT>/g;
            let match;
            
            // Extract all code artifacts from the message
            while ((match = regex.exec(data.content)) !== null) {
              const artifactContent = match[1].trim();
              
              // Extract language from markdown code block if present
              let language = "";
              const codeBlockMatch = artifactContent.match(/```([a-zA-Z0-9]+)\n/); 
              if (codeBlockMatch) {
                language = codeBlockMatch[1];
              }
              
              // Extract filename if present
              let title = "Code Artifact";
              const filenameMatch = artifactContent.match(/\/\/\s*filename:\s*([^\n]+)/i);
              if (filenameMatch) {
                title = filenameMatch[1].trim();
              }
              
              // Clean the content (remove the markdown code block syntax)
              let cleanContent = artifactContent.replace(/```[a-zA-Z0-9]*\n/g, "").replace(/```$/g, "");
              
              // Create and set the artifact
              const newArtifact: Artifact = {
                id: Date.now().toString(),
                content: cleanContent,
                language: language,
                title: title,
                timestamp: new Date(),
              };
              
              setArtifact(newArtifact);
              if (!isArtifactOpen) {
                setIsArtifactOpen(true);
              }
            }
          });

          socket.on("disconnect", () => {
            console.log("Socket disconnected");
          });
          
          // Explicitly connect the socket after setting up all handlers
          console.log('All Socket.IO handlers set up, connecting to backend...');
          socket.connect();
        }
      } catch (error) {
        setIsConnected(false);
        setConnectionStatus(
          "Failed to connect to backend. Make sure it's running on port 3002."
        );
        console.error("Backend connection error:", error);
        console.log("Please start the backend server with: cd packages/backend && npm run dev");
      }
    };

    checkBackendConnection();
    
    // Cleanup socket connection on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  /**
   * Send a message to the AI assistant
   * @param message The message text
   * @param promptType Optional prompt type for specialized assistance
   */
  const sendMessage = (message: string, promptType: PromptType = PromptType.DEFAULT) => {
    if (!message.trim()) {
      setError("Please enter a message");
      return;
    }

    // Clear error
    setError("");

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Send message to server via socket with prompt type
    if (socketRef.current) {
      socketRef.current.emit("chat:message", {
        content: message,
        promptType: promptType
      });
    }
  };

  const openArtifact = (artifactData: Artifact) => {
    setArtifact(artifactData);
    setIsArtifactOpen(true);
  };

  const closeArtifact = () => {
    setIsArtifactOpen(false);
  };

  const toggleArtifact = () => {
    setIsArtifactOpen(prev => !prev);
  };

  const resetChat = () => {
    setMessages([]);
    setCurrentResponse("");
    setArtifact(null);
    setIsArtifactOpen(false);
  };

  return {
    isConnected,
    connectionStatus,
    isTyping,
    currentResponse,
    messages,
    error,
    artifact,
    isArtifactOpen,
    openArtifact,
    closeArtifact,
    toggleArtifact,
    sendMessage,
    resetChat
  };
};

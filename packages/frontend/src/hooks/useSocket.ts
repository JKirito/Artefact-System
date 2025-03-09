import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { Message, Artifact } from "../types";

// Helper function to extract code from streaming content
const extractCodeFromContent = (content: string): { language: string, code: string, title: string } | null => {
  const codeMatch = content.match(/```([\w-]*)\s*([\s\S]*?)```/);
  if (codeMatch) {
    const language = codeMatch[1]?.trim() || 'text';
    const code = codeMatch[2].trim();
    
    // Extract title from first line if it contains filename
    let title = `${language.charAt(0).toUpperCase() + language.slice(1)} Code`;
    const firstLine = code.split('\n')[0];
    if (firstLine && firstLine.includes('filename:')) {
      title = firstLine.replace('//', '').trim();
    }
    
    return { language, code, title };
  }
  return null;
};

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
  sendMessage: (message: string) => void;
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
  
  // Buffer for collecting code artifact chunks during streaming
  const artifactBufferRef = useRef<string>("");
  const isCollectingArtifactRef = useRef<boolean>(false);

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
              // Check for artifact markers in the streaming content
              if (data.content.includes('<CODE_ARTIFACT>')) {
                // Start collecting artifact
                isCollectingArtifactRef.current = true;
                
                // Split content to get the part before <CODE_ARTIFACT>
                const parts = data.content.split('<CODE_ARTIFACT>');
                if (parts[0] && parts[0].trim()) {
                  // Add the text before the artifact marker to the chat
                  setCurrentResponse((prev) => prev + parts[0]);
                }
                
                // Start collecting the artifact content
                artifactBufferRef.current = '';
                
                // If there's content after the tag in this chunk, add it to the buffer
                if (parts.length > 1 && parts[1]) {
                  artifactBufferRef.current += parts[1];
                }
                
                return;
              }
              
              // Check if we're currently collecting an artifact
              if (isCollectingArtifactRef.current) {
                // Check if this chunk contains the end of the artifact
                if (data.content.includes('</CODE_ARTIFACT>')) {
                  // Split content to get the part before </CODE_ARTIFACT>
                  const parts = data.content.split('</CODE_ARTIFACT>');
                  
                  // Add the first part to our artifact buffer
                  if (parts[0]) {
                    artifactBufferRef.current += parts[0];
                  }
                  
                  // Now we have a complete artifact, process it
                  const completeArtifact = artifactBufferRef.current;
                  
                  // Extract code from the artifact
                  const extractedCode = extractCodeFromContent(completeArtifact);
                  if (extractedCode) {
                    const { language, code, title } = extractedCode;
                    
                    // Create and show the artifact
                    const newArtifact: Artifact = {
                      id: `artifact-${Date.now()}`,
                      content: `\`\`\`${language}\n${code}\n\`\`\``,
                      language,
                      title,
                      timestamp: new Date(),
                    };
                    
                    setArtifact(newArtifact);
                    setIsArtifactOpen(true);
                    console.log('Created artifact from streaming content:', newArtifact);
                  }
                  
                  // Reset the artifact collection state
                  isCollectingArtifactRef.current = false;
                  artifactBufferRef.current = '';
                  
                  // If there's content after the closing tag, add it to the chat
                  if (parts.length > 1 && parts[1] && parts[1].trim()) {
                    setCurrentResponse((prev) => prev + parts[1]);
                  }
                  
                  return;
                }
                
                // Still collecting the artifact, add to buffer
                artifactBufferRef.current += data.content;
                return;
              }
              
              // Regular text, not part of an artifact
              setCurrentResponse((prev) => prev + data.content);
            }
          });

          socket.on(
            "chat:response:complete",
            (data: { id: string; content: string }) => {
              // Reset artifact collection state when response is complete
              isCollectingArtifactRef.current = false;
              artifactBufferRef.current = '';
              
              // Add the complete message to the messages array
              // The Message component will handle filtering out CODE_ARTIFACT tags
              setMessages((prev) => [
                ...prev,
                {
                  id: data.id,
                  content: data.content,
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

  const sendMessage = (message: string) => {
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

    // Send message to server via socket
    if (socketRef.current) {
      socketRef.current.emit("chat:message", message);
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
    sendMessage
  };
};

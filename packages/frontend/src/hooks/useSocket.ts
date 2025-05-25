import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Message, Artifact, ChatSummary, ParsedChunk } from "../types";
import { ChatService } from "../services/chatService";
import { StreamParser } from "../utils/streamParser";

export enum PromptType {
  DEFAULT = "default",
  FRONTEND = "frontend",
  BACKEND = "backend",
}

interface UseChatReturn {
  isConnected: boolean;
  connectionStatus: string;
  isTyping: boolean;
  currentResponse: string;
  messages: Message[];
  error: string;
  artifact: Artifact | null;
  isArtifactOpen: boolean;
  currentSessionId: string | null;
  chatSessions: ChatSummary[];
  // New parser-related state
  isThinking: boolean;
  currentThinkingContent: string;
  openArtifact: (artifact: Artifact) => void;
  closeArtifact: () => void;
  toggleArtifact: () => void;
  sendMessage: (message: string, promptType?: PromptType) => Promise<void>;
  setChatMessages: (msgs: Message[]) => void;
  resetChat: () => void;
  createNewChat: () => Promise<void>;
  loadChatSession: (sessionId: string) => Promise<void>;
  loadChatSessions: () => Promise<void>;
  deleteChat: (sessionId: string) => Promise<void>;
}

export const useSocket = (): UseChatReturn => {
  const [connectionStatus, setConnectionStatus] = useState("Loading...");
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentResponse, setCurrentResponse] = useState("");
  const [error, setError] = useState("");
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [isArtifactOpen, setIsArtifactOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSummary[]>([]);
  // New parser-related state
  const [isThinking, setIsThinking] = useState(false);
  const [currentThinkingContent, setCurrentThinkingContent] = useState("");
  const streamParserRef = useRef<StreamParser | null>(null);

  useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        const response = await axios.get("/api/health");
        if (response.data.status === "healthy") {
          setIsConnected(true);
          setConnectionStatus("Connected to backend successfully!");
          // Load existing chat sessions
          await loadChatSessions();
        }
      } catch (err) {
        setIsConnected(false);
        setConnectionStatus(
          "Failed to connect to backend. Make sure it's running on port 3002."
        );
        console.error("Backend connection error:", err);
      }
    };

    checkBackendConnection();
  }, []);

  const parseEvent = (raw: string) => {
    const lines = raw.split("\n");
    let event = "";
    let data = "";
    for (const line of lines) {
      if (line.startsWith("event:")) {
        event = line.replace("event:", "").trim();
      } else if (line.startsWith("data:")) {
        data += line.replace("data:", "").trim();
      }
    }

    if (!event) return;

    try {
      const payload = data ? JSON.parse(data) : {};
      switch (event) {
        case "typing":
          setIsTyping(payload.status);
          // Initialize parser when typing starts
          if (payload.status && !streamParserRef.current) {
            streamParserRef.current = new StreamParser();
          }
          // Reset parser state when typing stops
          if (!payload.status && streamParserRef.current) {
            streamParserRef.current.reset();
            setIsThinking(false);
            setCurrentThinkingContent("");
          }
          break;
        case "chunk":
          if (payload.content && streamParserRef.current) {
            // Parse the chunk through our stream parser
            const parsedChunk: ParsedChunk = streamParserRef.current.parseChunk(
              payload.content,
              false
            );

            // Update display content (only show non-empty content)
            if (parsedChunk.displayContent) {
              setCurrentResponse(parsedChunk.displayContent);
            }

            // Update thinking state
            setIsThinking(parsedChunk.isThinkingActive);
            setCurrentThinkingContent(parsedChunk.thinkingContent || "");

            // Handle any new artifacts
            if (parsedChunk.artifacts.length > 0) {
              const latestArtifact =
                parsedChunk.artifacts[parsedChunk.artifacts.length - 1];
              setArtifact(latestArtifact);
              setIsArtifactOpen(true);
            }
          }
          break;
        case "complete":
          if (streamParserRef.current) {
            // Final parse with completion flag
            const finalParsed = streamParserRef.current.parseChunk("", true);

            setMessages((prev) => [
              ...prev,
              {
                id: payload.id,
                content: finalParsed.displayContent,
                sender: "ai",
                timestamp: new Date(),
                parsedContent: {
                  displayContent: finalParsed.displayContent,
                  thinkingContent: finalParsed.thinkingContent,
                  artifacts: finalParsed.artifacts,
                  hasActiveThinking: false,
                },
                isThinking: false,
              },
            ]);

            // Reset current response and thinking state
            setCurrentResponse("");
            setIsThinking(false);
            setCurrentThinkingContent("");

            // Clean up parser
            streamParserRef.current.reset();
          } else {
            // Fallback to original behavior if parser not available
            setMessages((prev) => [
              ...prev,
              {
                id: payload.id,
                content: payload.content,
                sender: "ai",
                timestamp: new Date(),
              },
            ]);
            setCurrentResponse("");
          }

          // Update session info if provided
          if (payload.sessionId && payload.sessionTitle) {
            setCurrentSessionId(payload.sessionId);
            // Refresh chat sessions to update titles
            loadChatSessions();
          }
          break;
        case "artifact":
          setArtifact({
            id: payload.id,
            content: payload.content,
            language: payload.language,
            title: payload.title,
            timestamp: new Date(),
          });
          setIsArtifactOpen(true);
          break;
        case "error":
          setError(payload.message || "Unknown error");
          setIsTyping(false);
          // Reset parser on error
          if (streamParserRef.current) {
            streamParserRef.current.reset();
          }
          setIsThinking(false);
          setCurrentThinkingContent("");
          break;
      }
    } catch (err) {
      console.error("Failed to parse SSE event", err);
    }
  };

  const sendMessage = async (
    message: string,
    promptType: PromptType = PromptType.DEFAULT
  ) => {
    if (!message.trim()) {
      setError("Please enter a message");
      return;
    }

    setError("");

    // Create new session if none exists
    let sessionId = currentSessionId;
    if (!sessionId) {
      try {
        const newSession = await ChatService.createSession();
        sessionId = newSession.id;
        setCurrentSessionId(sessionId);
        await loadChatSessions(); // Refresh the sessions list
      } catch (err) {
        console.error("Failed to create new session:", err);
        setError("Failed to create new chat session");
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    setCurrentResponse("");

    const params = new URLSearchParams({
      message,
      promptType,
      sessionId: sessionId,
    });

    try {
      const response = await fetch(
        `http://localhost:3002/api/openai/stream?${params.toString()}`
      );
      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        for (let i = 0; i < events.length - 1; i++) {
          if (events[i].trim()) parseEvent(events[i]);
        }
        buffer = events[events.length - 1];
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
    } finally {
      setIsTyping(false);
    }
  };

  const createNewChat = async () => {
    try {
      const newSession = await ChatService.createSession();
      setCurrentSessionId(newSession.id);
      setMessages([]);
      setCurrentResponse("");
      setArtifact(null);
      setIsArtifactOpen(false);
      setError("");
      await loadChatSessions(); // Refresh the sessions list
    } catch (err) {
      console.error("Failed to create new chat:", err);
      setError("Failed to create new chat");
    }
  };

  const loadChatSession = async (sessionId: string) => {
    try {
      const session = await ChatService.getSession(sessionId);
      setCurrentSessionId(sessionId);
      // Convert backend messages to frontend format
      const frontendMessages: Message[] = session.messages.map((msg) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
      setMessages(frontendMessages);
      setCurrentResponse("");
      setError("");
    } catch (err) {
      console.error("Failed to load chat session:", err);
      setError("Failed to load chat session");
    }
  };

  const loadChatSessions = async () => {
    try {
      const sessions = await ChatService.getSessions();
      setChatSessions(sessions);
    } catch (err) {
      console.error("Failed to load chat sessions:", err);
    }
  };

  const deleteChat = async (sessionId: string) => {
    try {
      await ChatService.deleteSession(sessionId);
      // If we're deleting the current session, reset to empty state
      if (sessionId === currentSessionId) {
        setCurrentSessionId(null);
        setMessages([]);
        setCurrentResponse("");
        setArtifact(null);
        setIsArtifactOpen(false);
      }
      await loadChatSessions(); // Refresh the sessions list
    } catch (err) {
      console.error("Failed to delete chat:", err);
      setError("Failed to delete chat");
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
    setIsArtifactOpen((prev) => !prev);
  };

  const setChatMessages = (msgs: Message[]) => {
    setMessages(msgs);
  };

  const resetChat = () => {
    createNewChat();
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
    currentSessionId,
    chatSessions,
    // New parser-related state
    isThinking,
    currentThinkingContent,
    openArtifact,
    closeArtifact,
    toggleArtifact,
    sendMessage,
    setChatMessages,
    resetChat,
    createNewChat,
    loadChatSession,
    loadChatSessions,
    deleteChat,
  };
};

import { useState, useEffect } from "react";
import axios from "axios";
import { Message, Artifact } from "../types";

export enum PromptType {
  DEFAULT = 'default',
  FRONTEND = 'frontend',
  BACKEND = 'backend'
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
  openArtifact: (artifact: Artifact) => void;
  closeArtifact: () => void;
  toggleArtifact: () => void;
  sendMessage: (message: string, promptType?: PromptType) => Promise<void>;
  resetChat: () => void;
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

  useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        const response = await axios.get("/api/health");
        if (response.data.status === "healthy") {
          setIsConnected(true);
          setConnectionStatus("Connected to backend successfully!");
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
          break;
        case "chunk":
          if (payload.content) {
            setCurrentResponse((prev) => prev + payload.content);
          }
          break;
        case "complete":
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
    resetChat,
  };
};

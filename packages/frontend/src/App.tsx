import { useState, useEffect, FormEvent, useRef } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import "./App.css";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

function App() {
  const [_connectionStatus, setConnectionStatus] = useState("Loading...");
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentResponse, setCurrentResponse] = useState("");
  const [error, setError] = useState("");

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentResponse]);

  // Connect to backend and setup socket
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
            setCurrentResponse((prev) => prev + data.content);
          });

          socket.on(
            "chat:response:complete",
            (data: { id: string; content: string }) => {
              // Add the complete message to the messages array
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      setError("Please enter a message");
      return;
    }

    // Clear error and input field
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

    // Clear input field
    setMessage("");
  };

  return (
    <div className="app">
      {isConnected && (
        <div className="chat-container">
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="empty-chat">
                <p>Send a message to start chatting with the AI</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${
                    msg.sender === "user" ? "user-message" : "ai-message"
                  }`}
                >
                  <div className="message-content">{msg.content}</div>
                  <div className="message-timestamp">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))
            )}

            {currentResponse && (
              <div className="message ai-message">
                <div className="message-content">{currentResponse}</div>
              </div>
            )}

            {isTyping && (
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="message-form">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              disabled={isTyping}
            />
            <button type="submit" disabled={isTyping || !message.trim()}>
              Send
            </button>
          </form>

          {error && <div className="error">{error}</div>}
        </div>
      )}
    </div>
  );
}

export default App;

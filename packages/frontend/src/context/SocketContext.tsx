import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";

// Socket.IO client configuration
// Using empty URL to connect to the same domain (will use the proxy configured in vite.config.ts)
const SOCKET_OPTIONS = {
  autoConnect: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
};

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log("Initializing socket connection in SocketProvider");
    console.log("Socket options:", SOCKET_OPTIONS);

    // Create a new socket instance with empty URL (connects to same domain via proxy)
    const newSocket = io(SOCKET_OPTIONS);
    setSocket(newSocket);

    // Log socket instance details
    console.log("Socket instance created:", newSocket);

    // Connection events
    const onConnect = () => {
      console.log("Socket connected! ID:", newSocket.id);
      console.log("Socket connected state after connect:", newSocket.connected);
      setIsConnected(true);
    };

    const onDisconnect = (reason: string) => {
      console.log("Socket disconnected. Reason:", reason);
      setIsConnected(false);
    };

    const onConnectError = (error: Error) => {
      console.error("Socket connection error:", error);
      console.error("Socket connection error details:", error.message);
      setIsConnected(false);
    };

    // Register event listeners
    newSocket.on("connect", onConnect);
    newSocket.on("disconnect", onDisconnect);
    newSocket.on("connect_error", onConnectError);

    // Check initial connection state
    setIsConnected(newSocket.connected);

    // Clean up on unmount
    return () => {
      console.log("Cleaning up socket connection");
      newSocket.off("connect", onConnect);
      newSocket.off("disconnect", onDisconnect);
      newSocket.off("connect_error", onConnectError);
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

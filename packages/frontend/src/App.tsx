import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [message, setMessage] = useState("Loading...");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        const response = await axios.get("/api/health");
        if (response.data.status === "healthy") {
          setIsConnected(true);
          setMessage("Connected to backend successfully!");
        }
      } catch (error) {
        setIsConnected(false);
        setMessage("Failed to connect to backend. Make sure it's running.");
        console.error("Backend connection error:", error);
      }
    };

    checkBackendConnection();
  }, []);

  return (
    <div className="app">
      <h1>Monorepo Frontend</h1>
      <div className="card">
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <div
        className={`connection-status ${
          isConnected ? "connected" : "disconnected"
        }`}
      >
        <h2>Backend Connection Status</h2>
        <p>{message}</p>
      </div>
    </div>
  );
}

export default App;

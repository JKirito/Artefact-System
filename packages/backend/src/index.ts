import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { setupSocketHandlers } from "@/socket/socketHandlers";
import openaiRoutes from "@/routes/openai.routes";

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000", // Specific frontend origin instead of wildcard
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type"],
  },
  transports: ["polling", "websocket"],
  path: "/socket.io/", // Explicitly set the path
  serveClient: true, // Serve client files
  connectTimeout: 45000, // Longer timeout
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Add Socket.IO connection debugging
io.engine.on("connection_error", (err) => {
  console.error("Socket.IO connection error:", err);
});
const PORT = process.env.PORT || 3002; // Changed from 3001 to avoid port conflict

// Setup Socket.IO handlers
setupSocketHandlers(io);

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);
// Routes
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Backend API is running!" });
});

// Health check endpoint - moved under /api prefix
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "healthy" });
});

// OpenAI API routes
app.use("/api/openai", openaiRoutes);

// Start the server
httpServer.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(
    `WebSocket server is running on http://localhost:${PORT}/socket.io/`
  );
  console.log(
    `Socket.IO is configured with CORS for origin: http://localhost:3000`
  );
});

// Handle server shutdown gracefully
process.on("SIGINT", () => {
  console.log("Shutting down server...");
  httpServer.close(() => {
    console.log("Server shut down successfully");
    process.exit(0);
  });
});

// Export only what's needed for testing
export { app };

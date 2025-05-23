import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import openaiRoutes from "@/routes/openai.routes";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002; // Changed from 3001 to avoid port conflict

app.use(express.json());

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

// AI API routes (OpenAI or LMStudio)
app.use("/api/openai", openaiRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

// Handle server shutdown gracefully
process.on("SIGINT", () => {
  console.log("Shutting down server...");
  process.exit(0);
});

// Export only what's needed for testing
export { app };

import { handlePrompt } from "@/controllers/openai.controller";
import { streamChat } from "@/controllers/stream.controller";
import express from "express";

const router = express.Router();

// POST endpoint to handle AI prompts (OpenAI or LMStudio)
router.post("/prompt", handlePrompt);

// SSE endpoint for chat streaming
router.get("/stream", streamChat);

export default router;

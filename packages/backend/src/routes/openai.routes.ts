import { handlePrompt } from "@/controllers/openai.controller";
import express from "express";

const router = express.Router();

// POST endpoint to handle OpenAI prompts
router.post("/prompt", handlePrompt);

export default router;

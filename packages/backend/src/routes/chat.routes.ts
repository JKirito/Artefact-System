import express from "express";
import {
  createChatSession,
  getChatSessions,
  getChatSession,
  updateChatSession,
  deleteChatSession,
} from "@/controllers/chat.controller";

const router = express.Router();

// Chat session management routes
router.post("/sessions", createChatSession);
router.get("/sessions", getChatSessions);
router.get("/sessions/:sessionId", getChatSession);
router.put("/sessions/:sessionId", updateChatSession);
router.delete("/sessions/:sessionId", deleteChatSession);

export default router;

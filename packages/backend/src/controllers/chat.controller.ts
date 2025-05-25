import { Request, Response } from "express";
import { chatMemoryService } from "@/services/chatMemory";

/**
 * Create a new chat session
 */
export async function createChatSession(req: Request, res: Response) {
  try {
    const { title } = req.body;
    const session = chatMemoryService.createSession(title);

    res.status(201).json({
      success: true,
      session: {
        id: session.id,
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error creating chat session:", error);
    res.status(500).json({
      error: "Failed to create chat session",
    });
  }
}

/**
 * Get all chat sessions
 */
export async function getChatSessions(req: Request, res: Response) {
  try {
    const sessions = chatMemoryService.getAllSessions();

    res.status(200).json({
      success: true,
      sessions,
    });
  } catch (error) {
    console.error("Error getting chat sessions:", error);
    res.status(500).json({
      error: "Failed to get chat sessions",
    });
  }
}

/**
 * Get a specific chat session with messages
 */
export async function getChatSession(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const session = chatMemoryService.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        error: "Chat session not found",
      });
    }

    res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    console.error("Error getting chat session:", error);
    res.status(500).json({
      error: "Failed to get chat session",
    });
  }
}

/**
 * Update chat session title
 */
export async function updateChatSession(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const { title } = req.body;

    if (!title || typeof title !== "string") {
      return res.status(400).json({
        error: "Title is required and must be a string",
      });
    }

    const success = chatMemoryService.updateSessionTitle(sessionId, title);

    if (!success) {
      return res.status(404).json({
        error: "Chat session not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Session title updated successfully",
    });
  } catch (error) {
    console.error("Error updating chat session:", error);
    res.status(500).json({
      error: "Failed to update chat session",
    });
  }
}

/**
 * Delete a chat session
 */
export async function deleteChatSession(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const success = chatMemoryService.deleteSession(sessionId);

    if (!success) {
      return res.status(404).json({
        error: "Chat session not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Session deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting chat session:", error);
    res.status(500).json({
      error: "Failed to delete chat session",
    });
  }
}

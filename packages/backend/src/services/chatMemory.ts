import { ChatSession, ChatMessage, ChatSummary } from "../types/chat";

/**
 * In-memory chat storage service
 * In production, this would be replaced with a database
 */
class ChatMemoryService {
  private sessions: Map<string, ChatSession> = new Map();

  /**
   * Create a new chat session
   */
  createSession(title?: string): ChatSession {
    const id = this.generateId();
    const session: ChatSession = {
      id,
      title: title || `Chat ${this.sessions.size + 1}`,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sessions.set(id, session);
    return session;
  }

  /**
   * Get a chat session by ID
   */
  getSession(sessionId: string): ChatSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get all chat sessions as summaries
   */
  getAllSessions(): ChatSummary[] {
    return Array.from(this.sessions.values())
      .map((session) => ({
        id: session.id,
        title: session.title,
        lastMessage: session.messages[session.messages.length - 1]?.content,
        updatedAt: session.updatedAt,
      }))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Add a message to a chat session
   */
  addMessage(
    sessionId: string,
    content: string,
    sender: "user" | "ai"
  ): ChatMessage | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const message: ChatMessage = {
      id: this.generateId(),
      content,
      sender,
      timestamp: new Date(),
    };

    session.messages.push(message);
    session.updatedAt = new Date();

    // Auto-generate title from first user message
    if (session.messages.length === 1 && sender === "user") {
      session.title = this.generateTitle(content);
    }

    return message;
  }

  /**
   * Get conversation history for AI context
   * Returns recent messages to stay within token limits
   */
  getConversationHistory(
    sessionId: string,
    maxMessages: number = 10
  ): ChatMessage[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    // Return the most recent messages
    return session.messages.slice(-maxMessages);
  }

  /**
   * Delete a chat session
   */
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Update session title
   */
  updateSessionTitle(sessionId: string, title: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.title = title;
    session.updatedAt = new Date();
    return true;
  }

  /**
   * Clear all sessions (for testing/reset)
   */
  clearAllSessions(): void {
    this.sessions.clear();
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Generate a title from the first message
   */
  private generateTitle(content: string): string {
    // Take first 50 characters and clean up
    const title = content.slice(0, 50).trim();
    return title.length < content.length ? title + "..." : title;
  }
}

// Export singleton instance
export const chatMemoryService = new ChatMemoryService();

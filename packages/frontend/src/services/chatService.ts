import axios from "axios";
import { ChatSession, ChatSummary } from "../types";

const API_BASE = "/api/chat";

export class ChatService {
  /**
   * Create a new chat session
   */
  static async createSession(title?: string): Promise<ChatSession> {
    const response = await axios.post(`${API_BASE}/sessions`, { title });
    return response.data.session;
  }

  /**
   * Get all chat sessions
   */
  static async getSessions(): Promise<ChatSummary[]> {
    const response = await axios.get(`${API_BASE}/sessions`);
    return response.data.sessions;
  }

  /**
   * Get a specific chat session with messages
   */
  static async getSession(sessionId: string): Promise<ChatSession> {
    const response = await axios.get(`${API_BASE}/sessions/${sessionId}`);
    return response.data.session;
  }

  /**
   * Update chat session title
   */
  static async updateSessionTitle(
    sessionId: string,
    title: string
  ): Promise<void> {
    await axios.put(`${API_BASE}/sessions/${sessionId}`, { title });
  }

  /**
   * Delete a chat session
   */
  static async deleteSession(sessionId: string): Promise<void> {
    await axios.delete(`${API_BASE}/sessions/${sessionId}`);
  }
}

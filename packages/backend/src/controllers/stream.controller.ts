import { Request, Response } from "express";
import {
  openai,
  getSystemPrompt,
  PromptType,
  extractArtifacts,
  defaultModel,
} from "@/services/openai";
import { chatMemoryService } from "@/services/chatMemory";

export async function streamChat(req: Request, res: Response) {
  const message = (req.query.message as string) || "";
  const sessionId = (req.query.sessionId as string) || "";
  const type = ((req.query.promptType as string) || "default").toLowerCase();

  let promptType: PromptType = PromptType.DEFAULT;
  if (type === "frontend") promptType = PromptType.FRONTEND;
  else if (type === "backend") promptType = PromptType.BACKEND;

  // Validate session ID
  if (!sessionId) {
    res.status(400).json({ error: "Session ID is required" });
    return;
  }

  // Get or create session
  let session = chatMemoryService.getSession(sessionId);
  if (!session) {
    session = chatMemoryService.createSession();
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  res.write(`event: typing\ndata: ${JSON.stringify({ status: true })}\n\n`);

  try {
    // Add user message to session
    chatMemoryService.addMessage(session.id, message, "user");

    // Get conversation history for context
    const conversationHistory = chatMemoryService.getConversationHistory(
      session.id,
      10
    );

    // Build messages array with system prompt and conversation history
    const messages = [
      { role: "system", content: getSystemPrompt(promptType) },
      ...conversationHistory.map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.content,
      })),
    ];

    const stream = await openai.chat.completions.create({
      model: defaultModel,
      messages: messages as any,
      stream: true,
      temperature: 0.7,
      max_tokens: 1500,
    });

    let fullResponse = "";
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullResponse += content;
        res.write(`event: chunk\ndata: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // Extract artifacts and clean response
    const { cleaned, artifacts } = extractArtifacts(fullResponse);

    // Add AI response to session (store the full response including artifacts)
    chatMemoryService.addMessage(session.id, fullResponse, "ai");

    // Send artifacts to client
    for (const art of artifacts) {
      res.write(`event: artifact\ndata: ${JSON.stringify(art)}\n\n`);
    }

    // Send completion event with cleaned content
    const id = Date.now().toString();
    res.write(
      `event: complete\ndata: ${JSON.stringify({
        id,
        content: cleaned,
        sessionId: session.id,
        sessionTitle: session.title,
      })}\n\n`
    );

    res.write(`event: typing\ndata: ${JSON.stringify({ status: false })}\n\n`);
    res.end();
  } catch (err) {
    console.error("Stream chat error:", err);
    res.write(
      `event: error\ndata: ${JSON.stringify({
        message: "Failed to process message",
      })}\n\n`
    );
    res.end();
  }
}

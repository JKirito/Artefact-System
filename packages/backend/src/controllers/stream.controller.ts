import { Request, Response } from "express";
import { openai, getSystemPrompt, PromptType, extractArtifacts, defaultModel } from "@/services/openai";

export async function streamChat(req: Request, res: Response) {
  const message = (req.query.message as string) || "";
  const type = ((req.query.promptType as string) || "default").toLowerCase();

  let promptType: PromptType = PromptType.DEFAULT;
  if (type === "frontend") promptType = PromptType.FRONTEND;
  else if (type === "backend") promptType = PromptType.BACKEND;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  res.write(`event: typing\ndata: ${JSON.stringify({ status: true })}\n\n`);

  try {
    const stream = await openai.chat.completions.create({
      model: defaultModel,
      messages: [
        { role: "system", content: getSystemPrompt(promptType) },
        { role: "user", content: message },
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 1500,
    });

    let full = "";
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        full += content;
        res.write(`event: chunk\ndata: ${JSON.stringify({ content })}\n\n`);
      }
    }

    const { cleaned, artifacts } = extractArtifacts(full);
    for (const art of artifacts) {
      res.write(`event: artifact\ndata: ${JSON.stringify(art)}\n\n`);
    }

    const id = Date.now().toString();
    res.write(`event: complete\ndata: ${JSON.stringify({ id, content: cleaned })}\n\n`);
    res.write(`event: typing\ndata: ${JSON.stringify({ status: false })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`event: error\ndata: ${JSON.stringify({ message: "Failed to process message" })}\n\n`);
    res.end();
  }
}

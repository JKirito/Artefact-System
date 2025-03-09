import OpenAI from "openai";
import dotenv from "dotenv";
import { Server as SocketServer } from "socket.io";

// Load environment variables from .env file
dotenv.config();

// Check if OpenAI API key is available
const apiKey = process.env.OPENAI_KEY;
if (!apiKey) {
  console.error(
    "OpenAI API key is missing. Please add OPENAI_KEY to your .env file."
  );
  process.exit(1);
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: apiKey,
});

// Global socket.io server instance
let io: SocketServer | null = null;

/**
 * Set the Socket.IO server instance
 * @param socketServer The Socket.IO server instance
 */
export function setSocketServer(socketServer: SocketServer) {
  io = socketServer;
}

/**
 * Extract code blocks from a markdown string
 * @param markdown The markdown string to parse
 * @returns Array of code blocks with language and content
 */
/**
 * Process a response for code artifacts and emit them to the client
 * This function is now a fallback for non-streaming responses
 * @param content The response content to process
 * @param socketId The socket ID to emit artifacts to
 */
function processResponseForArtifacts(content: string, socketId: string) {
  // Extract code blocks from the content
  const codeBlocks = extractCodeBlocks(content);
  
  // Send each substantial code block as an artifact
  codeBlocks.forEach((codeBlock, index) => {
    // Using non-null assertion since we've already checked io is not null in the calling function
    io!.to(socketId).emit("artifact:new", {
      id: `artifact-${Date.now()}-${index}`,
      content: `\`\`\`${codeBlock.language}\n${codeBlock.content}\n\`\`\``,
      language: codeBlock.language,
      title: codeBlock.title || `Code Artifact ${index + 1}`
    });
  });
  
  // Return a clean version of the content with artifact tags removed
  return content.replace(/<CODE_ARTIFACT>[\s\S]*?<\/CODE_ARTIFACT>/g, '');
}

/**
 * Extract code blocks from a markdown string
 * @param markdown The markdown string to parse
 * @returns Array of code blocks with language and content
 */
function extractCodeBlocks(markdown: string) {
  // First try to extract code blocks using the <CODE_ARTIFACT> tags
  const taggedCodeBlockRegex = /<CODE_ARTIFACT>\s*```([\w-]*)?\s*([\s\S]*?)```\s*<\/CODE_ARTIFACT>/g;
  const codeBlocks = [];
  let match;

  // Try to find code blocks with our special tags
  while ((match = taggedCodeBlockRegex.exec(markdown)) !== null) {
    const language = match[1]?.trim() || 'text';
    const content = match[2].trim();
    
    // Extract title from first line if it contains filename
    let title = `${language.charAt(0).toUpperCase() + language.slice(1)} Code`;
    const firstLine = content.split('\n')[0];
    if (firstLine && firstLine.includes('filename:')) {
      title = firstLine.replace('//', '').trim();
    }
    
    codeBlocks.push({
      language,
      content,
      title
    });
  }

  // If no tagged blocks found, fall back to regular code block extraction
  if (codeBlocks.length === 0) {
    const codeBlockRegex = /```([\w-]*)?\n([\s\S]*?)```/g;
    
    while ((match = codeBlockRegex.exec(markdown)) !== null) {
      const language = match[1] || 'text';
      const content = match[2].trim();
      
      // Only include substantial code blocks (more than 5 lines or 100 chars)
      if (content.split('\n').length > 5 || content.length > 100) {
        // Extract title from first line if it contains filename
        let title = `${language.charAt(0).toUpperCase() + language.slice(1)} Code`;
        const firstLine = content.split('\n')[0];
        if (firstLine && firstLine.includes('filename:')) {
          title = firstLine.replace('//', '').trim();
        }
        
        codeBlocks.push({
          language,
          content,
          title
        });
      }
    }
  }

  return codeBlocks;
}

/**
 * Send a prompt to OpenAI and get a response, or process a pre-generated response for artifacts
 * @param prompt The user's prompt
 * @param socketId Optional socket ID to send streaming responses
 * @param preGeneratedResponse Optional pre-generated response to process for artifacts
 * @returns The AI response (or void if processing a pre-generated response)
 */
export async function generateResponse(
  prompt: string, 
  socketId?: string, 
  preGeneratedResponse?: string
): Promise<string | void> {
  // If we have a pre-generated response, just process it for artifacts
  if (preGeneratedResponse) {
    if (io && socketId) {
      // Process the pre-generated response and return the cleaned content
      const cleanedContent = processResponseForArtifacts(preGeneratedResponse, socketId);
      return cleanedContent;
    }
    return; // No need to return anything if no socket connection
  }

  // Otherwise, generate a new response from OpenAI
  try {
    // For non-streaming responses
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: `You are a helpful assistant with programming expertise. 

Very important: When you're about to provide code, you MUST use the following format:

1. First, output the exact text "<CODE_ARTIFACT>" on its own line
2. Then provide the code block with language specification, like this:
   \`\`\`javascript
   // Your code here
   \`\`\`
3. After the code block, output the exact text "</CODE_ARTIFACT>" on its own line

For example:

<CODE_ARTIFACT>
\`\`\`javascript
function hello() {
  console.log('Hello world');
}
\`\`\`
</CODE_ARTIFACT>

If you're providing multiple code blocks as part of the same explanation, wrap each one separately.

For substantial code examples (complete files or components), include a filename comment:

<CODE_ARTIFACT>
\`\`\`javascript
// filename: example.js
// Your code here...
\`\`\`
</CODE_ARTIFACT>

This format is crucial as it helps our system distinguish between explanatory text and code examples.`
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = response.choices[0].message.content || "No response generated";
    
    // Process the response for artifacts and get cleaned content
    if (io && socketId) {
      const cleanedContent = processResponseForArtifacts(content, socketId);
      return cleanedContent;
    }

    // If no socket connection, just return the content as is
    return content;
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw new Error("Failed to generate response from OpenAI");
  }
}

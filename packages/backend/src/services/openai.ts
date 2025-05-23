import OpenAI from "openai";
import dotenv from "dotenv";
import {
  DEFAULT_SYSTEM_PROMPT,
  FRONTEND_SYSTEM_PROMPT,
  BACKEND_SYSTEM_PROMPT,
} from "../prompts/systemPrompt";

// Load environment variables from .env file
dotenv.config();

// Determine AI provider (lmstudio or openai)
const aiProvider = process.env.AI_PROVIDER || "openai";

// Export the provider for use in other files
export { aiProvider };

// Configuration based on provider
let apiKey: string;
let baseURL: string | undefined;
let defaultModel: string;

if (aiProvider === "lmstudio") {
  // LMStudio configuration
  apiKey = process.env.LMSTUDIO_API_KEY || "lm-studio";
  let rawBaseURL = process.env.LMSTUDIO_BASE_URL || "http://localhost:1234";

  // Ensure the baseURL ends with /v1 for LMStudio compatibility
  if (!rawBaseURL.endsWith("/v1") && !rawBaseURL.endsWith("/v1/")) {
    baseURL = rawBaseURL + "/v1";
  } else {
    baseURL = rawBaseURL.replace(/\/$/, ""); // Remove trailing slash if present
  }

  defaultModel = process.env.LMSTUDIO_MODEL || "gemma-3-1b-it";

  console.log(`🤖 Using LMStudio at ${baseURL} with model: ${defaultModel}`);
  console.log(
    `💡 Make sure LMStudio server is running and the model is loaded!`
  );
  console.log(
    `💡 If you get endpoint errors, check that the model identifier matches what's shown in LMStudio`
  );
} else {
  // OpenAI configuration
  apiKey = process.env.OPENAI_KEY || "";
  baseURL = undefined; // Use OpenAI's default base URL
  defaultModel = process.env.OPENAI_MODEL || "gpt-3.5-turbo";

  if (!apiKey) {
    console.error(
      "OpenAI API key is missing. Please add OPENAI_KEY to your .env file."
    );
    process.exit(1);
  }

  console.log(`🤖 Using OpenAI with model: ${defaultModel}`);
}

// Export the model for use in other files
export { defaultModel };

// Initialize OpenAI client (works with both OpenAI and LMStudio)
export const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: baseURL,
});

/**
 * Test the connection to the AI provider and list available models
 * This is helpful for debugging LMStudio setup
 */
export async function testConnection(): Promise<void> {
  if (aiProvider === "lmstudio") {
    try {
      console.log("🔍 Testing LMStudio connection...");
      const models = await openai.models.list();
      console.log("✅ LMStudio connection successful!");
      console.log("📋 Available models:");

      if (models.data && models.data.length > 0) {
        models.data.forEach((model) => {
          console.log(`   - ${model.id}`);
        });

        const modelExists = models.data.some((m) => m.id === defaultModel);
        if (!modelExists) {
          console.log(`⚠️  Model "${defaultModel}" not found in LMStudio.`);
          console.log(
            `💡 Available models: ${models.data.map((m) => m.id).join(", ")}`
          );
          console.log(
            `💡 Update LMSTUDIO_MODEL in your .env file to match one of the available models.`
          );
        } else {
          console.log(
            `✅ Model "${defaultModel}" is available and ready to use!`
          );
        }
      } else {
        console.log(
          "⚠️  No models loaded in LMStudio. Please load a model first."
        );
      }
    } catch (error) {
      console.error("❌ Failed to connect to LMStudio:", error);
      console.log(
        "💡 Make sure LMStudio is running and the server is started on the correct port."
      );
    }
  }
}

// Test connection on startup for LMStudio
if (aiProvider === "lmstudio") {
  // Run connection test after a short delay to allow server startup
  setTimeout(testConnection, 1000);
}

/**
 * Extract code blocks from a markdown string and return artifacts with cleaned text
 */
export function extractArtifacts(content: string) {
  const codeBlocks = extractCodeBlocks(content);
  const artifacts = codeBlocks.map((block, index) => ({
    id: `artifact-${Date.now()}-${index}`,
    content: block.content,
    language: block.language,
    title: block.title || `Code Artifact ${index + 1}`,
  }));

  let cleaned = content.replace(
    /<CODE_ARTIFACT>[\s\S]*?<\/CODE_ARTIFACT>/g,
    ""
  );
  cleaned = cleaned.replace(/```[\w-]*\n([\s\S]*?)```/g, "");

  return { cleaned, artifacts };
}

/**
 * Extract code blocks from a markdown string
 * @param markdown The markdown string to parse
 * @returns Array of code blocks with language and content
 */
function extractCodeBlocks(markdown: string) {
  // First try to extract code blocks using the <CODE_ARTIFACT> tags
  const taggedCodeBlockRegex = /<CODE_ARTIFACT>\s*([\s\S]*?)<\/CODE_ARTIFACT>/g;
  const codeBlocks = [];
  let match;

  // Try to find code blocks with our special tags
  while ((match = taggedCodeBlockRegex.exec(markdown)) !== null) {
    const artifactContent = match[1].trim();

    // Extract code block from artifact content
    const codeBlockMatch = artifactContent.match(/```([\w-]*)?\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      const language = codeBlockMatch[1]?.trim() || "text";
      const content = codeBlockMatch[2].trim();

      // Extract title from first line if it contains filename
      let title = `${
        language.charAt(0).toUpperCase() + language.slice(1)
      } Code`;
      const firstLine = content.split("\n")[0];
      if (firstLine && firstLine.includes("filename:")) {
        title = firstLine.replace("//", "").trim();
      }

      codeBlocks.push({
        language,
        content,
        title,
      });
    } else {
      // If no code block found in artifact, use the entire artifact content
      codeBlocks.push({
        language: "text",
        content: artifactContent,
        title: "Code Artifact",
      });
    }
  }

  // If no tagged blocks found, fall back to regular code block extraction
  if (codeBlocks.length === 0) {
    const codeBlockRegex = /```([\w-]*)?\n([\s\S]*?)```/g;

    while ((match = codeBlockRegex.exec(markdown)) !== null) {
      const language = match[1] || "text";
      const content = match[2].trim();

      // Extract title from first line if it contains filename
      let title = `${
        language.charAt(0).toUpperCase() + language.slice(1)
      } Code`;
      const firstLine = content.split("\n")[0];
      if (firstLine && firstLine.includes("filename:")) {
        title = firstLine.replace("//", "").trim();
      }

      codeBlocks.push({
        language,
        content,
        title,
      });
    }
  }

  return codeBlocks;
}

/**
 * Send a prompt to the AI provider (OpenAI or LMStudio) and get a response, or process a pre-generated response for artifacts
 * @param prompt The user's prompt
 * @param socketId Optional socket ID to send streaming responses
 * @param preGeneratedResponse Optional pre-generated response to process for artifacts
 * @returns The AI response (or void if processing a pre-generated response)
 */
/**
 * Various system prompt types for different contexts
 */
export enum PromptType {
  DEFAULT = "default",
  FRONTEND = "frontend",
  BACKEND = "backend",
}

/**
 * Get the appropriate system prompt based on the prompt type
 * @param type The type of prompt to use
 * @returns The system prompt as a string
 */
export function getSystemPrompt(type: PromptType = PromptType.DEFAULT): string {
  switch (type) {
    case PromptType.FRONTEND:
      return FRONTEND_SYSTEM_PROMPT;
    case PromptType.BACKEND:
      return BACKEND_SYSTEM_PROMPT;
    case PromptType.DEFAULT:
    default:
      return DEFAULT_SYSTEM_PROMPT;
  }
}

/**
 * Generate a response from the AI provider (OpenAI or LMStudio) or process a pre-generated response
 * @param prompt The user's prompt
 * @param socketId Optional socket ID for streaming responses
 * @param preGeneratedResponse Optional pre-generated response
 * @param promptType Optional prompt type to determine system message
 * @returns The AI response or void if processing a pre-generated response
 */
export async function generateResponse(
  prompt: string,
  _socketId?: string,
  preGeneratedResponse?: string,
  promptType: PromptType = PromptType.DEFAULT
): Promise<string> {
  // If we have a pre-generated response, just return cleaned content
  if (preGeneratedResponse) {
    const { cleaned } = extractArtifacts(preGeneratedResponse);
    return cleaned;
  }

  // Otherwise, generate a new response from the AI provider
  try {
    // For non-streaming responses
    const response = await openai.chat.completions.create({
      model: defaultModel,
      messages: [
        {
          role: "system",
          content: getSystemPrompt(promptType),
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content =
      response.choices[0].message.content || "No response generated";

    // Clean the response of artifact tags
    const { cleaned } = extractArtifacts(content);
    return cleaned;
  } catch (error) {
    console.error(`Error calling ${aiProvider.toUpperCase()} API:`, error);
    throw new Error(
      `Failed to generate response from ${aiProvider.toUpperCase()}`
    );
  }
}

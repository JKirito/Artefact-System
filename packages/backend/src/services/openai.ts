import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Check if OpenAI API key is available
const apiKey = process.env.OPENAI_KEY;
if (!apiKey) {
  console.error('OpenAI API key is missing. Please add OPENAI_KEY to your .env file.');
  process.exit(1);
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: apiKey,
});

/**
 * Send a prompt to OpenAI and get a response
 * @param prompt The user's prompt
 * @returns The AI response
 */
export async function generateResponse(prompt: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0].message.content || 'No response generated';
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw new Error('Failed to generate response from OpenAI');
  }
}

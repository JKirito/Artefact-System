import { Server, Socket } from 'socket.io';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
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

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    // Handle chat messages
    socket.on('chat:message', async (message: string) => {
      try {
        console.log(`Received message from ${socket.id}:`, message);
        
        // Emit a message received event
        socket.emit('chat:typing', { status: true });
        
        // Create a streaming completion
        const stream = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: message }
          ],
          stream: true,
          temperature: 0.7,
          max_tokens: 1000,
        });
        
        let fullResponse = '';
        
        // Process the stream
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullResponse += content;
            // Emit each chunk to the client
            socket.emit('chat:response:chunk', { content });
          }
        }
        
        // Emit the complete response when done
        socket.emit('chat:response:complete', { 
          id: Date.now().toString(),
          content: fullResponse 
        });
        
        // Emit typing stopped
        socket.emit('chat:typing', { status: false });
        
      } catch (error) {
        console.error('Error processing message:', error);
        socket.emit('chat:error', { 
          message: 'Failed to process your message. Please try again.' 
        });
        socket.emit('chat:typing', { status: false });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}

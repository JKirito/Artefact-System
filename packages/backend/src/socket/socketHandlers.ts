import { Server, Socket } from 'socket.io';
import { generateResponse, setSocketServer } from '../services/openai';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Define types for our response queue
interface QueuedChunk {
  type: 'text' | 'artifact-start' | 'artifact-content' | 'artifact-end';
  content: string;
}

// Artifact state interface
interface ArtifactState {
  id: string;
  content: string;
  language?: string;
  title?: string;
  isComplete: boolean;
}

// Load environment variables
dotenv.config();

// Check if OpenAI API key is available
const apiKey = process.env.OPENAI_KEY;
if (!apiKey) {
  console.error('OpenAI API key is missing. Please add OPENAI_KEY to your .env file.');
  process.exit(1);
}

// Initialize OpenAI client for streaming
const openai = new OpenAI({
  apiKey: apiKey,
});

// Process the queue of chunks and send to client
function processQueue(socket: Socket, queue: QueuedChunk[], artifactState: ArtifactState, forceClear: boolean = false) {
  // Collect all text chunks to send at once
  let textToSend = '';
  
  // Process chunks until we hit an artifact marker or empty the queue
  while (queue.length > 0) {
    const chunk = queue[0];
    
    if (chunk.type === 'text') {
      // Accumulate text chunks
      textToSend += chunk.content;
      queue.shift(); // Remove the processed chunk
    } else if (chunk.type === 'artifact-start') {
      // We've hit an artifact start, so send any accumulated text first
      if (textToSend) {
        socket.emit('chat:response:chunk', { content: textToSend });
        textToSend = '';
      }
      queue.shift(); // Remove the artifact-start marker
      // Don't process further until we have the complete artifact
      if (!forceClear) break;
    } else if (chunk.type === 'artifact-content') {
      // Just remove artifact content chunks, they're accumulated in artifactState
      queue.shift();
    } else if (chunk.type === 'artifact-end') {
      // We've hit the end of an artifact, finalize and send it
      finalizeArtifact(socket, artifactState);
      queue.shift(); // Remove the artifact-end marker
    }
  }
  
  // Send any remaining text
  if (textToSend) {
    socket.emit('chat:response:chunk', { content: textToSend });
  }
}

// Finalize and send an artifact to the client
function finalizeArtifact(socket: Socket, artifactState: ArtifactState) {
  if (!artifactState.id) return;
  
  // Extract code from the artifact if not already done
  if (!artifactState.language) {
    const codeMatch = artifactState.content.match(/```([\w-]*)\s*([\s\S]*?)```/);
    if (codeMatch) {
      const language = codeMatch[1]?.trim() || 'text';
      const code = codeMatch[2].trim();
      
      // Extract title from first line if it contains filename
      let title = `${language.charAt(0).toUpperCase() + language.slice(1)} Code`;
      const firstLine = code.split('\n')[0];
      if (firstLine && firstLine.includes('filename:')) {
        title = firstLine.replace('//', '').trim();
      }
      
      artifactState.language = language;
      artifactState.title = title;
    }
  }
  
  // Send the artifact to the client
  if (artifactState.content) {
    const codeMatch = artifactState.content.match(/```([\w-]*)\s*([\s\S]*?)```/);
    if (codeMatch) {
      const language = artifactState.language || codeMatch[1]?.trim() || 'text';
      const code = codeMatch[2].trim();
      
      socket.emit('artifact:new', {
        id: artifactState.id,
        content: `\`\`\`${language}\n${code}\n\`\`\``,
        language,
        title: artifactState.title || `${language.charAt(0).toUpperCase() + language.slice(1)} Code`
      });
    }
  }
  
  // Reset the artifact state
  artifactState.id = '';
  artifactState.content = '';
  artifactState.language = undefined;
  artifactState.title = undefined;
  artifactState.isComplete = false;
}

export function setupSocketHandlers(io: Server) {
  console.log('Setting up socket handlers...');
  
  // Set the Socket.IO server in the OpenAI service
  setSocketServer(io);
  
  // Log all socket events for debugging
  io.engine.on('connection', (socket) => {
    console.log('New transport connection:', socket.id);
  });
  
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);
    console.log('Transport used:', socket.conn.transport.name);

    // Handle chat messages
    socket.on('chat:message', async (message: string) => {
      try {
        console.log(`Received message from ${socket.id}:`, message);
        
        // Emit a message received event to indicate typing has started
        socket.emit('chat:typing', { status: true });
        
        // Create a streaming completion for real-time responses
        const stream = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { 
              role: 'system', 
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
            { role: 'user', content: message }
          ],
          stream: true,
          temperature: 0.7,
          max_tokens: 1500,
        });
        
        let fullResponse = '';
        
        // Queue to hold chunks for processing
        const chunkQueue: QueuedChunk[] = [];
        
        // Artifact state
        const artifactState: ArtifactState = {
          id: '',
          content: '',
          isComplete: false
        };
        
        // Process the stream
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullResponse += content;
            
            // Process content to identify and queue chunks
            if (content.includes('<CODE_ARTIFACT>')) {
              // Split content by the artifact marker
              const parts = content.split('<CODE_ARTIFACT>');
              
              // Add any text before the marker to the queue
              if (parts[0] && parts[0].trim()) {
                chunkQueue.push({
                  type: 'text',
                  content: parts[0]
                });
              }
              
              // Start a new artifact
              artifactState.id = uuidv4();
              artifactState.content = '';
              artifactState.isComplete = false;
              
              // Add the artifact start marker to the queue
              chunkQueue.push({
                type: 'artifact-start',
                content: ''
              });
              
              // If there's content after the marker, add it to the artifact content
              if (parts.length > 1 && parts[1]) {
                chunkQueue.push({
                  type: 'artifact-content',
                  content: parts[1]
                });
                artifactState.content += parts[1];
              }
            } else if (content.includes('</CODE_ARTIFACT>')) {
              // Split content by the end marker
              const parts = content.split('</CODE_ARTIFACT>');
              
              // Add the content before the end marker to the artifact
              if (parts[0]) {
                chunkQueue.push({
                  type: 'artifact-content',
                  content: parts[0]
                });
                artifactState.content += parts[0];
              }
              
              // Mark the artifact as complete
              chunkQueue.push({
                type: 'artifact-end',
                content: ''
              });
              artifactState.isComplete = true;
              
              // Extract code from the artifact
              const codeMatch = artifactState.content.match(/```([\w-]*)\s*([\s\S]*?)```/);
              if (codeMatch) {
                const language = codeMatch[1]?.trim() || 'text';
                const code = codeMatch[2].trim();
                
                // Extract title from first line if it contains filename
                let title = `${language.charAt(0).toUpperCase() + language.slice(1)} Code`;
                const firstLine = code.split('\n')[0];
                if (firstLine && firstLine.includes('filename:')) {
                  title = firstLine.replace('//', '').trim();
                }
                
                // Update artifact state with extracted info
                artifactState.language = language;
                artifactState.title = title;
              }
              
              // If there's content after the end marker, add it as text
              if (parts.length > 1 && parts[1]) {
                chunkQueue.push({
                  type: 'text',
                  content: parts[1]
                });
              }
            } else {
              // If we're not at a marker, determine if this is part of an artifact or regular text
              if (!artifactState.isComplete && artifactState.id) {
                // We're in the middle of an artifact
                chunkQueue.push({
                  type: 'artifact-content',
                  content: content
                });
                artifactState.content += content;
              } else {
                // Regular text
                chunkQueue.push({
                  type: 'text',
                  content: content
                });
              }
            }
            
            // Process the queue to send chunks to the client
            processQueue(socket, chunkQueue, artifactState);
          }
        }
        
        // Process any remaining items in the queue
        if (chunkQueue.length > 0) {
          processQueue(socket, chunkQueue, artifactState, true);
        }
        
        // If there's an incomplete artifact, finalize it
        if (artifactState.id && !artifactState.isComplete) {
          finalizeArtifact(socket, artifactState);
        }
        
        // Create a clean version of the response without artifact tags
        const cleanResponse = fullResponse.replace(/<CODE_ARTIFACT>[\s\S]*?<\/CODE_ARTIFACT>/g, '');
        
        // Emit the complete response when done
        socket.emit('chat:response:complete', { 
          id: Date.now().toString(),
          content: cleanResponse 
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

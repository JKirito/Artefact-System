import { Server, Socket } from 'socket.io';
import { generateResponse, setSocketServer, PromptType, getSystemPrompt } from '../services/openai';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

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

// Helper function to process artifacts from the content
function extractArtifactsFromContent(content: string, socket: Socket) {
  // Look for code artifact tags
  const artifactRegex = /<CODE_ARTIFACT>([\s\S]*?)<\/CODE_ARTIFACT>/g;
  let match;
  let artifactsFound = 0;
  
  // Find all artifacts and extract them
  while ((match = artifactRegex.exec(content)) !== null) {
    const artifactContent = match[1].trim();
    artifactsFound++;
    
    // Extract code block from artifact content
    const codeBlockMatch = artifactContent.match(/```([\w-]*)?\n([\s\S]*?)```/);
    
    if (codeBlockMatch) {
      const language = codeBlockMatch[1]?.trim() || 'text';
      const code = codeBlockMatch[2].trim();
      
      // Extract title from first line if it contains filename
      let title = `${language.charAt(0).toUpperCase() + language.slice(1)} Code`;
      const firstLine = code.split('\n')[0];
      if (firstLine && firstLine.includes('filename:')) {
        title = firstLine.replace('//', '').trim();
      }
      
      // Send the artifact to the client
      socket.emit('artifact:new', {
        id: `artifact-${Date.now()}-${artifactsFound}`,
        content: code,
        language,
        title
      });
    } else {
      // If no code block found, use the entire artifact content
      socket.emit('artifact:new', {
        id: `artifact-${Date.now()}-${artifactsFound}`,
        content: artifactContent,
        language: 'text',
        title: 'Code Artifact'
      });
    }
  }
  
  // Return a clean version without the artifact tags
  return content.replace(/<CODE_ARTIFACT>([\s\S]*?)<\/CODE_ARTIFACT>/g, '');
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
    socket.on('chat:message', async (message: { content: string; promptType?: string }) => {
      try {
        // Extract message content and prompt type if present
        const messageContent = typeof message === 'string' ? message : message.content;
        let promptType = PromptType.DEFAULT;
        
        // Determine the prompt type
        if (typeof message === 'object' && message.promptType) {
          switch(message.promptType.toLowerCase()) {
            case 'frontend':
              promptType = PromptType.FRONTEND;
              break;
            case 'backend':
              promptType = PromptType.BACKEND;
              break;
            default:
              promptType = PromptType.DEFAULT;
          }
        }
        
        console.log(`Received message from ${socket.id}:`, messageContent);
        console.log(`Using prompt type: ${promptType}`);
        
        // Emit a message received event to indicate typing has started
        socket.emit('chat:typing', { status: true });
        
        // Create a streaming completion for real-time responses
        const stream = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: getSystemPrompt(promptType) },
            { role: 'user', content: messageContent }
          ],
          stream: true,
          temperature: 0.7,
          max_tokens: 1500,
        });
        
        let fullResponse = '';
        let bufferedContent = ''; // Buffer to accumulate content that might contain artifact tags
        
        // Process the stream
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullResponse += content;
            bufferedContent += content;
            
            // Check if we have a complete artifact tag (both opening and closing tags)
            if (bufferedContent.includes('<CODE_ARTIFACT>') && bufferedContent.includes('</CODE_ARTIFACT>')) {
              // Find all complete artifact tags in the buffer
              const regex = /<CODE_ARTIFACT>([\s\S]*?)<\/CODE_ARTIFACT>/g;
              let match;
              let lastIndex = 0;
              let newBuffer = '';
              
              // Process each complete artifact tag
              while ((match = regex.exec(bufferedContent)) !== null) {
                // Send any text before the artifact tag
                if (match.index > lastIndex) {
                  const textBefore = bufferedContent.substring(lastIndex, match.index);
                  if (textBefore.trim()) {
                    socket.emit('chat:response:chunk', { content: textBefore });
                  }
                }
                
                // Process the artifact
                const artifactContent = match[1].trim();
                
                // Extract code block from artifact content
                const codeBlockMatch = artifactContent.match(/```([\w-]*)?\n([\s\S]*?)```/);
                
                if (codeBlockMatch) {
                  const language = codeBlockMatch[1]?.trim() || 'text';
                  const code = codeBlockMatch[2].trim();
                  
                  // Extract title from first line if it contains filename
                  let title = `${language.charAt(0).toUpperCase() + language.slice(1)} Code`;
                  const firstLine = code.split('\n')[0];
                  if (firstLine && firstLine.includes('filename:')) {
                    title = firstLine.replace('//', '').trim();
                  }
                  
                  // Send the artifact to the client
                  socket.emit('artifact:new', {
                    id: `artifact-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    content: code,
                    language,
                    title
                  });
                } else {
                  // If no code block found, use the entire artifact content
                  socket.emit('artifact:new', {
                    id: `artifact-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    content: artifactContent,
                    language: 'text',
                    title: 'Code Artifact'
                  });
                }
                
                lastIndex = match.index + match[0].length;
              }
              
              // Keep any remaining content after the last artifact tag
              if (lastIndex < bufferedContent.length) {
                newBuffer = bufferedContent.substring(lastIndex);
              }
              
              bufferedContent = newBuffer;
            } 
            // If we don't have complete tags yet, but the buffer is getting large, 
            // or if we don't have any artifact tags at all, send the content
            else if (!bufferedContent.includes('<CODE_ARTIFACT>') || bufferedContent.length > 500) {
              // Send the entire buffer if it doesn't contain any artifact tags
              if (!bufferedContent.includes('<CODE_ARTIFACT>')) {
                socket.emit('chat:response:chunk', { content: bufferedContent });
                bufferedContent = '';
              }
              // Otherwise, try to send any content before the first artifact tag
              else if (bufferedContent.includes('<CODE_ARTIFACT>')) {
                const parts = bufferedContent.split('<CODE_ARTIFACT>');
                if (parts[0] && parts[0].trim()) {
                  socket.emit('chat:response:chunk', { content: parts[0] });
                  // Keep only the part after the tag in the buffer
                  bufferedContent = '<CODE_ARTIFACT>' + parts.slice(1).join('<CODE_ARTIFACT>');
                }
              }
            }
          }
        }
        
        // Process any remaining buffered content
        if (bufferedContent) {
          // Check if there are any artifact tags in the remaining buffer
          if (bufferedContent.includes('<CODE_ARTIFACT>')) {
            const regex = /<CODE_ARTIFACT>([\s\S]*?)<\/CODE_ARTIFACT>/g;
            let match;
            let lastIndex = 0;
            
            // Process each complete artifact tag
            while ((match = regex.exec(bufferedContent)) !== null) {
              // Send any text before the artifact tag
              if (match.index > lastIndex) {
                const textBefore = bufferedContent.substring(lastIndex, match.index);
                if (textBefore.trim()) {
                  socket.emit('chat:response:chunk', { content: textBefore });
                }
              }
              
              // Process the artifact
              const artifactContent = match[1].trim();
              
              // Extract code block from artifact content
              const codeBlockMatch = artifactContent.match(/```([\w-]*)?\n([\s\S]*?)```/);
              
              if (codeBlockMatch) {
                const language = codeBlockMatch[1]?.trim() || 'text';
                const code = codeBlockMatch[2].trim();
                
                // Extract title from first line if it contains filename
                let title = `${language.charAt(0).toUpperCase() + language.slice(1)} Code`;
                const firstLine = code.split('\n')[0];
                if (firstLine && firstLine.includes('filename:')) {
                  title = firstLine.replace('//', '').trim();
                }
                
                // Send the artifact to the client
                socket.emit('artifact:new', {
                  id: `artifact-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                  content: code,
                  language,
                  title
                });
              } else {
                // If no code block found, use the entire artifact content
                socket.emit('artifact:new', {
                  id: `artifact-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                  content: artifactContent,
                  language: 'text',
                  title: 'Code Artifact'
                });
              }
              
              lastIndex = match.index + match[0].length;
            }
            
            // Send any remaining text after the last artifact tag
            if (lastIndex < bufferedContent.length) {
              const textAfter = bufferedContent.substring(lastIndex);
              if (textAfter.trim()) {
                socket.emit('chat:response:chunk', { content: textAfter });
              }
            }
          } else {
            // If no artifact tags, just send the entire buffer
            if (bufferedContent.trim()) {
              socket.emit('chat:response:chunk', { content: bufferedContent });
            }
          }
        }
        
        // Create a clean version of the full response without artifact tags
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

    // Handle generate-with-prompt message
    socket.on('chat:generate-with-prompt', async (data: { prompt: string; promptType?: string }) => {
      try {
        console.log(`Generating response for prompt from ${socket.id}`);
        
        // Determine prompt type
        let promptType = PromptType.DEFAULT;
        if (data.promptType) {
          switch(data.promptType.toLowerCase()) {
            case 'frontend':
              promptType = PromptType.FRONTEND;
              break;
            case 'backend':
              promptType = PromptType.BACKEND;
              break;
            default:
              promptType = PromptType.DEFAULT;
          }
        }
        
        console.log(`Using prompt type: ${promptType}`);
        
        // Generate the response with the specified prompt type
        const response = await generateResponse(data.prompt, socket.id, undefined, promptType);
        
        console.log('Response generation completed');
      } catch (error) {
        console.error('Error generating response:', error);
        socket.emit('chat:error', { message: 'Failed to generate response' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}

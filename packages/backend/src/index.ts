import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import openaiRoutes from './routes/openai.routes';
import { setupSocketHandlers } from './socket/socketHandlers';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
const PORT = process.env.PORT || 3001;

// Setup Socket.IO handlers
setupSocketHandlers(io);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Backend API is running!' });
});

// Health check endpoint - moved under /api prefix
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy' });
});

// OpenAI API routes
app.use('/api/openai', openaiRoutes);

// Only start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  httpServer.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`WebSocket server is running`);
  });
}

export { app };

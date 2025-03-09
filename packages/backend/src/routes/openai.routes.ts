import express from 'express';
import { handlePrompt } from '../controllers/openai.controller';

const router = express.Router();

// POST endpoint to handle OpenAI prompts
router.post('/prompt', handlePrompt);

export default router;

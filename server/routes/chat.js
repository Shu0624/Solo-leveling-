import express from 'express';
import rateLimit from 'express-rate-limit';
import { protectTokenOnly } from '../middleware/auth.js';
import { getAIChatResponse } from '../services/chatService.js';

const router = express.Router();

// Rate limit AI chat — prevents Groq API abuse
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 30,                    // 30 messages per 15 min per IP
  message: { message: 'Too many requests. Please slow down and try again in a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// @desc    Chat with AI mentor
// @route   POST /api/chat
// @access  Private
router.post('/', protectTokenOnly, chatLimiter, async (req, res) => {
  try {
    const { topic, message, questionIndex, projectDescription, history } = req.body;

    // Input validation
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message is required' });
    }
    if (message.length > 20000) {
      return res.status(400).json({ message: 'Message too long (max 20000 characters)' });
    }
    if (projectDescription && projectDescription.length > 10000) {
      return res.status(400).json({ message: 'Project description too long (max 10000 characters)' });
    }

    // Sanitize conversation history (limit to last 10 messages to control token usage)
    const sanitizedHistory = Array.isArray(history)
      ? history
          .slice(-10)
          .filter(m => m && typeof m.role === 'string' && typeof m.text === 'string')
          .map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.text.substring(0, 3000),
          }))
      : [];

    const sanitizedMessage = message.trim().substring(0, 20000);
    const response = await getAIChatResponse(topic || 'hr', sanitizedMessage, questionIndex || 0, projectDescription, sanitizedHistory);
    res.status(200).json({ ...response, score: response.score || 0 });
  } catch (err) {
    res.status(500).json({ message: 'Chat failed' });
  }
});

export default router;

import express from 'express';
import { protect } from '../middleware/auth.js';
import InterviewSession from '../models/InterviewSession.js';

import { z } from 'zod';

const router = express.Router();

const saveSessionSchema = z.object({
  topic: z.string().trim().max(100).default('hr'),
  messagesCount: z.number().int().min(0).max(1000).default(0),
  durationSeconds: z.number().int().min(0).max(86400).default(0),
  score: z.number().min(0).max(100).default(0),
  messages: z.array(
    z.object({
      role: z.string(),
      text: z.string(),
      score: z.number().optional()
    })
  ).optional()
});

// @desc    Save a completed AI interview session
// @route   POST /api/interview/session
// @access  Private
router.post('/session', protect, async (req, res) => {
  try {
    const validated = saveSessionSchema.parse(req.body);
    const { topic, messagesCount, durationSeconds, score, messages } = validated;

    const session = await InterviewSession.create({
      host: req.user._id,
      roomId: `ai-${Date.now().toString(36)}`,
      type: 'mock-interview',
      status: 'completed',
      topic,
      messagesCount,
      aiScore: score,
      startedAt: new Date(Date.now() - durationSeconds * 1000),
      endedAt: new Date(),
      messages: messages || []
    });

    res.status(201).json({
      message: 'Interview session saved',
      session: {
        _id: session._id,
        topic: session.topic,
        messagesCount: session.messagesCount,
        durationSeconds,
        aiScore: session.aiScore,
        completedAt: session.endedAt
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error('Save interview session error:', err);
    res.status(500).json({ message: 'Failed to save interview session' });
  }
});

// @desc    Get interview history for current user
// @route   GET /api/interview/history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const sessions = await InterviewSession.find({ host: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Calculate duration for each session
    const formatted = sessions.map(s => ({
      _id: s._id,
      topic: s.topic || 'hr',
      type: s.type,
      status: s.status,
      messagesCount: s.messagesCount || 0,
      aiScore: s.aiScore || 0,
      durationSeconds: s.startedAt && s.endedAt
        ? Math.round((new Date(s.endedAt) - new Date(s.startedAt)) / 1000)
        : 0,
      completedAt: s.endedAt || s.createdAt
    }));

    res.status(200).json({
      total: formatted.length,
      sessions: formatted
    });
  } catch (err) {
    console.error('Interview history error:', err);
    res.status(500).json({ message: 'Failed to fetch interview history' });
  }
});

// @desc    Get detailed interview session with transcript messages
// @route   GET /api/interview/session/:id
// @access  Private
router.get('/session/:id', protect, async (req, res) => {
  try {
    const session = await InterviewSession.findOne({ _id: req.params.id, host: req.user._id }).lean();
    if (!session) {
      return res.status(404).json({ message: 'Interview session not found' });
    }
    res.status(200).json({ session });
  } catch (err) {
    console.error('Fetch interview session error:', err);
    res.status(500).json({ message: 'Failed to fetch interview session' });
  }
});

export default router;

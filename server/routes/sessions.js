import express from 'express';
import { protect } from '../middleware/auth.js';
import Session from '../models/Session.js';
import DailyAnalytics from '../models/DailyAnalytics.js';
import {
  startSession, endSession, getActiveSession, getActiveSessions, getStats
} from '../services/sessionManager.js';

const router = express.Router();

// @desc    Start a new tracking session
// @route   POST /api/sessions/start
router.post('/start', protect, async (req, res) => {
  try {
    const { category, label, source, deviceInfo } = req.body;
    if (!category) {
      return res.status(400).json({ message: 'Category is required' });
    }

    const result = await startSession(req.user._id, {
      category,
      label,
      source,
      deviceInfo,
      userName: req.user.name,
      classroomCode: req.user.classroomCode,
    }, req.app.get('io'));

    res.status(201).json(result);
  } catch (err) {
    console.error('[Sessions] Start error:', err);
    res.status(500).json({ message: 'Failed to start session' });
  }
});

// @desc    End an active session
// @route   POST /api/sessions/end
router.post('/end', protect, async (req, res) => {
  try {
    const result = await endSession(null, req.user._id, req.app.get('io'));
    if (result.error) {
      return res.status(404).json({ message: result.error });
    }

    // Dispatch event for dashboard refresh
    res.status(200).json(result);
  } catch (err) {
    console.error('[Sessions] End error:', err);
    res.status(500).json({ message: 'Failed to end session' });
  }
});

// @desc    Get current active session
// @route   GET /api/sessions/active
router.get('/active', protect, (req, res) => {
  const session = getActiveSession(req.user._id);
  res.json(session || { active: false });
});

// @desc    Get session history for current user
// @route   GET /api/sessions/history
router.get('/history', protect, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const sessions = await Session.find({
      user: req.user._id,
      status: { $in: ['completed', 'abandoned'] },
    })
      .sort({ startTime: -1 })
      .skip(Number(offset))
      .limit(Math.min(Number(limit), 50))
      .lean();

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch session history' });
  }
});

// @desc    Get today's analytics for current user
// @route   GET /api/sessions/today
router.get('/today', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daily = await DailyAnalytics.findOne({
      user: req.user._id,
      date: today,
    }).lean();

    const activeSession = getActiveSession(req.user._id);

    // Get today's completed sessions for breakdown
    const todaySessions = await Session.find({
      user: req.user._id,
      startTime: { $gte: today },
      status: { $in: ['completed', 'abandoned'] },
    })
      .sort({ startTime: -1 })
      .lean();

    res.json({
      daily: daily || {
        totalTime: 0,
        activeTime: 0,
        idleTime: 0,
        sessionCount: 0,
        focusScore: 0,
        categoryBreakdown: [],
        peakHours: [],
        consistency: 'none',
      },
      activeSession,
      sessions: todaySessions,
    });
  } catch (err) {
    console.error('[Sessions] Today error:', err);
    res.status(500).json({ message: 'Failed to fetch today data' });
  }
});

// @desc    Get live active sessions for a classroom (faculty)
// @route   GET /api/sessions/live/:classroomCode
router.get('/live/:classroomCode', protect, (req, res) => {
  const { classroomCode } = req.params;
  // Only faculty/admin roles should access this
  if (!['faculty', 'hod', 'principal', 'placement'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  const code = classroomCode === 'all' ? null : classroomCode;
  const sessions = getActiveSessions(code);
  res.json({ classroomCode, activeSessions: sessions, count: sessions.length });
});

// @desc    Session manager stats (debug/monitoring)
// @route   GET /api/sessions/stats
router.get('/stats', protect, (req, res) => {
  if (!['hod', 'principal', 'placement'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  res.json(getStats());
});

export default router;

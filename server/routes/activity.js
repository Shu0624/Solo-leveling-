import express from 'express';
import { protect } from '../middleware/auth.js';
import Activity from '../models/Activity.js';

const router = express.Router();

// @desc    Log a study session
// @route   POST /api/activity
router.post('/', protect, async (req, res) => {
  try {
    const { category, label, duration, type } = req.body;

    // Input validation
    if (!category || typeof category !== 'string') {
      return res.status(400).json({ message: 'Category is required' });
    }
    if (!duration || typeof duration !== 'number' || duration < 10 || duration > 43200) {
      return res.status(400).json({ message: 'Duration must be between 10 seconds and 12 hours (43200 seconds)' });
    }

    const activity = await Activity.create({
      user: req.user._id,
      classroomCode: req.user.classroomCode || '',
      department: req.user.department || '',
      college: req.user.college || '',
      category,
      label: label?.substring(0, 200) || category,
      duration: Math.round(duration),
      type: type || 'study',
      date: new Date()
    });
    res.status(201).json(activity);
  } catch (err) {
    res.status(500).json({ message: 'Failed to log activity' });
  }
});

// @desc    Get activity history (last 30 days)
// @route   GET /api/activity/history
router.get('/history', protect, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activities = await Activity.find({
      user: req.user._id,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: -1 }).limit(100);
    res.status(200).json(activities);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch history' });
  }
});

// @desc    Get analytics aggregations
// @route   GET /api/activity/analytics
router.get('/analytics', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Total time by category (all time)
    const byCategory = await Activity.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$category', totalSeconds: { $sum: '$duration' }, count: { $sum: 1 } } },
      { $sort: { totalSeconds: -1 } }
    ]);

    // 2. Daily totals for last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const daily = await Activity.aggregate([
      { $match: { user: userId, date: { $gte: sevenDaysAgo } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        totalSeconds: { $sum: '$duration' },
        sessions: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    // 3. Monthly total
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthlyAgg = await Activity.aggregate([
      { $match: { user: userId, date: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, totalSeconds: { $sum: '$duration' }, sessions: { $sum: 1 } } }
    ]);

    // 4. Today's total
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAgg = await Activity.aggregate([
      { $match: { user: userId, date: { $gte: today } } },
      { $group: { _id: null, totalSeconds: { $sum: '$duration' }, sessions: { $sum: 1 } } }
    ]);

    // 5. Streak (consecutive days with activity)
    const allDays = await Activity.aggregate([
      { $match: { user: userId } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } } } },
      { $sort: { _id: -1 } }
    ]);
    let streak = 0;
    const now = new Date();
    for (let i = 0; i < allDays.length; i++) {
      const expected = new Date(now);
      expected.setDate(expected.getDate() - i);
      const expectedStr = expected.toISOString().split('T')[0];
      if (allDays[i]._id === expectedStr) {
        streak++;
      } else break;
    }

    res.status(200).json({
      byCategory,
      daily,
      monthly: monthlyAgg[0] || { totalSeconds: 0, sessions: 0 },
      today: todayAgg[0] || { totalSeconds: 0, sessions: 0 },
      streak
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

export default router;

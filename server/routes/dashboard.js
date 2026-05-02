import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Progress from '../models/Progress.js';
import Event from '../models/Event.js';
import Note from '../models/Note.js';
import Resume from '../models/Resume.js';
import User from '../models/User.js';
import QuizAttempt from '../models/QuizAttempt.js';

const router = express.Router();

// =====================================================================
// STUDENT DASHBOARD
// =====================================================================

// @desc    Get student dashboard (real data)
// @route   GET /api/dashboard/student
// @access  Private/Student
router.get('/student', protect, authorize('student'), async (req, res) => {
  try {
    // 1. Get or create progress record
    let progress = await Progress.findOne({ user: req.user._id });
    if (!progress) {
      progress = await Progress.create({ user: req.user._id, modules: [], overallProgress: 0 });
    }

    // 2. Get upcoming events (next 30 days)
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const events = await Event.find({
      date: { $gte: now, $lte: thirtyDaysFromNow }
    }).sort({ date: 1 }).limit(5);

    // 3. Get latest resume score
    const resume = await Resume.findOne({ user: req.user._id });

    // 4. Get recent notes
    const notes = await Note.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(5);

    // 5. Get recent quiz attempts
    const recentAttempts = await QuizAttempt.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    // 6. Calculate category progress
    const categoryProgress = {
      programming: 0,
      ai: 0,
      aptitude: 0
    };
    if (progress.modules?.length > 0) {
      for (const mod of progress.modules) {
        const name = (mod.moduleName || '').toLowerCase();
        const completionRate = mod.completedLessons?.length > 0 ? Math.min(100, mod.completedLessons.length * 20) : 0;
        if (name.includes('java') || name.includes('python') || name.includes('programming')) {
          categoryProgress.programming = Math.max(categoryProgress.programming, completionRate);
        } else if (name.includes('ai') || name.includes('genai')) {
          categoryProgress.ai = Math.max(categoryProgress.ai, completionRate);
        } else if (name.includes('aptitude') || name.includes('reasoning')) {
          categoryProgress.aptitude = Math.max(categoryProgress.aptitude, completionRate);
        }
      }
    }

    // 7. Update streak logic
    let streakUpdated = false;
    const todayStr = new Date().toDateString();

    // Ensure streak object exists
    if (!req.user.streak) {
      req.user.streak = { current: 0, longest: 0, lastActiveDate: null };
    }

    if (!req.user.streak.lastActiveDate) {
      req.user.streak.current = 1;
      req.user.streak.longest = 1;
      req.user.streak.lastActiveDate = new Date();
      streakUpdated = true;
    } else {
      const lastActiveStr = new Date(req.user.streak.lastActiveDate).toDateString();
      if (todayStr !== lastActiveStr) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastActive = new Date(req.user.streak.lastActiveDate);
        lastActive.setHours(0, 0, 0, 0);
        const diffTime = Math.abs(today - lastActive);
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          req.user.streak.current += 1;
          if (req.user.streak.current > req.user.streak.longest) {
            req.user.streak.longest = req.user.streak.current;
          }
        } else if (diffDays > 1) {
          req.user.streak.current = 1;
        }
        req.user.streak.lastActiveDate = new Date();
        streakUpdated = true;
      }
    }

    if (streakUpdated) {
      // Use User.findByIdAndUpdate to avoid doc modified errors
      await User.findByIdAndUpdate(req.user._id, { streak: req.user.streak });
    }

    res.status(200).json({
      progress: categoryProgress,
      overallProgress: progress.overallProgress,
      events,
      resumeScore: resume?.analysis?.score || null,
      notes,
      recentAttempts: recentAttempts.map(a => ({
        quizId: a.quiz,
        score: a.score,
        percentage: a.percentage,
        completedAt: a.completedAt
      })),
      streak: req.user.streak
    });
  } catch (err) {
    console.error('Student dashboard error:', err);
    res.status(500).json({ message: 'Failed to load dashboard' });
  }
});

// =====================================================================
// HIERARCHY ADMIN DASHBOARD (Faculty, HOD, Principal)
// =====================================================================

// @desc    Get hierarchical admin dashboard analytics
// @route   GET /api/dashboard/admin
// @access  Private/Faculty/HOD/Principal
router.get('/admin', protect, authorize('faculty', 'hod', 'principal', 'admin', 'placement'), async (req, res) => {
  try {
    const { role, department, college, year } = req.user;
    
    // Determine the base match filter for students
    let studentMatch = { role: 'student' };
    
    // Hierarchy Rules
    if (role === 'principal' || role === 'placement') {
      // Sees entire college
      if (college) studentMatch.college = college;
    } else if (role === 'hod') {
      // Sees entire department in their college
      if (college) studentMatch.college = college;
      if (department) studentMatch.department = department;
    } else if (role === 'faculty') {
      // Sees specific class (department + year if specified, else just department)
      if (college) studentMatch.college = college;
      if (department) studentMatch.department = department;
      if (year) studentMatch.year = year;
    }

    // 1. Get eligible student IDs for fast lookups
    const students = await User.find(studentMatch).select('_id name email department year');
    const studentIds = students.map(s => s._id);
    const totalStudents = students.length;

    // 2. Students active this week
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeThisWeek = await User.countDocuments({
      _id: { $in: studentIds },
      updatedAt: { $gte: oneWeekAgo }
    });

    // 3. Activity Time & Leaderboard
    const mongoose = (await import('mongoose')).default;
    // Need Activity model here, I will import it if missing. Let's assume it's imported or I will use mongoose.model
    const Activity = mongoose.model('Activity');
    
    const activityAgg = await Activity.aggregate([
      { $match: { user: { $in: studentIds } } },
      { $group: { 
          _id: '$user', 
          totalSeconds: { $sum: '$duration' },
          lastActive: { $max: '$date' }
      }},
      { $sort: { totalSeconds: -1 } },
      { $limit: 10 }
    ]);
    
    // Total hours studied across scope
    const totalSecondsOverall = activityAgg.reduce((acc, curr) => acc + curr.totalSeconds, 0);

    // Map top students
    const topStudents = activityAgg.map(a => {
      const stu = students.find(s => s._id.toString() === a._id.toString());
      return {
        id: a._id,
        name: stu?.name || 'Unknown',
        department: stu?.department,
        hours: Math.round(a.totalSeconds / 3600),
        lastActive: a.lastActive
      };
    });

    // 4. Average quiz score
    const quizAgg = await QuizAttempt.aggregate([
      { $match: { user: { $in: studentIds } } },
      { $group: { _id: null, avgScore: { $avg: '$percentage' }, totalAttempts: { $sum: 1 } } }
    ]);
    const avgQuizScore = quizAgg.length > 0 ? Math.round(quizAgg[0].avgScore || 0) : 0;
    const totalAttempts = quizAgg.length > 0 ? quizAgg[0].totalAttempts : 0;

    // 5. Average resume score
    const resumeAgg = await Resume.aggregate([
      { $match: { user: { $in: studentIds }, 'analysis.score': { $gt: 0 } } },
      { $group: { _id: null, avgResume: { $avg: '$analysis.score' } } }
    ]);
    const avgResumeScore = resumeAgg.length > 0 ? Math.round(resumeAgg[0].avgResume || 0) : 0;

    // 6. Recent quiz attempts (activity feed)
    const recentActivity = await QuizAttempt.find({ user: { $in: studentIds } })
      .populate('user', 'name email department')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      scope: {
        role,
        department: department || 'All',
        college: college || 'All',
        year: role === 'faculty' && year ? year : 'All Years'
      },
      stats: {
        totalStudents,
        activeThisWeek,
        avgQuizScore,
        avgResumeScore,
        totalAttempts,
        totalStudyHours: Math.round(totalSecondsOverall / 3600)
      },
      leaderboard: topStudents,
      recentActivity: recentActivity.map(a => ({
        studentName: a.user?.name || 'Unknown',
        department: a.user?.department || '',
        score: a.percentage,
        completedAt: a.completedAt || a.createdAt
      }))
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ message: 'Failed to load admin dashboard' });
  }
});

// =====================================================================
// NOTES CRUD
// =====================================================================

// @desc    Get all notes for current user
router.get('/notes', protect, async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user._id }).sort({ updatedAt: -1 });
    res.status(200).json(notes);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notes' });
  }
});

// @desc    Create a note
router.post('/notes', protect, async (req, res) => {
  try {
    const { title, content, topic, tags } = req.body;
    const note = await Note.create({
      user: req.user._id,
      title,
      content,
      topic,
      tags: tags || []
    });
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create note' });
  }
});

// @desc    Update a note
router.put('/notes/:id', protect, async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.status(200).json(note);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update note' });
  }
});

// @desc    Delete a note
router.delete('/notes/:id', protect, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.status(200).json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete note' });
  }
});

// =====================================================================
// EVENTS CRUD (Faculty can create, students can view)
// =====================================================================

// @desc    Get all events
router.get('/events', protect, async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// @desc    Create event (faculty only)
router.post('/events', protect, authorize('faculty', 'hod', 'principal'), async (req, res) => {
  try {
    const { title, description, type, date, link, college } = req.body;
    const event = await Event.create({
      title,
      description,
      type,
      date,
      link,
      college: college || 'General',
      createdBy: req.user._id
    });
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create event' });
  }
});

// @desc    Delete event (faculty only)
router.delete('/events/:id', protect, authorize('faculty', 'hod', 'principal'), async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.status(200).json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete event' });
  }
});

// =====================================================================
// DAILY TASKS CRUD
// =====================================================================

// @desc    Get today's tasks
// @route   GET /api/dashboard/tasks
router.get('/tasks', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const today = new Date().toDateString();
    const todayTasks = (user.dailyTasks || []).filter(
      t => new Date(t.date).toDateString() === today
    );
    res.status(200).json(todayTasks);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
});

// @desc    Add a new task
// @route   POST /api/dashboard/tasks
router.post('/tasks', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Task text required' });

    const user = await User.findById(req.user._id);
    const task = { text: text.trim(), completed: false, date: new Date() };
    user.dailyTasks.push(task);
    await user.save();

    const saved = user.dailyTasks[user.dailyTasks.length - 1];
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add task' });
  }
});

// @desc    Toggle task completion
// @route   PUT /api/dashboard/tasks/:taskId
router.put('/tasks/:taskId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const task = user.dailyTasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.completed = !task.completed;
    await user.save();
    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update task' });
  }
});

// @desc    Delete a task
// @route   DELETE /api/dashboard/tasks/:taskId
router.delete('/tasks/:taskId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const task = user.dailyTasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.deleteOne();
    await user.save();
    res.status(200).json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete task' });
  }
});

// =====================================================================
// READINESS REPORT DATA — Aggregates all metrics for PDF generation
// =====================================================================

// @desc    Get aggregated data for Career Readiness Report PDF
// @route   GET /api/dashboard/report-data
// @access  Private/Student
router.get('/report-data', protect, authorize('student'), async (req, res) => {
  try {
    const userId = req.user._id;

    // Parallel fetch all data
    const [latestResume, quizAttempts, interviewSessions, activityAgg, user] = await Promise.all([
      Resume.findOne({ user: userId }).sort({ updatedAt: -1 }).select('analysis.score').lean(),
      QuizAttempt.find({ user: userId }).select('percentage').lean(),
      // Dynamically import InterviewSession to avoid circular deps
      import('../models/InterviewSession.js').then(m => 
        m.default.find({ participants: userId, status: 'completed' }).countDocuments()
      ).catch(() => 0),
      // Activity aggregation
      import('../models/Activity.js').then(m =>
        m.default.aggregate([
          { $match: { user: userId } },
          { $group: { _id: null, totalSeconds: { $sum: '$duration' }, totalSessions: { $sum: 1 } } },
        ])
      ).catch(() => []),
      User.findById(userId).select('name email college department year section streak').lean(),
    ]);

    // Compute quiz stats
    const quizScores = quizAttempts.map(q => q.percentage);
    const avgQuizScore = quizScores.length
      ? Math.round(quizScores.reduce((s, v) => s + v, 0) / quizScores.length)
      : 0;

    res.json({
      user: {
        name: user?.name,
        email: user?.email,
        college: user?.college,
        department: user?.department,
        year: user?.year,
        section: user?.section,
      },
      resumeScore: latestResume?.analysis?.score || 0,
      quizData: {
        avgScore: avgQuizScore,
        totalAttempts: quizAttempts.length,
      },
      interviewData: {
        sessionsCompleted: typeof interviewSessions === 'number' ? interviewSessions : 0,
      },
      streakData: {
        current: user?.streak?.current || 0,
        longest: user?.streak?.longest || 0,
      },
      activityData: {
        totalSeconds: activityAgg[0]?.totalSeconds || 0,
        totalSessions: activityAgg[0]?.totalSessions || 0,
      },
    });
  } catch (err) {
    console.error('Report data error:', err);
    res.status(500).json({ message: 'Failed to generate report data' });
  }
});

export default router;

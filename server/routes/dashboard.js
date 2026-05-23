import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Progress from '../models/Progress.js';
import Event from '../models/Event.js';
import Note from '../models/Note.js';
import Resume from '../models/Resume.js';
import User from '../models/User.js';
import QuizAttempt from '../models/QuizAttempt.js';
import InterviewSession from '../models/InterviewSession.js';
import Activity from '../models/Activity.js';
import Module from '../models/Module.js';

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
// STUDENT DETAILED ANALYTICS
// =====================================================================

// @desc    Comprehensive analytics for student analytics page
// @route   GET /api/dashboard/student-analytics
// @access  Private/Student
router.get('/student-analytics', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const range = req.query.range || '7days';
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Dynamic focus history ranges
    let startDate;
    let endDate = new Date();
    let groupByFormat = '%Y-%m-%d';

    if (range === 'thisMonth') {
      startDate = new Date();
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === 'lastMonth') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date();
      endDate.setDate(0);
      endDate.setHours(23, 59, 59, 999);
    } else if (range === 'lastYear') {
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      startDate.setMonth(0);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() - 1);
      endDate.setMonth(11);
      endDate.setDate(31);
      endDate.setHours(23, 59, 59, 999);

      groupByFormat = '%Y-%m';
    } else if (range === 'everyMonth') {
      startDate = new Date();
      startDate.setMonth(0);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      groupByFormat = '%Y-%m';
    } else {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    // Run ALL queries in parallel for max performance
    const [
      quizAttempts,
      interviewSessions,
      resume,
      progress,
      totalModules,
      focusByCategory,
      focusDaily,
      focusWeekly,
      focusMonthly,
      focusOverall
    ] = await Promise.all([
      // 1. All quiz attempts
      QuizAttempt.find({ user: userId }).sort({ createdAt: -1 }).lean(),
      // 2. All interview sessions
      InterviewSession.find({ host: userId }).sort({ createdAt: -1 }).lean(),
      // 3. Latest resume
      Resume.findOne({ user: userId }).lean(),
      // 4. Progress record
      Progress.findOne({ user: userId }).lean(),
      // 5. Total modules available
      Module.countDocuments(),
      // 6. Focus by category
      Activity.aggregate([
        { $match: { user: userId, type: { $ne: 'auto' } } },
        { $group: { _id: '$category', totalSeconds: { $sum: '$duration' }, count: { $sum: 1 } } },
        { $sort: { totalSeconds: -1 } }
      ]),
      // 7. Daily focus (dynamic range)
      Activity.aggregate([
        { $match: { user: userId, date: { $gte: startDate, $lte: endDate }, type: { $ne: 'auto' } } },
        { $group: {
          _id: { $dateToString: { format: groupByFormat, date: '$date' } },
          totalSeconds: { $sum: '$duration' },
          sessions: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ]),
      // 8. Weekly total
      Activity.aggregate([
        { $match: { user: userId, date: { $gte: sevenDaysAgo }, type: { $ne: 'auto' } } },
        { $group: { _id: null, totalSeconds: { $sum: '$duration' }, sessions: { $sum: 1 } } }
      ]),
      // 9. Monthly total
      Activity.aggregate([
        { $match: { user: userId, date: { $gte: thirtyDaysAgo }, type: { $ne: 'auto' } } },
        { $group: { _id: null, totalSeconds: { $sum: '$duration' }, sessions: { $sum: 1 } } }
      ]),
      // 10. Overall total
      Activity.aggregate([
        { $match: { user: userId, type: { $ne: 'auto' } } },
        { $group: { _id: null, totalSeconds: { $sum: '$duration' }, sessions: { $sum: 1 } } }
      ])
    ]);

    // ─── Compute Quiz Stats ───
    const quizTotal = quizAttempts.length;
    const quizAvgScore = quizTotal > 0
      ? Math.round(quizAttempts.reduce((s, a) => s + (a.percentage || 0), 0) / quizTotal)
      : 0;
    const quizBestScore = quizTotal > 0
      ? Math.max(...quizAttempts.map(a => a.percentage || 0))
      : 0;
    const quizRecent = quizAttempts.slice(0, 5).map(a => ({
      score: a.percentage,
      date: a.completedAt || a.createdAt
    }));
    // Trend: compare last 5 vs previous 5
    const last5Avg = quizAttempts.slice(0, 5).reduce((s, a) => s + (a.percentage || 0), 0) / Math.max(quizAttempts.slice(0, 5).length, 1);
    const prev5Avg = quizAttempts.slice(5, 10).reduce((s, a) => s + (a.percentage || 0), 0) / Math.max(quizAttempts.slice(5, 10).length, 1);
    const quizTrend = quizAttempts.length < 2 ? 'neutral' : last5Avg > prev5Avg ? 'up' : last5Avg < prev5Avg ? 'down' : 'neutral';

    // ─── Compute Interview Stats ───
    const interviewTotal = interviewSessions.length;
    const interviewWithScores = interviewSessions.filter(s => (s.aiScore || 0) > 0);
    const interviewAvgScore = interviewWithScores.length > 0
      ? Math.round(interviewWithScores.reduce((s, i) => s + i.aiScore, 0) / interviewWithScores.length)
      : 0;
    const interviewTotalTime = interviewSessions.reduce((s, i) => {
      if (i.startedAt && i.endedAt) return s + Math.round((new Date(i.endedAt) - new Date(i.startedAt)) / 1000);
      return s;
    }, 0);
    // Topic breakdown
    const topicBreakdown = {};
    interviewSessions.forEach(s => {
      if (!topicBreakdown[s.topic]) topicBreakdown[s.topic] = { count: 0, totalScore: 0, scored: 0 };
      topicBreakdown[s.topic].count++;
      if (s.aiScore > 0) {
        topicBreakdown[s.topic].totalScore += s.aiScore;
        topicBreakdown[s.topic].scored++;
      }
    });
    const interviewByTopic = Object.entries(topicBreakdown).map(([topic, data]) => ({
      topic,
      sessions: data.count,
      avgScore: data.scored > 0 ? Math.round(data.totalScore / data.scored) : 0
    }));

    // ─── Resume Stats ───
    const resumeScore = resume?.analysis?.score || 0;
    const resumeStrengths = resume?.analysis?.strengths || [];
    const resumeWeaknesses = resume?.analysis?.weaknesses || [];
    const resumeSuggestions = resume?.analysis?.suggestions || [];
    const resumeUploaded = !!resume;

    // ─── Module Progress ───
    const modulesStarted = progress?.modules?.length || 0;
    const moduleProgress = (progress?.modules || []).map(m => ({
      name: m.moduleName,
      lessonsCompleted: m.completedLessons?.length || 0,
      lastAccessed: m.lastAccessed
    }));
    const overallProgress = progress?.overallProgress || 0;

    // ─── Readiness Score (weighted composite 0-100) ───
    const weights = { quiz: 25, interview: 25, resume: 20, focus: 15, modules: 15 };
    const quizScore = Math.min(quizAvgScore, 100);
    const interviewScore = Math.min(interviewAvgScore, 100);
    const focusScore = Math.min((focusOverall[0]?.totalSeconds || 0) / 36000 * 100, 100); // 10hrs = 100%
    const moduleScore = totalModules > 0 ? Math.min((modulesStarted / totalModules) * 100, 100) : 0;
    const readinessScore = Math.round(
      (quizScore * weights.quiz +
       interviewScore * weights.interview +
       resumeScore * weights.resume +
       focusScore * weights.focus +
       moduleScore * weights.modules) / 100
    );

    // ─── AI Recommendations ───
    const recommendations = [];
    if (!resumeUploaded) recommendations.push({ type: 'resume', text: 'Upload your resume to get an ATS score and improvement tips.' });
    else if (resumeScore < 60) recommendations.push({ type: 'resume', text: `Your resume scores ${resumeScore}/100. Review the suggestions to improve it.` });
    if (quizTotal === 0) recommendations.push({ type: 'quiz', text: 'Take your first quiz to start tracking your knowledge.' });
    else if (quizAvgScore < 60) recommendations.push({ type: 'quiz', text: `Your quiz average is ${quizAvgScore}%. Focus on weak topics.` });
    if (interviewTotal === 0) recommendations.push({ type: 'interview', text: 'Start a mock interview to practice your communication skills.' });
    else if (interviewTotal < 5) recommendations.push({ type: 'interview', text: `You've done ${interviewTotal} interview sessions. Aim for at least 5 to build confidence.` });
    if ((focusOverall[0]?.totalSeconds || 0) < 3600) recommendations.push({ type: 'focus', text: 'Use the Focus Zone to build consistent study habits. Aim for 1hr/day.' });
    if (modulesStarted === 0) recommendations.push({ type: 'modules', text: 'Start a learning module to structure your preparation.' });
    if (quizTrend === 'down') recommendations.push({ type: 'quiz', text: 'Your quiz scores are declining. Revisit fundamentals before attempting more.' });

    res.status(200).json({
      readinessScore,
      quiz: {
        total: quizTotal,
        avgScore: quizAvgScore,
        bestScore: quizBestScore,
        trend: quizTrend,
        recent: quizRecent
      },
      interview: {
        total: interviewTotal,
        avgScore: interviewAvgScore,
        totalTime: interviewTotalTime,
        byTopic: interviewByTopic,
        recent: interviewSessions.slice(0, 5).map(s => ({
          topic: s.topic,
          score: s.aiScore || 0,
          duration: s.startedAt && s.endedAt ? Math.round((new Date(s.endedAt) - new Date(s.startedAt)) / 1000) : 0,
          date: s.endedAt || s.createdAt
        }))
      },
      resume: {
        uploaded: resumeUploaded,
        score: resumeScore,
        strengths: resumeStrengths.slice(0, 3),
        weaknesses: resumeWeaknesses.slice(0, 3),
        suggestions: resumeSuggestions.slice(0, 3)
      },
      modules: {
        started: modulesStarted,
        total: totalModules,
        overallProgress,
        details: moduleProgress
      },
      focus: {
        byCategory: focusByCategory,
        daily: focusDaily,
        weekly: focusWeekly[0] || { totalSeconds: 0, sessions: 0 },
        monthly: focusMonthly[0] || { totalSeconds: 0, sessions: 0 },
        overall: focusOverall[0] || { totalSeconds: 0, sessions: 0 }
      },
      streak: req.user.streak || { current: 0, longest: 0 },
      recommendations
    });
  } catch (err) {
    console.error('Student analytics error:', err);
    res.status(500).json({ message: 'Failed to load analytics' });
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
    
    if (role === 'principal' || role === 'placement') {
      if (college) studentMatch.college = college;
    } else if (role === 'hod') {
      if (college) studentMatch.college = college;
      if (department) studentMatch.department = department;
    } else if (role === 'faculty') {
      if (college) studentMatch.college = college;
      if (department) studentMatch.department = department;
      if (year) studentMatch.year = year;
    }

    // Step 1: Get eligible students (required before parallel queries)
    const students = await User.find(studentMatch).select('_id name department year').lean();
    const studentIds = students.map(s => s._id);
    const totalStudents = students.length;

    // Step 2: Run ALL independent queries in PARALLEL (the key perf fix)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      activeThisWeek,
      quizAgg,
      resumeAgg,
      activityLeaderboard,
      totalHoursAgg,
      recentQuizzes,
      recentInterviews,
      recentResumes,
      recentStudy
    ] = await Promise.all([
      User.countDocuments({ _id: { $in: studentIds }, updatedAt: { $gte: oneWeekAgo } }),

      QuizAttempt.aggregate([
        { $match: { user: { $in: studentIds } } },
        { $group: { _id: null, avgScore: { $avg: '$percentage' }, totalAttempts: { $sum: 1 } } }
      ]),

      Resume.aggregate([
        { $match: { user: { $in: studentIds }, 'analysis.score': { $gt: 0 } } },
        { $group: { _id: null, avgResume: { $avg: '$analysis.score' } } }
      ]),

      Activity.aggregate([
        { $match: { user: { $in: studentIds }, type: { $ne: 'auto' } } },
        { $group: { _id: '$user', totalSeconds: { $sum: '$duration' }, lastActive: { $max: '$date' } } },
        { $sort: { totalSeconds: -1 } },
        { $limit: 10 }
      ]),

      Activity.aggregate([
        { $match: { user: { $in: studentIds }, type: { $ne: 'auto' } } },
        { $group: { _id: null, totalSeconds: { $sum: '$duration' } } }
      ]),

      QuizAttempt.find({ user: { $in: studentIds } })
        .populate('user', 'name department')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      InterviewSession.find({ host: { $in: studentIds }, status: 'completed' })
        .populate('host', 'name department')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      Resume.find({ user: { $in: studentIds } })
        .populate('user', 'name department')
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean(),

      Activity.find({ user: { $in: studentIds }, type: { $ne: 'auto' } })
        .populate('user', 'name department')
        .sort({ date: -1 })
        .limit(10)
        .lean()
    ]);

    // Step 3: Process results (instant — no I/O)
    const avgQuizScore = quizAgg.length > 0 ? Math.round(quizAgg[0].avgScore || 0) : 0;
    const totalAttempts = quizAgg.length > 0 ? quizAgg[0].totalAttempts : 0;
    const avgResumeScore = resumeAgg.length > 0 ? Math.round(resumeAgg[0].avgResume || 0) : 0;
    const totalStudyHours = totalHoursAgg.length > 0 ? Math.round((totalHoursAgg[0].totalSeconds || 0) / 3600) : 0;

    let topStudents = activityLeaderboard.map(a => {
      const stu = students.find(s => s._id.toString() === a._id.toString());
      return {
        id: a._id,
        name: stu?.name || 'Unknown',
        department: stu?.department,
        hours: Math.round((a.totalSeconds || 0) / 360) / 10, // 1 decimal place, e.g., 2.5
        metric: 'hours',
        lastActive: a.lastActive
      };
    });

    if (topStudents.length === 0) {
      topStudents = students.slice(0, 10).map(s => ({
        id: s._id, name: s.name, department: s.department, hours: 0, metric: 'hours'
      }));
    }

    // Combine and format recent activities dynamically
    const combinedActivities = [];

    recentQuizzes.forEach(q => {
      combinedActivities.push({
        studentName: q.user?.name || 'Unknown',
        department: q.user?.department || '',
        description: `Completed a Quiz on ${q.topic || 'General Aptitude'}`,
        score: q.percentage || 0,
        scoreLabel: 'Quiz Score',
        completedAt: q.createdAt
      });
    });

    recentInterviews.forEach(i => {
      combinedActivities.push({
        studentName: i.host?.name || 'Unknown',
        department: i.host?.department || '',
        description: `Finished AI Mock Interview on ${i.topic || 'HR/Technical'}`,
        score: i.aiScore || 0,
        scoreLabel: 'AI Score',
        completedAt: i.createdAt || i.endedAt
      });
    });

    recentResumes.forEach(r => {
      if (r.analysis?.score) {
        combinedActivities.push({
          studentName: r.user?.name || 'Unknown',
          department: r.user?.department || '',
          description: 'Analyzed resume with AI feedback',
          score: r.analysis.score,
          scoreLabel: 'ATS Score',
          completedAt: r.updatedAt || r.createdAt
        });
      }
    });

    recentStudy.forEach(s => {
      const minutes = Math.round(s.duration / 60);
      if (minutes > 0) {
        combinedActivities.push({
          studentName: s.user?.name || 'Unknown',
          department: s.user?.department || '',
          description: `Logged ${minutes}m of ${s.category.toUpperCase()} study`,
          score: s.focusScore || 85,
          scoreLabel: 'Focus Score',
          completedAt: s.date || s.createdAt
        });
      }
    });

    // Sort by date descending and limit to top 10
    combinedActivities.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    const recentActivityFeed = combinedActivities.slice(0, 10);

    res.status(200).json({
      scope: { role, department: department || 'All', college: college || 'All', year: role === 'faculty' && year ? year : 'All Years' },
      stats: { totalStudents, activeThisWeek, avgQuizScore, avgResumeScore, totalAttempts, totalStudyHours },
      leaderboard: topStudents,
      recentActivity: recentActivityFeed
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
      // Count both mock-interviews (host) and group-discussions (participants)
      InterviewSession.countDocuments({
        $or: [{ host: userId }, { participants: userId }],
        status: 'completed'
      }).catch(() => 0),
      // Activity aggregation
      Activity.aggregate([
        { $match: { user: userId } },
        { $group: { _id: null, totalSeconds: { $sum: '$duration' }, totalSessions: { $sum: 1 } } },
      ]).catch(() => []),
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

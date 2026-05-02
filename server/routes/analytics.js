import express from 'express';
import { protect, authorize, scopeData } from '../middleware/auth.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Resume from '../models/Resume.js';
import ClassroomAnalytics from '../models/ClassroomAnalytics.js';
import { processQuery } from '../services/analyticsQueryEngine.js';
import { runAggregation } from '../scripts/aggregateAnalytics.js';

const router = express.Router();

const adminRoles = ['faculty', 'hod', 'principal', 'placement', 'admin'];

// Helper: get student IDs in scope
async function getStudentsInScope(scope) {
  const filter = { role: 'student' };
  if (scope.classroomCode) {
    if (typeof scope.classroomCode === 'object') {
      filter.classroomCode = scope.classroomCode;
    } else {
      filter.classroomCode = scope.classroomCode;
    }
  }
  if (scope.department) filter.department = scope.department;
  if (scope.college) filter.college = scope.college;
  return User.find(filter).select('_id classroomCode department college name streak');
}

// =====================================================================
// GET /api/analytics/overview — KPIs scoped by role
// =====================================================================
router.get('/overview', protect, authorize(...adminRoles), scopeData, async (req, res) => {
  try {
    const students = await getStudentsInScope(req.scope);
    const studentIds = students.map(s => s._id);
    const totalStudents = students.length;

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Active this week
    const activeIds = await Activity.distinct('user', {
      user: { $in: studentIds },
      date: { $gte: weekAgo },
    });

    // Study hours (30d)
    const actAgg = await Activity.aggregate([
      { $match: { user: { $in: studentIds }, date: { $gte: monthAgo } } },
      { $group: { _id: null, total: { $sum: '$duration' } } },
    ]);

    // Quiz avg
    const quizAgg = await QuizAttempt.aggregate([
      { $match: { user: { $in: studentIds } } },
      { $group: { _id: null, avg: { $avg: '$percentage' }, count: { $sum: 1 } } },
    ]);

    // Resume avg
    const resumeAgg = await Resume.aggregate([
      { $match: { user: { $in: studentIds }, 'analysis.score': { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: '$analysis.score' } } },
    ]);

    // Average streak
    const avgStreak = totalStudents
      ? Math.round(students.reduce((s, st) => s + (st.streak?.current || 0), 0) / totalStudents)
      : 0;

    // Daily trend (last 14 days)
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const dailyTrend = await Activity.aggregate([
      { $match: { user: { $in: studentIds }, date: { $gte: twoWeeksAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          hours: { $sum: '$duration' },
          sessions: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Category breakdown
    const categoryBreakdown = await Activity.aggregate([
      { $match: { user: { $in: studentIds }, date: { $gte: monthAgo } } },
      { $group: { _id: '$category', hours: { $sum: '$duration' } } },
      { $sort: { hours: -1 } },
    ]);

    res.json({
      stats: {
        totalStudents,
        activeThisWeek: activeIds.length,
        totalStudyHours: Math.round((actAgg[0]?.total || 0) / 3600),
        avgQuizScore: Math.round(quizAgg[0]?.avg || 0),
        totalQuizAttempts: quizAgg[0]?.count || 0,
        avgResumeScore: Math.round(resumeAgg[0]?.avg || 0),
        avgStreak,
      },
      dailyTrend: dailyTrend.map(d => ({
        date: d._id,
        hours: parseFloat((d.hours / 3600).toFixed(1)),
        sessions: d.sessions,
      })),
      categoryBreakdown: categoryBreakdown.map(c => ({
        name: c._id,
        hours: parseFloat((c.hours / 3600).toFixed(1)),
      })),
    });
  } catch (err) {
    console.error('Analytics overview error:', err);
    res.status(500).json({ message: 'Failed to load analytics overview' });
  }
});

// =====================================================================
// GET /api/analytics/classrooms — All classroom snapshots
// =====================================================================
router.get('/classrooms', protect, authorize(...adminRoles), scopeData, async (req, res) => {
  try {
    const students = await getStudentsInScope(req.scope);

    // Get unique classroom codes
    const classroomCodes = [...new Set(students.map(s => s.classroomCode).filter(Boolean))];

    // Try to get pre-computed snapshots first
    const snapshots = await ClassroomAnalytics.find({
      classroomCode: { $in: classroomCodes },
      period: 'daily',
    })
      .sort({ date: -1 })
      .lean();

    // Deduplicate: keep only latest per classroom
    const latestMap = {};
    snapshots.forEach(s => {
      if (!latestMap[s.classroomCode]) {
        latestMap[s.classroomCode] = s;
      }
    });

    // If no snapshots, compute live using grouped aggregation (NOT per-classroom loops)
    if (Object.keys(latestMap).length === 0) {
      const allIds = students.map(s => s._id);

      // Single aggregation grouped by classroomCode — eliminates N+1 query
      const actAgg = await Activity.aggregate([
        { $match: { user: { $in: allIds } } },
        { $group: { _id: '$user', totalSeconds: { $sum: '$duration' } } },
      ]);
      const actMap = {};
      actAgg.forEach(a => { actMap[a._id.toString()] = a.totalSeconds; });

      const quizAgg = await QuizAttempt.aggregate([
        { $match: { user: { $in: allIds } } },
        { $group: { _id: '$user', avg: { $avg: '$percentage' } } },
      ]);
      const quizMap = {};
      quizAgg.forEach(q => { quizMap[q._id.toString()] = q.avg; });

      const liveData = classroomCodes.map(code => {
        const classStudents = students.filter(s => s.classroomCode === code);
        let totalSeconds = 0;
        let quizScores = [];
        classStudents.forEach(s => {
          totalSeconds += actMap[s._id.toString()] || 0;
          if (quizMap[s._id.toString()] !== undefined) quizScores.push(quizMap[s._id.toString()]);
        });

        return {
          classroomCode: code,
          department: classStudents[0]?.department || '',
          metrics: {
            totalStudents: classStudents.length,
            totalStudyHours: Math.round(totalSeconds / 3600),
            averageQuizScore: quizScores.length ? Math.round(quizScores.reduce((s, v) => s + v, 0) / quizScores.length) : 0,
            activeStudents: 0,
            averageStreak: Math.round(
              classStudents.reduce((s, st) => s + (st.streak?.current || 0), 0) / classStudents.length
            ),
          },
        };
      });
      return res.json(liveData);
    }

    res.json(Object.values(latestMap));
  } catch (err) {
    console.error('Analytics classrooms error:', err);
    res.status(500).json({ message: 'Failed to load classroom analytics' });
  }
});

// =====================================================================
// GET /api/analytics/classroom/:code — Detailed time-series for one classroom
// =====================================================================
router.get('/classroom/:code', protect, authorize(...adminRoles), scopeData, async (req, res) => {
  try {
    const { code } = req.params;

    const snapshots = await ClassroomAnalytics.find({
      classroomCode: code,
      period: 'daily',
    })
      .sort({ date: -1 })
      .limit(30)
      .lean();

    // Also get per-student data
    const students = await User.find({ classroomCode: code, role: 'student' })
      .select('_id name streak')
      .lean();
    const studentIds = students.map(s => s._id);

    const actAgg = await Activity.aggregate([
      { $match: { user: { $in: studentIds } } },
      { $group: { _id: '$user', totalSeconds: { $sum: '$duration' }, lastActive: { $max: '$date' } } },
      { $sort: { totalSeconds: -1 } },
    ]);
    const quizAgg = await QuizAttempt.aggregate([
      { $match: { user: { $in: studentIds } } },
      { $group: { _id: '$user', avg: { $avg: '$percentage' }, attempts: { $sum: 1 } } },
    ]);
    const quizMap = {};
    quizAgg.forEach(q => { quizMap[q._id.toString()] = q; });

    const studentBreakdown = actAgg.map(a => {
      const stu = students.find(s => s._id.toString() === a._id.toString());
      const quiz = quizMap[a._id.toString()];
      return {
        name: stu?.name || 'Unknown',
        studyHours: Math.round(a.totalSeconds / 3600),
        quizAvg: Math.round(quiz?.avg || 0),
        quizAttempts: quiz?.attempts || 0,
        streak: stu?.streak?.current || 0,
        lastActive: a.lastActive,
      };
    });

    res.json({
      classroomCode: code,
      timeSeries: snapshots.reverse().map(s => ({
        date: s.date,
        ...s.metrics,
      })),
      students: studentBreakdown,
    });
  } catch (err) {
    console.error('Classroom detail error:', err);
    res.status(500).json({ message: 'Failed to load classroom details' });
  }
});

// =====================================================================
// GET /api/analytics/compare?codes=CSE-3A,CSE-3B
// =====================================================================
router.get('/compare', protect, authorize(...adminRoles), scopeData, async (req, res) => {
  try {
    const codes = (req.query.codes || '').split(',').filter(Boolean);
    if (codes.length < 2) {
      return res.status(400).json({ message: 'At least 2 classroom codes required' });
    }

    // Batch: fetch all students for all codes in one query
    const allStudents = await User.find({ classroomCode: { $in: codes }, role: 'student' }).select('_id streak classroomCode');
    const allIds = allStudents.map(s => s._id);

    // Two aggregations instead of (codes.length * 3)
    const actAgg = await Activity.aggregate([
      { $match: { user: { $in: allIds } } },
      { $group: { _id: '$user', totalSeconds: { $sum: '$duration' } } },
    ]);
    const actMap = {};
    actAgg.forEach(a => { actMap[a._id.toString()] = a.totalSeconds; });

    const quizAgg = await QuizAttempt.aggregate([
      { $match: { user: { $in: allIds } } },
      { $group: { _id: '$user', avg: { $avg: '$percentage' }, count: { $sum: 1 } } },
    ]);
    const quizMap = {};
    quizAgg.forEach(q => { quizMap[q._id.toString()] = q; });

    const resumeAgg = await Resume.aggregate([
      { $match: { user: { $in: allIds }, 'analysis.score': { $gt: 0 } } },
      { $group: { _id: '$user', avg: { $avg: '$analysis.score' } } },
    ]);
    const resumeMap = {};
    resumeAgg.forEach(r => { resumeMap[r._id.toString()] = r.avg; });

    const results = codes.map(code => {
      const codeStudents = allStudents.filter(s => s.classroomCode === code);
      let totalSeconds = 0, quizAvgs = [], quizAttempts = 0, resumeAvgs = [];
      codeStudents.forEach(s => {
        const sid = s._id.toString();
        totalSeconds += actMap[sid] || 0;
        if (quizMap[sid]) { quizAvgs.push(quizMap[sid].avg); quizAttempts += quizMap[sid].count; }
        if (resumeMap[sid]) resumeAvgs.push(resumeMap[sid]);
      });

      return {
        classroomCode: code,
        students: codeStudents.length,
        studyHours: Math.round(totalSeconds / 3600),
        avgQuizScore: quizAvgs.length ? Math.round(quizAvgs.reduce((s, v) => s + v, 0) / quizAvgs.length) : 0,
        quizAttempts,
        avgResumeScore: resumeAvgs.length ? Math.round(resumeAvgs.reduce((s, v) => s + v, 0) / resumeAvgs.length) : 0,
        avgStreak: codeStudents.length
          ? Math.round(codeStudents.reduce((s, st) => s + (st.streak?.current || 0), 0) / codeStudents.length)
          : 0,
      };
    });

    res.json(results);
  } catch (err) {
    console.error('Compare error:', err);
    res.status(500).json({ message: 'Failed to compare classrooms' });
  }
});

// =====================================================================
// GET /api/analytics/students/:classroomCode — Per-student breakdown
// =====================================================================
router.get('/students/:classroomCode', protect, authorize(...adminRoles), scopeData, async (req, res) => {
  try {
    const { classroomCode } = req.params;
    const students = await User.find({ classroomCode, role: 'student' })
      .select('_id name streak email')
      .lean();
    const ids = students.map(s => s._id);

    const actAgg = await Activity.aggregate([
      { $match: { user: { $in: ids } } },
      { $group: { _id: '$user', totalSeconds: { $sum: '$duration' }, lastActive: { $max: '$date' } } },
    ]);
    const actMap = {};
    actAgg.forEach(a => { actMap[a._id.toString()] = a; });

    const quizAgg = await QuizAttempt.aggregate([
      { $match: { user: { $in: ids } } },
      { $group: { _id: '$user', avg: { $avg: '$percentage' }, count: { $sum: 1 } } },
    ]);
    const quizMap = {};
    quizAgg.forEach(q => { quizMap[q._id.toString()] = q; });

    const data = students.map(s => {
      const act = actMap[s._id.toString()];
      const quiz = quizMap[s._id.toString()];
      return {
        id: s._id,
        name: s.name,
        email: s.email,
        studyHours: Math.round((act?.totalSeconds || 0) / 3600),
        lastActive: act?.lastActive || null,
        quizAvg: Math.round(quiz?.avg || 0),
        quizAttempts: quiz?.count || 0,
        streak: s.streak?.current || 0,
      };
    });

    data.sort((a, b) => b.studyHours - a.studyHours);
    res.json(data);
  } catch (err) {
    console.error('Student breakdown error:', err);
    res.status(500).json({ message: 'Failed to load student data' });
  }
});

// =====================================================================
// GET /api/analytics/trends?metric=studyHours&period=daily
// =====================================================================
router.get('/trends', protect, authorize(...adminRoles), scopeData, async (req, res) => {
  try {
    const { period = 'daily' } = req.query;

    let filter = { period };
    if (req.scope.department) filter.department = req.scope.department;
    if (req.scope.college) filter.college = req.scope.college;
    if (req.scope.classroomCode) {
      if (typeof req.scope.classroomCode === 'string') {
        filter.classroomCode = req.scope.classroomCode;
      } else {
        filter.classroomCode = req.scope.classroomCode;
      }
    }

    const data = await ClassroomAnalytics.find(filter)
      .sort({ date: -1 })
      .limit(60)
      .lean();

    // Group by date
    const dateMap = {};
    data.forEach(d => {
      const dateStr = new Date(d.date).toISOString().split('T')[0];
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = {
          date: dateStr,
          totalStudyHours: 0,
          avgQuizScore: [],
          activeStudents: 0,
          totalStudents: 0,
        };
      }
      dateMap[dateStr].totalStudyHours += d.metrics.totalStudyHours;
      dateMap[dateStr].avgQuizScore.push(d.metrics.averageQuizScore);
      dateMap[dateStr].activeStudents += d.metrics.activeStudents;
      dateMap[dateStr].totalStudents += d.metrics.totalStudents;
    });

    const result = Object.values(dateMap)
      .map(d => ({
        ...d,
        avgQuizScore: d.avgQuizScore.length
          ? Math.round(d.avgQuizScore.reduce((s, v) => s + v, 0) / d.avgQuizScore.length)
          : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json(result);
  } catch (err) {
    console.error('Trends error:', err);
    res.status(500).json({ message: 'Failed to load trends' });
  }
});

// =====================================================================
// POST /api/analytics/query — Natural language query
// =====================================================================
router.post('/query', protect, authorize(...adminRoles), scopeData, async (req, res) => {
  try {
    const { query } = req.body;
    const result = await processQuery(query, req.scope);
    res.json(result);
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ message: 'Failed to process query' });
  }
});

// =====================================================================
// GET /api/analytics/export?format=csv
// =====================================================================
router.get('/export', protect, authorize(...adminRoles), scopeData, async (req, res) => {
  try {
    const students = await getStudentsInScope(req.scope);
    const studentIds = students.map(s => s._id);

    const actAgg = await Activity.aggregate([
      { $match: { user: { $in: studentIds } } },
      { $group: { _id: '$user', totalSeconds: { $sum: '$duration' }, lastActive: { $max: '$date' } } },
    ]);
    const actMap = {};
    actAgg.forEach(a => { actMap[a._id.toString()] = a; });

    const quizAgg = await QuizAttempt.aggregate([
      { $match: { user: { $in: studentIds } } },
      { $group: { _id: '$user', avg: { $avg: '$percentage' }, count: { $sum: 1 } } },
    ]);
    const quizMap = {};
    quizAgg.forEach(q => { quizMap[q._id.toString()] = q; });

    const rows = students.map(s => {
      const act = actMap[s._id.toString()];
      const quiz = quizMap[s._id.toString()];
      return {
        name: s.name,
        classroom: s.classroomCode || '',
        department: s.department || '',
        college: s.college || '',
        studyHours: Math.round((act?.totalSeconds || 0) / 3600),
        lastActive: act?.lastActive ? new Date(act.lastActive).toISOString().split('T')[0] : 'N/A',
        quizAvg: Math.round(quiz?.avg || 0),
        quizAttempts: quiz?.count || 0,
        streak: s.streak?.current || 0,
      };
    });

    rows.sort((a, b) => b.studyHours - a.studyHours);

    if (req.query.format === 'csv') {
      const headers = Object.keys(rows[0] || {});
      const csvLines = [
        headers.join(','),
        ...rows.map(r => headers.map(h => `"${r[h]}"`).join(',')),
      ];
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics_export.csv');
      return res.send(csvLines.join('\n'));
    }

    res.json(rows);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ message: 'Failed to export data' });
  }
});

// =====================================================================
// POST /api/analytics/refresh — Manual aggregation trigger
// =====================================================================
router.post('/refresh', protect, authorize('hod', 'principal', 'placement', 'admin'), scopeData, async (req, res) => {
  try {
    const result = await runAggregation('daily');
    res.json({ message: 'Analytics refreshed successfully', ...result });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ message: 'Failed to refresh analytics' });
  }
});

export default router;

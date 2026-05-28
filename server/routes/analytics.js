import express from 'express';
import { protect, authorize, scopeData } from '../middleware/auth.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Resume from '../models/Resume.js';
import ClassroomAnalytics from '../models/ClassroomAnalytics.js';
import { processQuery } from '../services/analyticsQueryEngine.js';
import { runAggregation } from '../scripts/aggregateAnalytics.js';
import DSAProgress from '../models/DSAProgress.js';
import LanguageProfile from '../models/LanguageProfile.js';
import SavedRoadmap from '../models/SavedRoadmap.js';
import Assignment from '../models/Assignment.js';
import Attendance from '../models/Attendance.js';
import { getGroqChatCompletion } from '../services/groqService.js';

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

    // Parallel fetch matching all student analytics sources
    const [
      quizAttempts,
      resumes,
      dsaProgressions,
      languageProfiles,
      attendances,
      focusAgg,
      assignments
    ] = await Promise.all([
      QuizAttempt.find({ user: { $in: studentIds } }).lean(),
      Resume.find({ user: { $in: studentIds } }).lean(),
      DSAProgress.find({ studentId: { $in: studentIds } }).lean(),
      LanguageProfile.find({ user: { $in: studentIds } }).lean(),
      Attendance.find({ classroomCode: { $in: students.map(s => s.classroomCode).filter(Boolean) } }).lean(),
      Activity.aggregate([
        { $match: { user: { $in: studentIds }, type: { $ne: 'auto' } } },
        { $group: { _id: '$user', totalSeconds: { $sum: '$duration' } } }
      ]),
      Assignment.find({ classroomCode: { $in: students.map(s => s.classroomCode).filter(Boolean) } }).lean()
    ]);

    // Build lookup maps for performance
    const quizMap = {};
    quizAttempts.forEach(qa => {
      const uid = qa.user.toString();
      if (!quizMap[uid]) quizMap[uid] = [];
      quizMap[uid].push(qa);
    });

    const resumeMap = {};
    resumes.forEach(r => { resumeMap[r.user.toString()] = r; });

    const dsaMap = {};
    dsaProgressions.forEach(d => { dsaMap[d.studentId.toString()] = d; });

    const langMap = {};
    languageProfiles.forEach(lp => { langMap[lp.user.toString()] = lp; });

    const focusMap = {};
    focusAgg.forEach(f => { focusMap[f._id.toString()] = f.totalSeconds; });

    const rows = students.map(s => {
      const sid = s._id.toString();
      const sCode = s.classroomCode;

      const sQuizzes = quizMap[sid] || [];
      const quizTotal = sQuizzes.length;
      const quizAvgScore = quizTotal > 0
        ? Math.round(sQuizzes.reduce((sum, q) => sum + (q.percentage || 0), 0) / quizTotal)
        : 0;

      const sResume = resumeMap[sid];
      const resumeScore = sResume?.analysis?.score || 0;

      const focusTotalSeconds = focusMap[sid] || 0;
      const focusOverallHours = Math.round(focusTotalSeconds / 3600);

      const sDsa = dsaMap[sid];
      const dsaTotalSolved = sDsa ? ((sDsa.easySolved || 0) + (sDsa.mediumSolved || 0) + (sDsa.hardSolved || 0)) : 0;

      const sLang = langMap[sid];
      const langXP = sLang ? (sLang.totalXP || 0) : 0;

      // Academic assignments
      const sAssignments = assignments.filter(a => a.classroomCode === sCode);
      let submittedAssignments = 0;
      sAssignments.forEach(ass => {
        if (ass.submissions?.some(subm => subm.studentId?.toString() === sid)) {
          submittedAssignments++;
        }
      });
      const assignmentCompletionRate = sAssignments.length > 0 
        ? Math.round((submittedAssignments / sAssignments.length) * 100) 
        : 0;

      // Academic attendance
      const sAttendances = attendances.filter(a => a.classroomCode === sCode);
      let totalLectures = 0;
      let lecturesAttended = 0;
      sAttendances.forEach(att => {
        const record = att.records?.find(rec => rec.studentId?.toString() === sid);
        if (record) {
          totalLectures++;
          if (record.status === 'present' || record.status === 'late') lecturesAttended++;
        }
      });
      const attendancePercentage = totalLectures > 0 ? Math.round((lecturesAttended / totalLectures) * 100) : 0;

      // Composite Readiness Score
      const weights = { quiz: 15, resume: 15, focus: 10, dsa: 15, academics: 10, language: 10 };
      const dsaScore = Math.min((dsaTotalSolved / 50) * 100, 100);
      const academicScore = Math.round((attendancePercentage + assignmentCompletionRate) / 2);
      const languageScore = Math.min((langXP / 500) * 100, 100);
      const focusScore = Math.min(focusTotalSeconds / 36000 * 100, 100);
      
      const readinessScore = Math.round(
        (quizAvgScore * weights.quiz +
         resumeScore * weights.resume +
         focusScore * weights.focus +
         dsaScore * weights.dsa +
         academicScore * weights.academics +
         languageScore * weights.language) / 75 * 100
      );

      return {
        name: s.name,
        email: s.email || '',
        classroom: sCode || '',
        department: s.department || '',
        college: s.college || '',
        studyHours: focusOverallHours,
        lastActive: focusTotalSeconds > 0 ? 'Active' : 'N/A',
        quizAvg: quizAvgScore,
        quizAttempts: quizTotal,
        streak: s.streak?.current || 0,
        readinessScore: isNaN(readinessScore) ? 0 : Math.min(readinessScore, 100),
        dsaSolved: dsaTotalSolved,
        resumeScore,
        attendance: attendancePercentage,
        assignmentCompletion: assignmentCompletionRate
      };
    });

    rows.sort((a, b) => b.readinessScore - a.readinessScore);

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
// GET /api/analytics/at-risk — Early Warning System for Faculty
// =====================================================================
router.get('/at-risk', protect, authorize(...adminRoles), scopeData, async (req, res) => {
  try {
    const students = await getStudentsInScope(req.scope);
    const studentIds = students.map(s => s._id);

    // Run parallel queries to fetch metrics across all modules in batch
    const [
      quizAttempts,
      resumes,
      dsaProgressions,
      languageProfiles,
      savedRoadmaps,
      assignments,
      attendances,
      focusAgg
    ] = await Promise.all([
      QuizAttempt.find({ user: { $in: studentIds } }).lean(),
      Resume.find({ user: { $in: studentIds } }).lean(),
      DSAProgress.find({ studentId: { $in: studentIds } }).lean(),
      LanguageProfile.find({ user: { $in: studentIds } }).lean(),
      SavedRoadmap.find({ user: { $in: studentIds } }).lean(),
      Assignment.find({ classroomCode: { $in: students.map(s => s.classroomCode).filter(Boolean) } }).lean(),
      Attendance.find({ classroomCode: { $in: students.map(s => s.classroomCode).filter(Boolean) } }).lean(),
      Activity.aggregate([
        { $match: { user: { $in: studentIds }, type: { $ne: 'auto' } } },
        { $group: { _id: '$user', totalSeconds: { $sum: '$duration' } } }
      ])
    ]);

    // Build lookup maps for optimal performance (no N+1 loops)
    const quizMap = {};
    quizAttempts.forEach(qa => {
      const uid = qa.user.toString();
      if (!quizMap[uid]) quizMap[uid] = [];
      quizMap[uid].push(qa);
    });

    const resumeMap = {};
    resumes.forEach(r => {
      resumeMap[r.user.toString()] = r;
    });

    const dsaMap = {};
    dsaProgressions.forEach(d => {
      dsaMap[d.studentId.toString()] = d;
    });

    const langMap = {};
    languageProfiles.forEach(lp => {
      langMap[lp.user.toString()] = lp;
    });

    const roadmapMap = {};
    savedRoadmaps.forEach(sr => {
      roadmapMap[sr.user.toString()] = sr;
    });

    const focusMap = {};
    focusAgg.forEach(f => {
      focusMap[f._id.toString()] = f.totalSeconds;
    });

    const atRiskStudents = [];

    students.forEach(student => {
      const sid = student._id.toString();
      const sCode = student.classroomCode;

      // 1. Quizzes
      const sQuizzes = quizMap[sid] || [];
      const quizTotal = sQuizzes.length;
      const quizAvgScore = quizTotal > 0
        ? Math.round(sQuizzes.reduce((sum, q) => sum + (q.percentage || 0), 0) / quizTotal)
        : 0;

      // 2. Resume
      const sResume = resumeMap[sid];
      const resumeScore = sResume?.analysis?.score || 0;
      const resumeUploaded = !!sResume;

      // 3. Focus
      const focusTotalSeconds = focusMap[sid] || 0;
      const focusOverallHours = Math.round(focusTotalSeconds / 3600);

      // 4. DSA
      const sDsa = dsaMap[sid];
      const dsaTotalSolved = sDsa ? ((sDsa.easySolved || 0) + (sDsa.mediumSolved || 0) + (sDsa.hardSolved || 0)) : 0;

      // 5. Language
      const sLang = langMap[sid];
      const langXP = sLang ? (sLang.totalXP || 0) : 0;

      // 6. Roadmap
      const sRoadmap = roadmapMap[sid];
      const targetRole = sRoadmap?.targetRole || 'Not Set';

      // 7. Academic assignments
      const sAssignments = assignments.filter(a => a.classroomCode === sCode);
      const totalAssignments = sAssignments.length;
      let submittedAssignments = 0;
      sAssignments.forEach(ass => {
        const sub = ass.submissions?.find(subm => subm.studentId?.toString() === sid);
        if (sub) submittedAssignments++;
      });
      const assignmentCompletionRate = totalAssignments > 0 ? Math.round((submittedAssignments / totalAssignments) * 100) : 0;

      // 8. Academic attendance
      const sAttendances = attendances.filter(a => a.classroomCode === sCode);
      let totalLectures = 0;
      let lecturesAttended = 0;
      sAttendances.forEach(att => {
        const record = att.records?.find(rec => rec.studentId?.toString() === sid);
        if (record) {
          totalLectures++;
          if (record.status === 'present' || record.status === 'late') lecturesAttended++;
        }
      });
      const attendancePercentage = totalLectures > 0 ? Math.round((lecturesAttended / totalLectures) * 100) : 0;

      // Calculate composite Readiness Score
      const weights = { quiz: 15, interview: 15, resume: 15, focus: 10, modules: 10, dsa: 15, academics: 10, language: 10 };
      const dsaScore = Math.min((dsaTotalSolved / 50) * 100, 100);
      const academicScore = Math.round((attendancePercentage + assignmentCompletionRate) / 2);
      const languageScore = Math.min((langXP / 500) * 100, 100);
      const focusScore = Math.min(focusTotalSeconds / 36000 * 100, 100);
      const quizWeightScore = Math.min(quizAvgScore, 100);

      const readinessScore = Math.round(
        (quizWeightScore * weights.quiz +
         resumeScore * weights.resume +
         focusScore * weights.focus +
         dsaScore * weights.dsa +
         academicScore * weights.academics +
         languageScore * weights.language) / 85 * 100
      );

      // Determine Risk Level
      let riskLevel = 'good'; // 'good', 'medium' (Needs Intervention), 'high' (Critical Warning)
      const warningReasons = [];

      if (readinessScore < 50) {
        riskLevel = 'high';
        warningReasons.push('Low overall readiness score (< 50%)');
      }
      if (attendancePercentage < 75) {
        riskLevel = 'high';
        warningReasons.push('Attendance is below criteria (< 75%)');
      }
      if (assignmentCompletionRate < 60) {
        if (riskLevel !== 'high') riskLevel = 'high';
        warningReasons.push('Critical assignment backlog (< 60%)');
      }
      if (dsaTotalSolved < 10 && targetRole !== 'Not Set') {
        if (riskLevel === 'good') riskLevel = 'medium';
        warningReasons.push('Low DSA problem solved count (< 10 problems)');
      }

      if (riskLevel === 'good') {
        if (readinessScore >= 50 && readinessScore < 65) {
          riskLevel = 'medium';
          warningReasons.push('Moderately low overall readiness');
        }
        if (attendancePercentage >= 75 && attendancePercentage < 80) {
          riskLevel = 'medium';
          warningReasons.push('Attendance is borderline (75-80%)');
        }
        if (assignmentCompletionRate >= 60 && assignmentCompletionRate < 75) {
          riskLevel = 'medium';
          warningReasons.push('Pending assignments (60-75% completion)');
        }
      }

      if (riskLevel !== 'good') {
        atRiskStudents.push({
          _id: sid,
          name: student.name,
          classroomCode: sCode || 'N/A',
          department: student.department || 'General',
          readinessScore,
          attendance: attendancePercentage,
          assignmentCompletion: assignmentCompletionRate,
          dsaSolved: dsaTotalSolved,
          focusHours: focusOverallHours,
          riskLevel,
          reasons: warningReasons
        });
      }
    });

    res.json({
      atRiskCount: atRiskStudents.length,
      highRiskCount: atRiskStudents.filter(s => s.riskLevel === 'high').length,
      mediumRiskCount: atRiskStudents.filter(s => s.riskLevel === 'medium').length,
      students: atRiskStudents
    });
  } catch (err) {
    console.error('At-risk report error:', err);
    res.status(500).json({ message: 'Failed to load at-risk report' });
  }
});

// =====================================================================
// POST /api/analytics/at-risk/:studentId/mentorship-plan — Generate AI template
// =====================================================================
router.post('/at-risk/:studentId/mentorship-plan', protect, authorize(...adminRoles), async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await User.findById(studentId).lean();
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Fetch metrics
    const [quizAttempts, resume, dsaProgress, languageProfile, assignments, attendances] = await Promise.all([
      QuizAttempt.find({ user: studentId }).lean(),
      Resume.findOne({ user: studentId }).lean(),
      DSAProgress.findOne({ studentId }).lean(),
      LanguageProfile.findOne({ user: studentId }).lean(),
      Assignment.find({ classroomCode: student.classroomCode }).lean(),
      Attendance.find({ classroomCode: student.classroomCode }).lean()
    ]);

    const quizTotal = quizAttempts.length;
    const quizAvgScore = quizTotal > 0 ? Math.round(quizAttempts.reduce((sum, q) => sum + (q.percentage || 0), 0) / quizTotal) : 0;
    const resumeScore = resume?.analysis?.score || 0;
    const dsaTotalSolved = dsaProgress ? ((dsaProgress.easySolved || 0) + (dsaProgress.mediumSolved || 0) + (dsaProgress.hardSolved || 0)) : 0;
    const langXP = languageProfile ? (languageProfile.totalXP || 0) : 0;

    let submittedAssignments = 0;
    assignments.forEach(ass => {
      if (ass.submissions?.some(sub => sub.studentId?.toString() === studentId)) submittedAssignments++;
    });
    const assignmentCompletion = assignments.length > 0 ? Math.round((submittedAssignments / assignments.length) * 100) : 0;

    let totalLectures = 0;
    let lecturesAttended = 0;
    attendances.forEach(att => {
      const record = att.records?.find(rec => rec.studentId?.toString() === studentId);
      if (record) {
        totalLectures++;
        if (record.status === 'present' || record.status === 'late') lecturesAttended++;
      }
    });
    const attendance = totalLectures > 0 ? Math.round((lecturesAttended / totalLectures) * 100) : 0;

    const prompt = `You are a helpful academic mentor and professor at an engineering college.
Write a personalized, encouraging but firm intervention letter/email from you (the Professor) to the student: ${student.name}.
Use their specific performance metrics to guide the recommendations:
- Attendance: ${attendance}% (target >75%)
- Assignment completion: ${assignmentCompletion}% (target >80%)
- Quizzes: average score of ${quizAvgScore}%
- DSA problems solved: ${dsaTotalSolved} solved
- Resume score: ${resumeScore}/100

Format the response exactly as a JSON object:
{
  "subject": "Mentorship and Placement Preparation Support - [Student Name]",
  "emailContent": "Dear [Student Name],\\n\\n...",
  "mentorshipActionSteps": [
    "Step 1...",
    "Step 2..."
  ]
}`;

    const responseText = await getGroqChatCompletion([
      { role: 'system', content: 'You generate structured academic mentorship templates in JSON.' },
      { role: 'user', content: prompt }
    ], true, 0.5);

    res.json(JSON.parse(responseText));
  } catch (err) {
    console.error('Mentorship plan error:', err);
    res.status(500).json({ message: 'Failed to generate mentorship plan' });
  }
});

// =====================================================================
// POST /api/analytics/placement/invite-draft — Generate AI Placement Drive Invite
// =====================================================================
router.post('/placement/invite-draft', protect, authorize(...adminRoles), async (req, res) => {
  try {
    const { companyName, jobRole, minReadiness, minResumeScore } = req.body;
    const prompt = `You are a professional Training and Placement Officer (TPO) at an engineering college.
Write a highly compelling and professional campus placement drive invitation email for the company: "${companyName || 'TechCorp'}" for the role of "${jobRole || 'Software Engineer'}".
The target audience of students has cleared the screening criteria (minimum readiness score of ${minReadiness || 70}%, minimum ATS resume score of ${minResumeScore || 70}%).
Mention that their profile has been auto-flagged by the LevelUp Placement Readiness Engine as eligible candidates.
Keep the email structured, professional, and exciting.
Format the response exactly as a JSON object:
{
  "subject": "Exclusive Campus Drive: [Company Name] - [Job Role]",
  "emailContent": "Dear Candidate,\\n\\n..."
}`;

    const responseText = await getGroqChatCompletion([
      { role: 'system', content: 'You generate professional placement email templates in JSON.' },
      { role: 'user', content: prompt }
    ], true, 0.5);

    res.json(JSON.parse(responseText));
  } catch (err) {
    console.error('Placement invite draft error:', err);
    res.status(500).json({ message: 'Failed to generate invitation draft' });
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

import express from 'express';
import multer from 'multer';
import { protect, authorize } from '../middleware/auth.js';
import {
  createAssignment,
  getClassroomAssignments,
  submitAssignment,
  gradeAssignment,
  markAttendance,
  getClassroomAttendance,
  getMonthlyAttendanceSummary,
  createAnnouncement,
  getClassroomAnnouncements,
  createForm,
  getClassroomForms,
  getFormDetail,
  submitFormResponse,
  getFormResults,
  exportFormExcel,
  importFormCSV,
  toggleFormActive,
  addMarks,
  getMyScores,
  getClassMarks,
  getLeaderboard,
  updateDSAProgress,
  getDSALeaderboard,
  aiGradeAssignment,
  aiFormInsights,
  aiStudentIntervention
} from '../controllers/assessmentController.js';

const router = express.Router();
const csvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// All routes are protected
router.use(protect);

// Assignments
router.post('/assignment', authorize('faculty', 'hod', 'principal'), createAssignment);
router.get('/assignment/:code', getClassroomAssignments);
router.post('/assignment/:id/submit', authorize('student'), submitAssignment);
router.put('/assignment/:id/grade', authorize('faculty', 'hod', 'principal'), gradeAssignment);
router.post('/assignment/:id/ai-grade', authorize('faculty', 'hod', 'principal'), aiGradeAssignment);

// Attendance
router.post('/attendance', authorize('faculty', 'hod', 'principal'), markAttendance);
router.get('/attendance/:code', getClassroomAttendance);
router.get('/attendance/:code/monthly-summary', getMonthlyAttendanceSummary);
router.post('/intervention', aiStudentIntervention); // Available for both student (self-study plan) and faculty/admin

// Announcements
router.post('/announcement', authorize('faculty', 'hod', 'principal', 'placement'), createAnnouncement);
router.get('/announcement/:code', getClassroomAnnouncements);

// Forms (Google Forms-style)
router.post('/form', authorize('faculty', 'hod', 'principal'), createForm);
router.get('/form/:code', getClassroomForms);
router.get('/form/:id/detail', getFormDetail);
router.post('/form/:id/respond', authorize('student'), submitFormResponse);
router.get('/form/:id/results', authorize('faculty', 'hod', 'principal'), getFormResults);
router.get('/form/:id/export', authorize('faculty', 'hod', 'principal'), exportFormExcel);
router.post('/form/:id/import-csv', authorize('faculty', 'hod', 'principal'), csvUpload.single('csv'), importFormCSV);
router.put('/form/:id/toggle', authorize('faculty', 'hod', 'principal'), toggleFormActive);
router.post('/form/:id/ai-insights', authorize('faculty', 'hod', 'principal'), aiFormInsights);

// Marks / Scores
router.post('/marks', authorize('faculty', 'hod', 'principal'), addMarks);
router.get('/marks/my', getMyScores);
router.get('/marks/class/:code', authorize('faculty', 'hod', 'principal'), getClassMarks);

// Leaderboard
router.get('/leaderboard/:code', getLeaderboard);

// DSA Progress
router.put('/dsa', updateDSAProgress);
router.get('/dsa/leaderboard/:code', getDSALeaderboard);

export default router;


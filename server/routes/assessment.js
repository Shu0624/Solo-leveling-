import express from 'express';
import multer from 'multer';
import { protect, authorize, authorizeClassroom } from '../middleware/auth.js';
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

// Guard for routes that carry the classroom code in the request body
const bodyClassroom = authorizeClassroom((req) => req.body.classroomCode);

// Assignments
router.post('/assignment', authorize('faculty', 'hod', 'principal'), bodyClassroom, createAssignment);
router.get('/assignment/:code', authorizeClassroom(), getClassroomAssignments);
router.post('/assignment/:id/submit', authorize('student'), submitAssignment); // ownership checked in controller
router.put('/assignment/:id/grade', authorize('faculty', 'hod', 'principal'), gradeAssignment); // scope checked in controller
router.post('/assignment/:id/ai-grade', authorize('faculty', 'hod', 'principal'), aiGradeAssignment); // scope checked in controller

// Attendance
router.post('/attendance', authorize('faculty', 'hod', 'principal'), bodyClassroom, markAttendance);
router.get('/attendance/:code', authorizeClassroom(), getClassroomAttendance);
router.get('/attendance/:code/monthly-summary', authorizeClassroom(), getMonthlyAttendanceSummary);
router.post('/intervention', aiStudentIntervention); // Available for both student (self-study plan) and faculty/admin — scope checked in controller

// Announcements
router.post('/announcement', authorize('faculty', 'hod', 'principal', 'placement'), createAnnouncement); // scope checked in controller
router.get('/announcement/:code', authorizeClassroom(), getClassroomAnnouncements);

// Forms (Google Forms-style)
router.post('/form', authorize('faculty', 'hod', 'principal'), bodyClassroom, createForm);
router.get('/form/:code', authorizeClassroom(), getClassroomForms);
router.get('/form/:id/detail', getFormDetail); // scope checked in controller
router.post('/form/:id/respond', authorize('student'), submitFormResponse); // ownership checked in controller
router.get('/form/:id/results', authorize('faculty', 'hod', 'principal'), getFormResults); // scope checked in controller
router.get('/form/:id/export', authorize('faculty', 'hod', 'principal'), exportFormExcel); // scope checked in controller
router.post('/form/:id/import-csv', authorize('faculty', 'hod', 'principal'), csvUpload.single('csv'), importFormCSV); // scope checked in controller
router.put('/form/:id/toggle', authorize('faculty', 'hod', 'principal'), toggleFormActive); // scope checked in controller
router.post('/form/:id/ai-insights', authorize('faculty', 'hod', 'principal'), aiFormInsights); // scope checked in controller

// Marks / Scores
router.post('/marks', authorize('faculty', 'hod', 'principal'), addMarks); // per-entry scope checked in controller
router.get('/marks/my', getMyScores);
router.get('/marks/class/:code', authorize('faculty', 'hod', 'principal'), authorizeClassroom(), getClassMarks);

// Leaderboard
router.get('/leaderboard/:code', authorizeClassroom(), getLeaderboard);

// DSA Progress
router.put('/dsa', updateDSAProgress);
router.get('/dsa/leaderboard/:code', authorizeClassroom(), getDSALeaderboard);

export default router;


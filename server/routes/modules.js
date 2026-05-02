import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Module from '../models/Module.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Progress from '../models/Progress.js';

const router = express.Router();

// =====================================================================
// MODULES
// =====================================================================

// @desc    Get all modules (with user progress)
// @route   GET /api/modules
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const modules = await Module.find().select('-lessons.content').sort({ category: 1, difficulty: 1 });
    
    // Get user's progress
    const progress = await Progress.findOne({ user: req.user._id });
    
    const modulesWithProgress = modules.map(mod => {
      const modObj = mod.toObject();
      const userMod = progress?.modules?.find(m => m.moduleId?.toString() === mod._id.toString());
      modObj.progress = userMod ? Math.round((userMod.completedLessons.length / mod.lessons.length) * 100) : 0;
      modObj.lessonCount = mod.lessons.length;
      return modObj;
    });

    res.status(200).json(modulesWithProgress);
  } catch (err) {
    console.error('Modules fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch modules' });
  }
});

// @desc    Get user's progress across all modules
// @route   GET /api/modules/progress
// @access  Private
router.get('/progress', protect, async (req, res) => {
  try {
    let progress = await Progress.findOne({ user: req.user._id });
    if (!progress) {
      progress = await Progress.create({ user: req.user._id, modules: [], overallProgress: 0 });
    }
    res.status(200).json({
      modules: progress.modules,
      overallProgress: progress.overallProgress
    });
  } catch (err) {
    console.error('Progress fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch progress' });
  }
});

// @desc    Get single module with lessons
// @route   GET /api/modules/:slug
// @access  Private
router.get('/:slug', protect, async (req, res) => {
  try {
    const module = await Module.findOne({ slug: req.params.slug });
    if (!module) return res.status(404).json({ message: 'Module not found' });

    const progress = await Progress.findOne({ user: req.user._id });
    const userMod = progress?.modules?.find(m => m.moduleId?.toString() === module._id.toString());

    res.status(200).json({
      module,
      completedLessons: userMod?.completedLessons || [],
      quizScores: userMod?.quizScores || []
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch module' });
  }
});

// @desc    Mark a lesson as completed (by lessonId from URL)
// @route   POST /api/modules/:slug/lessons/:lessonId/complete
// @access  Private
router.post('/:slug/lessons/:lessonId/complete', protect, async (req, res) => {
  try {
    const module = await Module.findOne({ slug: req.params.slug });
    if (!module) return res.status(404).json({ message: 'Module not found' });

    let progress = await Progress.findOne({ user: req.user._id });
    if (!progress) {
      progress = await Progress.create({ user: req.user._id, modules: [] });
    }

    let userMod = progress.modules.find(m => m.moduleId?.toString() === module._id.toString());
    if (!userMod) {
      progress.modules.push({
        moduleId: module._id,
        moduleName: module.title,
        completedLessons: [],
        quizScores: [],
        lastAccessed: new Date()
      });
      userMod = progress.modules[progress.modules.length - 1];
    }

    const lessonId = req.params.lessonId;
    if (!userMod.completedLessons.includes(lessonId)) {
      userMod.completedLessons.push(lessonId);
    }
    userMod.lastAccessed = new Date();

    // Update overall progress
    const totalLessons = await Module.aggregate([{ $unwind: '$lessons' }, { $count: 'total' }]);
    const totalCompleted = progress.modules.reduce((sum, m) => sum + m.completedLessons.length, 0);
    progress.overallProgress = totalLessons[0] ? Math.round((totalCompleted / totalLessons[0].total) * 100) : 0;

    await progress.save();
    res.status(200).json({ message: 'Lesson marked complete', completedLessons: userMod.completedLessons });
  } catch (err) {
    console.error('Complete lesson error:', err);
    res.status(500).json({ message: 'Failed to mark lesson complete' });
  }
});

// @desc    Mark a lesson as completed (legacy - by index in body)
// @route   POST /api/modules/:slug/complete-lesson
// @access  Private
router.post('/:slug/complete-lesson', protect, async (req, res) => {
  try {
    const { lessonIndex } = req.body;
    const module = await Module.findOne({ slug: req.params.slug });
    if (!module) return res.status(404).json({ message: 'Module not found' });

    let progress = await Progress.findOne({ user: req.user._id });
    if (!progress) {
      progress = await Progress.create({ user: req.user._id, modules: [] });
    }

    let userMod = progress.modules.find(m => m.moduleId?.toString() === module._id.toString());
    if (!userMod) {
      progress.modules.push({
        moduleId: module._id,
        moduleName: module.title,
        completedLessons: [],
        quizScores: [],
        lastAccessed: new Date()
      });
      userMod = progress.modules[progress.modules.length - 1];
    }

    const lessonId = String(lessonIndex);
    if (!userMod.completedLessons.includes(lessonId)) {
      userMod.completedLessons.push(lessonId);
    }
    userMod.lastAccessed = new Date();

    // Update overall progress
    const totalLessons = await Module.aggregate([{ $unwind: '$lessons' }, { $count: 'total' }]);
    const totalCompleted = progress.modules.reduce((sum, m) => sum + m.completedLessons.length, 0);
    progress.overallProgress = totalLessons[0] ? Math.round((totalCompleted / totalLessons[0].total) * 100) : 0;

    await progress.save();
    res.status(200).json({ message: 'Lesson marked complete', completedLessons: userMod.completedLessons });
  } catch (err) {
    console.error('Complete lesson error:', err);
    res.status(500).json({ message: 'Failed to mark lesson complete' });
  }
});

// =====================================================================
// QUIZZES
// =====================================================================

// @desc    Get quiz for a module
// @route   GET /api/modules/:slug/quiz
// @access  Private
router.get('/:slug/quiz', protect, async (req, res) => {
  try {
    const module = await Module.findOne({ slug: req.params.slug });
    if (!module) return res.status(404).json({ message: 'Module not found' });

    const quiz = await Quiz.findOne({ module: module._id });
    if (!quiz) return res.status(404).json({ message: 'No quiz for this module' });

    // Send questions WITHOUT correct answers (anti-cheat)
    const sanitizedQuestions = quiz.questions.map(q => ({
      _id: q._id,
      text: q.text,
      type: q.type,
      options: q.options.map(o => ({ _id: o._id, text: o.text })), // Strip isCorrect
      difficulty: q.difficulty
    }));

    res.status(200).json({
      quizId: quiz._id,
      title: quiz.title,
      timeLimit: quiz.timeLimit,
      antiCheat: quiz.antiCheat,
      questionCount: quiz.questions.length,
      questions: quiz.randomize
        ? sanitizedQuestions.sort(() => Math.random() - 0.5)
        : sanitizedQuestions
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch quiz' });
  }
});

// @desc    Submit quiz answers (server-side grading)
// @route   POST /api/modules/quiz/:quizId/submit
// @access  Private
router.post('/quiz/:quizId/submit', protect, async (req, res) => {
  try {
    const { answers, violations } = req.body;
    const quiz = await Quiz.findById(req.params.quizId).populate('module');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Grade answers on the server (prevents client cheating)
    let score = 0;
    const gradedAnswers = quiz.questions.map((q, i) => {
      const userAnswer = answers[q._id.toString()] || answers[i];
      const correctOption = q.options.find(o => o.isCorrect);
      const isCorrect = correctOption && userAnswer === correctOption._id.toString();
      if (isCorrect) score++;

      return {
        questionId: q._id,
        selectedOption: userAnswer || null,
        isCorrect,
      };
    });

    const maxScore = quiz.questions.length;
    const percentage = Math.round((score / maxScore) * 100);

    // Save attempt
    const attempt = await QuizAttempt.create({
      user: req.user._id,
      quiz: quiz._id,
      module: quiz.module?._id,
      answers: gradedAnswers,
      score,
      maxScore,
      percentage,
      completedAt: new Date(),
      violations: (violations || []).map(v => ({ type: v.type, timestamp: new Date(v.timestamp) }))
    });

    // Update progress with quiz score
    let progress = await Progress.findOne({ user: req.user._id });
    if (progress) {
      let userMod = progress.modules.find(m => m.moduleId?.toString() === quiz.module?._id?.toString());
      if (userMod) {
        userMod.quizScores.push(percentage);
      }
      await progress.save();
    }

    // Return results WITH explanations
    const detailedResults = quiz.questions.map((q, i) => ({
      text: q.text,
      correctAnswer: q.options.find(o => o.isCorrect)?.text || q.correctAnswer,
      yourAnswer: q.options.find(o => o._id.toString() === gradedAnswers[i]?.selectedOption)?.text || 'Not answered',
      isCorrect: gradedAnswers[i]?.isCorrect,
      explanation: q.explanation
    }));

    res.status(200).json({
      message: 'Quiz submitted and graded',
      score,
      maxScore,
      percentage,
      passed: percentage >= 60,
      results: detailedResults,
      attemptId: attempt._id
    });
  } catch (err) {
    console.error('Quiz submit error:', err);
    res.status(500).json({ message: 'Failed to submit quiz' });
  }
});

// =====================================================================
// CODE EXECUTION — DISABLED (Security)
// The previous implementation used child_process.execSync which allows
// arbitrary OS command execution (RCE vulnerability). Replaced with
// a safe stub. To re-enable, use a Docker sandbox or Judge0 API.
// =====================================================================
router.post('/execute', protect, async (req, res) => {
  return res.status(503).json({
    message: 'Code execution is temporarily disabled for security hardening. Use your local IDE to run code.',
    output: null,
    error: 'Service unavailable'
  });
});

export default router;

import express from 'express';
import { protect } from '../middleware/auth.js';
import { generateRoadmap } from '../services/aiService.js';
import Resume from '../models/Resume.js';
import Progress from '../models/Progress.js';
import SavedRoadmap from '../models/SavedRoadmap.js';

const router = express.Router();

// @desc    Generate personalized AI roadmap
// @route   POST /api/ai/roadmap
// @access  Private
router.post('/roadmap', protect, async (req, res) => {
  try {
    const { targetRole = 'Software Engineer', targetMonths = 3, experienceLevel = 'Beginner', specificGoals = '', companyType = 'indian-product' } = req.body;

    // Gather the student's current profile from DB
    const resume = await Resume.findOne({ user: req.user._id });
    const progress = await Progress.findOne({ user: req.user._id });

    const profile = {
      skills: resume?.parsedData?.skills || [],
      resumeScore: resume?.analysis?.score || 0,
      quizScores: {},
      targetRole,
      targetMonths: parseInt(targetMonths),
      experienceLevel,
      specificGoals,
      companyType
    };

    // Fill quiz scores from progress if available
    if (progress?.modules) {
      for (const mod of progress.modules) {
        if (mod.quizScores?.length > 0) {
          const avg = mod.quizScores.reduce((a, b) => a + b, 0) / mod.quizScores.length;
          profile.quizScores[mod.moduleName || 'unknown'] = Math.round(avg);
        }
      }
    }

    const roadmap = await generateRoadmap(profile);

    // Save or update in database
    const saved = await SavedRoadmap.findOneAndUpdate(
      { user: req.user._id },
      {
        user: req.user._id,
        targetRole,
        companyType,
        experienceLevel,
        totalMonths: parseInt(targetMonths),
        phases: roadmap.phases,
        weeklyPlan: roadmap.weeklyPlan,
        gapAnalysis: roadmap.gapAnalysis,
        portfolioProjects: roadmap.portfolioProjects,
        recommendedResources: roadmap.recommendedResources,
        interviewFocus: roadmap.interviewFocus
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      message: 'Roadmap generated and saved successfully',
      roadmap: saved
    });
  } catch (err) {
    console.error('Roadmap error:', err);
    res.status(500).json({ message: 'Failed to generate roadmap' });
  }
});

// @desc    Get current saved roadmap
// @route   GET /api/ai/roadmap/current
// @access  Private
router.get('/roadmap/current', protect, async (req, res) => {
  try {
    const roadmap = await SavedRoadmap.findOne({ user: req.user._id });
    if (!roadmap) {
      return res.status(404).json({ message: 'No active roadmap found' });
    }
    res.json({ roadmap });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch roadmap' });
  }
});

// @desc    Toggle task completion
// @route   PUT /api/ai/roadmap/task
// @access  Private
router.put('/roadmap/task', protect, async (req, res) => {
  try {
    const { taskId, isWeekly } = req.body;
    if (!taskId) return res.status(400).json({ message: 'Task ID required' });

    const roadmap = await SavedRoadmap.findOne({ user: req.user._id });
    if (!roadmap) return res.status(404).json({ message: 'Roadmap not found' });

    const arrayField = isWeekly ? 'completedWeeklyTasks' : 'completedTasks';
    const index = roadmap[arrayField].indexOf(taskId);
    
    if (index > -1) {
      roadmap[arrayField].splice(index, 1); // Uncheck
    } else {
      roadmap[arrayField].push(taskId); // Check
    }

    await roadmap.save();
    res.json({ success: true, [arrayField]: roadmap[arrayField] });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

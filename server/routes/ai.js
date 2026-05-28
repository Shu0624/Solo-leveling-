import express from 'express';
import { protect } from '../middleware/auth.js';
import { generateRoadmap } from '../services/aiService.js';
import Resume from '../models/Resume.js';
import Progress from '../models/Progress.js';
import SavedRoadmap from '../models/SavedRoadmap.js';
import { getGroqChatCompletion } from '../services/groqService.js';

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

// @desc    Get AI tutor assistance on a specific module/lesson
// @route   POST /api/ai/module-tutor
// @access  Private
router.post('/module-tutor', protect, async (req, res) => {
  try {
    const { moduleTitle, lessonTitle, lessonContent, question, chatHistory = [] } = req.body;

    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }

    const messages = [
      {
        role: 'system',
        content: `You are an expert AI Coding Tutor and Academic Advisor for B.Tech students on the learning platform "LevelUp".
You are tutoring the student on the module "${moduleTitle}".
The student is currently learning from the lesson titled "${lessonTitle}".
Here is the lesson content:
"""
${lessonContent}
"""

Guidelines:
1. Provide a clean, helpful explanation.
2. If code snippets are requested or relevant, provide them in the language of the lesson (or Python/JS/C++).
3. Be encouraging, educational, and clear.
4. Keep the explanation precise and formatted cleanly in Markdown.
5. Do not hallucinate or go off-topic. Focus on answering their queries regarding this subject.`
      }
    ];

    // Append history (only last 10 turns to keep context window clean)
    const recentHistory = chatHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    }

    // Append the current question
    messages.push({
      role: 'user',
      content: question
    });

    const response = await getGroqChatCompletion(messages, false, 0.6);

    res.json({ response });
  } catch (err) {
    console.error('Module Tutor Error:', err);
    res.status(500).json({ message: 'AI Tutor service is temporarily unavailable.' });
  }
});

// @desc    Generate a dynamic AI MCQ quiz on a topic
// @route   POST /api/ai/generate-quiz
// @access  Private
router.post('/generate-quiz', protect, async (req, res) => {
  try {
    const { topic, difficulty = 'medium' } = req.body;
    if (!topic) return res.status(400).json({ message: 'Topic is required' });

    const prompt = [
      {
        role: 'system',
        content: `You are an expert academic evaluator generating multiple-choice questions for B.Tech CS students.
Generate a JSON object containing exactly 5 questions on the topic "${topic}" at "${difficulty}" difficulty.
Return ONLY a valid JSON object matching the following structure:
{
  "questions": [
    {
      "id": 1,
      "text": "The question description...",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correctAnswer": 0, // index of correct option (0 to 3)
      "explanation": "Detailed explanation of why this option is correct and others are not..."
    }
  ]
}
Do not write any text, markdown blocks, or wrap the JSON in markdown code blocks. Just return the raw JSON object.`
      }
    ];

    const rawResponse = await getGroqChatCompletion(prompt, true, 0.4);
    
    // Clean up response if it has backticks
    let jsonStr = rawResponse.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.substring(7);
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.substring(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.substring(0, jsonStr.length - 3);
    }

    const quizData = JSON.parse(jsonStr.trim());
    res.json(quizData);
  } catch (err) {
    console.error('Generate Quiz Error:', err);
    res.status(500).json({ message: 'Failed to generate quiz' });
  }
});

// @desc    Draft academic warning notice for low attendance
// @route   POST /api/ai/draft-attendance-notice
// @access  Private
router.post('/draft-attendance-notice', protect, async (req, res) => {
  try {
    const { studentName, attendancePercentage, subject, parentName = 'Parent/Guardian' } = req.body;
    if (!studentName || !attendancePercentage) {
      return res.status(400).json({ message: 'studentName and attendancePercentage are required' });
    }

    const prompt = [
      {
        role: 'system',
        content: `You are an academic administration officer at a college.
Write a polite, formal, yet firm email notification to the parents of student "${studentName}" who has an attendance percentage of ${attendancePercentage}% in ${subject || 'all subjects'}.
This is below the mandatory 75% threshold mandated by the university guidelines.
Explain that the student is in danger of being barred from taking final exams (defaulter list).
Request them to discuss this issue with the student and ensure attendance improves.
Include advice on academic recovery or meeting the class coordinator.
Format the output as a professional email template containing a subject line and email body. Keep it formatted nicely in markdown.`
      }
    ];

    const response = await getGroqChatCompletion(prompt, false, 0.5);
    res.json({ draft: response });
  } catch (err) {
    console.error('Draft Notice Error:', err);
    res.status(500).json({ message: 'Failed to draft notice' });
  }
});

// @desc    Generate DSA milestones and guidance based on student stats
// @route   POST /api/ai/dsa-milestones
// @access  Private
router.post('/dsa-milestones', protect, async (req, res) => {
  try {
    const { easy, medium, hard, platform = 'LeetCode' } = req.body;

    const prompt = [
      {
        role: 'system',
        content: `You are an expert DSA Coach and Interview Coordinator.
Analyze this student's current solved statistics on coding platforms:
- Easy: ${easy} solved
- Medium: ${medium} solved
- Hard: ${hard} solved
Primary Platform: ${platform}

Provide a structured, personalized 3-step recommendation report in Markdown containing:
1. **Skill Gap Assessment**: Based on the ratio of Easy/Medium/Hard.
2. **Next 5 Targeted Patterns/Topics**: Recommend specific coding patterns (e.g. dynamic programming, two pointers, backtracking) they should master next.
3. **5 High-Yield Classic Problems**: Recommend 5 exact problems (from LeetCode/GFG) with brief tips on how to approach them.
Keep it encouraging, clean, and highly actionable.`
      }
    ];

    const response = await getGroqChatCompletion(prompt, false, 0.6);
    res.json({ plan: response });
  } catch (err) {
    console.error('DSA Milestones Error:', err);
    res.status(500).json({ message: 'Failed to generate DSA plan' });
  }
});

export default router;

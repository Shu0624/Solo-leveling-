import express from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import streamifier from 'streamifier';
import cloudinary from '../utils/cloudinary.js';
import { protect } from '../middleware/auth.js';
import { analyzeResume } from '../services/aiService.js';
import Resume from '../models/Resume.js';
import ResumeDraft from '../models/ResumeDraft.js';
import { getGroqChatCompletion } from '../services/groqService.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are supported'), false);
    }
  }
});

// Rate limit resume analysis — prevents Groq API abuse
const resumeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,                    // 10 analyses per hour per IP
  message: { message: 'Too many resume analyses. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadToCloudinary = (buffer, filename) => {
  return new Promise((resolve, reject) => {
    const cld_upload_stream = cloudinary.uploader.upload_stream(
      {
        folder: 'levelup_resumes',
        resource_type: 'image',
        public_id: `${Date.now()}_${filename.replace(/\.pdf$/i, '')}`
      },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    streamifier.createReadStream(buffer).pipe(cld_upload_stream);
  });
};

// @desc    Upload and Analyze Resume (with real PDF parsing)
// @route   POST /api/resume/upload
// @access  Private
router.post('/upload', protect, resumeLimiter, upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a PDF file' });
  }

  try {
    // ---- REAL PDF TEXT EXTRACTION ----
    const pdfData = await pdf(req.file.buffer);
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length < 30) {
      return res.status(400).json({
        message: 'Could not extract text from this PDF. It may be image-based. Please use a text-based PDF.'
      });
    }

    // ---- ANALYZE with elite AI service ----
    const analysis = await analyzeResume(extractedText, req.body.jobTitle, req.body.companyName);

    // ---- UPLOAD TO CLOUDINARY ----
    let cloudinaryUrl = '';
    try {
      const cldResult = await uploadToCloudinary(req.file.buffer, req.file.originalname);
      cloudinaryUrl = cldResult.secure_url;
    } catch (cldErr) {
      console.error('Cloudinary upload error:', cldErr);
      // We can still proceed if cloudinary fails, it just won't have a URL.
    }

    // ---- SAVE to database for version tracking ----
    let resumeDoc = await Resume.findOne({ user: req.user._id });

    if (resumeDoc) {
      // Push old version to history
      resumeDoc.versions.push({
        fileUrl: resumeDoc.fileUrl || resumeDoc.filename, // Store old URL or filename fallback
        uploadedAt: resumeDoc.updatedAt,
        score: resumeDoc.analysis?.score || 0
      });
      // Update current
      resumeDoc.filename = req.file.originalname;
      if (cloudinaryUrl) resumeDoc.fileUrl = cloudinaryUrl;
      resumeDoc.parsedData = {
        skills: analysis.skillNames || [],
      };
      resumeDoc.analysis = {
        score: analysis.score,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        missingKeywords: analysis.missingKeywords,
        suggestions: analysis.suggestions
      };
      await resumeDoc.save();
    } else {
      resumeDoc = await Resume.create({
        user: req.user._id,
        filename: req.file.originalname,
        fileUrl: cloudinaryUrl,
        parsedData: {
          skills: analysis.skillNames || [],
        },
        analysis: {
          score: analysis.score,
          strengths: analysis.strengths,
          weaknesses: analysis.weaknesses,
          missingKeywords: analysis.missingKeywords,
          suggestions: analysis.suggestions
        }
      });
    }

    res.status(200).json({
      message: 'Resume analyzed successfully',
      analysis,
      resumeId: resumeDoc._id,
      fileUrl: resumeDoc.fileUrl,
      versionsCount: resumeDoc.versions?.length || 0
    });
  } catch (err) {
    console.error('Resume analysis error:', err);
    res.status(500).json({ message: 'Failed to process resume: ' + err.message });
  }
});

// @desc    Get resume history for current user
// @route   GET /api/resume/history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const resume = await Resume.findOne({ user: req.user._id });
    if (!resume) {
      return res.status(404).json({ message: 'No resume found. Upload one first.' });
    }
    res.status(200).json({
      current: {
        filename: resume.filename,
        fileUrl: resume.fileUrl,
        score: resume.analysis?.score,
        skills: resume.parsedData?.skills,
        updatedAt: resume.updatedAt
      },
      versions: resume.versions || []
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch resume history' });
  }
});

// @desc    Get top 15 highest scoring resumes
// @route   GET /api/resume/top
// @access  Private
router.get('/top', protect, async (req, res) => {
  try {
    const topResumes = await Resume.find({ 'analysis.score': { $exists: true, $ne: null } })
      .sort({ 'analysis.score': -1, updatedAt: -1 })
      .limit(15)
      .populate('user', 'name email college department')
      .lean();
    
    // Process to extract relevant fields and hide email for privacy
    const leaderboard = topResumes.map(r => ({
      _id: r._id,
      score: r.analysis.score,
      jobTitle: r.filename?.replace('.pdf', '') || 'Unknown Role',
      date: r.updatedAt,
      user: r.user ? {
        name: r.user.name,
        college: r.user.college || 'N/A',
        department: r.user.department || 'N/A'
      } : { name: 'Anonymous', college: 'N/A', department: 'N/A' }
    }));

    res.status(200).json(leaderboard);
  } catch (err) {
    console.error('Failed to fetch top resumes:', err);
    res.status(500).json({ message: 'Failed to fetch top resumes' });
  }
});

// @desc    Get user's personal top 5 analysis scores
// @route   GET /api/resume/my-top
// @access  Private
router.get('/my-top', protect, async (req, res) => {
  try {
    const resume = await Resume.findOne({ user: req.user._id }).lean();
    if (!resume) {
      return res.status(200).json([]);
    }

    const analyses = [];
    if (resume.analysis?.score != null) {
      analyses.push({
        _id: 'current',
        score: resume.analysis.score,
        fileUrl: resume.fileUrl,
        jobTitle: resume.filename?.replace('.pdf', '') || 'Unknown Role',
        date: resume.updatedAt
      });
    }

    if (resume.versions && resume.versions.length > 0) {
      resume.versions.forEach((v, idx) => {
        if (v.score != null) {
          analyses.push({
            _id: `v_${idx}`,
            score: v.score,
            fileUrl: v.fileUrl,
            jobTitle: v.fileUrl?.replace('.pdf', '') || 'Unknown Role',
            date: v.uploadedAt
          });
        }
      });
    }

    analyses.sort((a, b) => b.score - a.score);
    const top5 = analyses.slice(0, 5);

    res.status(200).json(top5);
  } catch (err) {
    console.error('Failed to fetch personal top resumes:', err);
    res.status(500).json({ message: 'Failed to fetch personal top resumes' });
  }
});

// =====================================================================
// RESUME BUILDER — Draft Save/Load + AI Generation
// =====================================================================

// @desc    Save or update resume builder draft
// @route   POST /api/resume/save-draft
// @access  Private
router.post('/save-draft', protect, async (req, res) => {
  try {
    const draftData = req.body;
    let draft = await ResumeDraft.findOne({ user: req.user._id });
    if (draft) {
      Object.assign(draft, draftData);
      await draft.save();
    } else {
      draft = await ResumeDraft.create({ ...draftData, user: req.user._id });
    }
    res.status(200).json({ message: 'Draft saved', draft });
  } catch (err) {
    console.error('Save draft error:', err);
    res.status(500).json({ message: 'Failed to save draft' });
  }
});

// @desc    Get resume builder draft
// @route   GET /api/resume/draft
// @access  Private
router.get('/draft', protect, async (req, res) => {
  try {
    const draft = await ResumeDraft.findOne({ user: req.user._id }).lean();
    res.status(200).json(draft || null);
  } catch (err) {
    console.error('Get draft error:', err);
    res.status(500).json({ message: 'Failed to fetch draft' });
  }
});

// @desc    AI-powered resume builder — takes conversation context and generates structured resume JSON
// @route   POST /api/resume/ai-build
// @access  Private
router.post('/ai-build', protect, resumeLimiter, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'Messages array is required' });
    }

    const systemPrompt = `You are an expert AI Resume Writer specializing in building professional, ATS-optimized resumes for B.Tech students and early-career developers in India.

Your job: Based on the conversation with the student, generate a complete, structured resume JSON.

Rules:
- Extract ALL information the student provided in the conversation.
- Write a compelling professional summary (2-3 sentences) based on their skills and goals.
- Rewrite bullet points using strong action verbs and quantify impact where possible.
- Categorize skills intelligently into: languages, frontend, backend, ai, databases, tools, concepts.
- Format experience bullets as impactful achievement statements ("Developed X using Y, resulting in Z").
- If information is missing or sparse, use reasonable professional defaults but DO NOT fabricate facts.

Output STRICTLY as valid JSON matching this schema:
{
  "fullName": "string",
  "phone": "string",
  "email": "string",
  "location": "string",
  "linkedin": "string",
  "github": "string",
  "summary": "string (2-3 sentence professional summary)",
  "skills": {
    "languages": ["string"],
    "frontend": ["string"],
    "backend": ["string"],
    "ai": ["string"],
    "databases": ["string"],
    "tools": ["string"],
    "concepts": ["string"]
  },
  "experience": [
    { "title": "string", "company": "string", "dateRange": "string", "bullets": ["string"] }
  ],
  "projects": [
    { "name": "string", "techStack": "string", "description": "string", "bullets": ["string"] }
  ],
  "education": [
    { "degree": "string", "institution": "string", "cgpa": "string", "year": "string" }
  ],
  "certifications": ["string"],
  "achievements": ["string"]
}

IMPORTANT: Return ONLY the JSON object. No markdown, no explanation.`;

    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    const response = await getGroqChatCompletion(aiMessages, true, 0.3);

    let resumeData;
    try {
      resumeData = JSON.parse(response);
    } catch (e) {
      const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
      resumeData = JSON.parse(cleanJson);
    }

    // Save as draft automatically
    let draft = await ResumeDraft.findOne({ user: req.user._id });
    if (draft) {
      Object.assign(draft, resumeData);
      await draft.save();
    } else {
      draft = await ResumeDraft.create({ ...resumeData, user: req.user._id });
    }

    res.status(200).json({ message: 'Resume generated successfully', resume: resumeData });
  } catch (err) {
    console.error('AI resume build error:', err);
    res.status(500).json({ message: 'Failed to generate resume: ' + err.message });
  }
});

export default router;

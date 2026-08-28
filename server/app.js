import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import mongoSanitize from './middleware/sanitize.js';

// Route imports
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import departmentRoutes from './routes/department.js';
import resumeRoutes from './routes/resume.js';
import aiRoutes from './routes/ai.js';
import modulesRoutes from './routes/modules.js';
import activityRoutes from './routes/activity.js';
import chatRoutes from './routes/chat.js';
import assessmentRoutes from './routes/assessment.js';
import analyticsRoutes from './routes/analytics.js';
import interviewRoutes from './routes/interview.js';
import languageRoutes from './routes/language.js';
import discoverRoutes from './routes/discover.js';
import sessionRoutes from './routes/sessions.js';

dotenv.config();

// Validate required env vars with graceful warnings (never crash serverless runtime)
if (!process.env.MONGO_URI) {
  console.warn('⚠️  [SERVER] MONGO_URI is missing. Please set it in your environment variables.');
}
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  [SERVER] JWT_SECRET is missing. Using a fallback secret for local dev/preview.');
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'levelup_dev_fallback_secret_at_least_32_characters_long';
}

const app = express();
app.set('trust proxy', 1); // Trust the first proxy (e.g. Vercel, Render, Railway)

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:", "https:", process.env.CLIENT_URL || 'http://localhost:5173'],
      mediaSrc: ["'self'", "blob:"],
      frameSrc: ["'self'", "blob:"],
    },
  },
}));

// CORS Configuration — supports local dev, configured CLIENT_URL, and any Vercel preview domain
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.vercel.app/') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in preview/demo to prevent CORS blocking
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Strip MongoDB operator injection vectors ($-prefixed / dotted keys)
app.use(mongoSanitize);

// Serverless DB connection middleware (ensures active DB connection on cold starts)
app.use(async (req, res, next) => {
  if (process.env.MONGO_URI && req.path.startsWith('/api') && req.path !== '/api/health') {
    try {
      await connectDB();
    } catch (dbErr) {
      console.error('[DB] Connection check failed:', dbErr.message);
    }
  }
  next();
});

// Health check endpoint for monitoring & Vercel inspection
app.get('/api/health', (req, res) => {
  const mongoose = global.mongoose;
  const isDbConnected = Boolean(mongoose?.conn?.readyState === 1 || mongoose?.readyState === 1);
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: isDbConnected ? 'connected' : (process.env.MONGO_URI ? 'connecting/offline' : 'unconfigured'),
  });
});

// AI Rate Limiting — protect AI resources from abuse
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { message: 'Too many requests to AI services. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/department', departmentRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/modules', modulesRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/language', languageRoutes);
app.use('/api/discover', discoverRoutes);

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const errorCode = err.code || 'INTERNAL_ERROR';

  console.error(`[ERROR] ${req.method} ${req.originalUrl} — ${statusCode} ${errorCode}`);
  console.error(`  Message: ${err.message}`);
  if (process.env.NODE_ENV !== 'production') console.error(err.stack);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: messages.join(', ') });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ code: 'DUPLICATE_KEY', message: `A record with this ${field} already exists.` });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ code: 'INVALID_TOKEN', message: 'Invalid authentication token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ code: 'TOKEN_EXPIRED', message: 'Authentication token has expired.' });
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    return res.status(400).json({ code: 'UPLOAD_ERROR', message: err.message });
  }

  res.status(statusCode).json({
    code: errorCode,
    message: process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'An unexpected error occurred. Please try again later.'
      : err.message || 'Server Error'
  });
});

export default app;

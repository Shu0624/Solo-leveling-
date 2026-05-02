import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import http from 'http';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import cron from 'node-cron';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
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
import ChatMessage from './models/ChatMessage.js';
import { runAggregation } from './scripts/aggregateAnalytics.js';
import { seedIfEmpty, runDailyDiscovery } from './services/discoveryService.js';

dotenv.config();

// ---- Fail-fast environment validation ----
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error(`\n❌ FATAL: Missing required environment variables: ${missing.join(', ')}`);
  console.error('   Copy .env.example to .env and fill in the values.\n');
  process.exit(1);
}

// Warn about weak JWT secrets
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.warn('⚠️  WARNING: JWT_SECRET is too short (< 32 chars). Use a cryptographically random secret in production.');
}

// Connect to database
connectDB().then(async () => {
  // One-time migration: Drop old attendance index that conflicts with subject-wise tracking
  try {
    const mongoose = (await import('mongoose')).default;
    if (mongoose.connection.readyState === 1) {
      const collection = mongoose.connection.collection('attendances');
      const indexes = await collection.indexes();
      const oldIndex = indexes.find(idx => idx.name === 'classroomCode_1_date_1');
      if (oldIndex) {
        await collection.dropIndex('classroomCode_1_date_1');
        console.log('[MIGRATION] Dropped old attendance index classroomCode_1_date_1');
      }
    }
  } catch (e) {
    // Index might not exist, that's fine
    if (!e.message.includes('not found')) console.log('[MIGRATION] Index check:', e.message);
  }

  // Seed programs & benefits collections on first startup
  try { await seedIfEmpty(); } catch (e) { console.error('[SEED] Initial seed failed:', e.message); }
}).catch(() => {});

const app = express();
const server = http.createServer(app);

// Socket.io setup for WebRTC signaling later
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Middleware
// Security headers — CSP restricts script sources to prevent XSS
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "wss:", "ws:", process.env.CLIENT_URL || 'http://localhost:5173'],
      mediaSrc: ["'self'", "blob:"],
      frameSrc: ["'self'", "blob:"],
    },
  },
}));

// CORS — restrict to configured client origin
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(s => s.trim());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl) in development
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check for monitoring (UptimeRobot, etc.)
app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Socket.io authentication middleware — verify JWT before allowing connections
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
  if (!token) {
    return next(new Error('Authentication required'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    return next(new Error('Invalid token'));
  }
});

// Socket.io logic for WebRTC + Chat
io.on('connection', (socket) => {
  console.log('Client connected', socket.id);
  
  // Track which WebRTC room this socket is in (for cleanup)
  let currentRoomId = null;

  socket.on('join-room', (roomId, userId) => {
    currentRoomId = roomId;
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', userId);
  });

  // Relay WebRTC signaling messages
  socket.on('offer', (payload) => {
    io.to(payload.target).emit('offer', payload);
  });

  socket.on('answer', (payload) => {
    io.to(payload.target).emit('answer', payload);
  });

  socket.on('ice-candidate', (incoming) => {
    io.to(incoming.target).emit('ice-candidate', incoming);
  });

  // =====================================================================
  // COURSE GROUP CHAT — SECURED
  // Uses socket.userId from JWT middleware instead of trusting client data
  // =====================================================================
  socket.on('join-course-chat', async (room) => {
    if (!room || typeof room !== 'string' || room.length > 30) return;
    socket.join(`chat:${room}`);
    try {
      const history = await ChatMessage.find({ room })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
      socket.emit('course-chat-history', history.reverse());
    } catch (e) {
      console.error('Chat history error:', e);
    }
  });

  socket.on('leave-course-chat', (room) => {
    if (room) socket.leave(`chat:${room}`);
  });

  socket.on('course-message', async (data) => {
    const { room, userName, message } = data;
    if (!room || !message || typeof message !== 'string') return;
    // SECURITY: Use verified socket.userId, NOT the client-provided userId
    // Truncate message to prevent payload flooding
    const safeMessage = message.trim().substring(0, 2000);
    if (safeMessage.length === 0) return;
    try {
      const saved = await ChatMessage.create({
        room,
        userId: socket.userId,  // From JWT — verified identity
        userName: userName ? String(userName).substring(0, 100) : 'Anonymous',
        message: safeMessage
      });
      io.to(`chat:${room}`).emit('course-message', saved);
    } catch (e) {
      console.error('Chat save error:', e);
    }
  });

  // Single disconnect handler (fixes memory leak from nested listener)
  socket.on('disconnect', () => {
    if (currentRoomId) {
      socket.to(currentRoomId).emit('user-disconnected', socket.userId);
    }
    console.log('Client disconnected', socket.id);
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/modules', modulesRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/language', languageRoutes);
app.use('/api/discover', discoverRoutes);

// =====================================================================
// CRON JOBS — Analytics Aggregation
// =====================================================================
// Daily at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('[CRON] Running daily analytics aggregation...');
  try { await runAggregation('daily'); } catch (e) { console.error('[CRON] Daily aggregation failed:', e.message); }
});
// Weekly on Sunday at midnight
cron.schedule('0 0 * * 0', async () => {
  console.log('[CRON] Running weekly analytics aggregation...');
  try { await runAggregation('weekly'); } catch (e) { console.error('[CRON] Weekly aggregation failed:', e.message); }
});
// Monthly on the 1st at midnight
cron.schedule('0 0 1 * *', async () => {
  console.log('[CRON] Running monthly analytics aggregation...');
  try { await runAggregation('monthly'); } catch (e) { console.error('[CRON] Monthly aggregation failed:', e.message); }
});
console.log('[CRON] Analytics aggregation jobs scheduled');

// Daily at 6 AM — AI Discovery for Programs & Benefits
cron.schedule('0 6 * * *', async () => {
  console.log('[CRON] Running daily AI discovery for programs & benefits...');
  try { await runDailyDiscovery(); } catch (e) { console.error('[CRON] Discovery failed:', e.message); }
});
console.log('[CRON] AI Discovery job scheduled (daily at 6 AM)');


// =====================================================================
// ENHANCED ERROR HANDLING MIDDLEWARE
// =====================================================================
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const errorCode = err.code || 'INTERNAL_ERROR';

  // Log with context for easier debugging
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
    const field = Object.keys(err.keyValue)[0];
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

const PORT = process.env.PORT || 5000;

// If we are NOT deploying on Vercel Serverless, listen dynamically
if (process.env.VERCEL !== '1') {
  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

// Export for Vercel Serverless
export default app;

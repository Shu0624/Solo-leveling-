import http from 'http';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import cron from 'node-cron';
import app from './app.js';
import connectDB from './config/db.js';
import ChatMessage from './models/ChatMessage.js';
import { runAggregation } from './scripts/aggregateAnalytics.js';
import { seedIfEmpty, runDailyDiscovery } from './services/discoveryService.js';
import {
  startSession, endSession, heartbeat, markIdle, markResume, tabSwitch,
  initSessionManager
} from './services/sessionManager.js';
import User from './models/User.js';

// Connect to database and perform startup checks in standalone server mode
connectDB().then(async () => {
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
    if (!e.message.includes('not found')) console.log('[MIGRATION] Index check:', e.message);
  }

  // Seed programs & benefits collections on startup if empty
  try { await seedIfEmpty(); } catch (e) { console.error('[SEED] Initial seed check:', e.message); }
}).catch((err) => {
  console.warn('[DB] Standalone startup DB connection note:', err.message);
});

const server = http.createServer(app);

// Socket.io setup for WebRTC signaling, Live Activities, and Course Chat
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      callback(null, true);
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Socket.io authentication middleware — verify JWT before allowing connections
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
  if (!token) {
    return next(new Error('Authentication required'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'levelup_dev_fallback_secret_at_least_32_characters_long');
    socket.userId = decoded.id;
    next();
  } catch (err) {
    return next(new Error('Invalid token'));
  }
});

// Socket.io logic for WebRTC + Chat + Session Tracking
io.on('connection', (socket) => {
  console.log('[Socket] Client connected:', socket.id);
  
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

  // Real-time session tracking
  socket.on('session:start', async (data) => {
    try {
      const user = await User.findById(socket.userId).select('name classroomCode department college').lean();
      if (!user) return;
      const result = await startSession(socket.userId, {
        category: data.category || 'other',
        label: data.label || '',
        source: data.source || 'manual',
        deviceInfo: data.deviceInfo || {},
        userName: user.name,
        classroomCode: user.classroomCode,
      }, io);
      socket.emit('session:confirmed', result);
    } catch (err) {
      console.error('[WS] session:start error:', err.message);
      socket.emit('session:error', { message: 'Failed to start session' });
    }
  });

  socket.on('session:heartbeat', (data) => {
    const result = heartbeat(socket.userId, data, io);
    if (result && !result.error) {
      socket.emit('session:heartbeat-ack', result);
    }
  });

  socket.on('session:idle', () => {
    markIdle(socket.userId, io);
  });

  socket.on('session:resume', () => {
    markResume(socket.userId, io);
  });

  socket.on('session:tab-switch', (data) => {
    tabSwitch(socket.userId, data?.visible);
  });

  socket.on('session:end', async () => {
    try {
      const result = await endSession(null, socket.userId, io);
      socket.emit('session:ended', result);
    } catch (err) {
      console.error('[WS] session:end error:', err.message);
    }
  });

  // Faculty live monitoring
  socket.on('faculty:join', async (classroomCode) => {
    if (!classroomCode || typeof classroomCode !== 'string') return;
    const user = await User.findById(socket.userId).select('role assignedClassrooms').lean();
    if (!user || !['faculty', 'hod', 'principal', 'placement'].includes(user.role)) return;
    socket.join(`faculty:${classroomCode}`);
    console.log(`[WS] Faculty ${socket.userId} joined room faculty:${classroomCode}`);
  });

  socket.on('faculty:leave', (classroomCode) => {
    if (classroomCode) socket.leave(`faculty:${classroomCode}`);
  });

  // Course group chat
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
    const safeMessage = message.trim().substring(0, 2000);
    if (safeMessage.length === 0) return;
    try {
      const saved = await ChatMessage.create({
        room,
        userId: socket.userId,
        userName: userName ? String(userName).substring(0, 100) : 'Anonymous',
        message: safeMessage
      });
      io.to(`chat:${room}`).emit('course-message', saved);
    } catch (e) {
      console.error('Chat save error:', e);
    }
  });

  socket.on('disconnect', async () => {
    if (currentRoomId) {
      socket.to(currentRoomId).emit('user-disconnected', socket.userId);
    }
    try {
      await endSession(null, socket.userId, io);
    } catch (e) {
      // Ignored
    }
    console.log('[Socket] Client disconnected:', socket.id);
  });
});

app.set('io', io);
initSessionManager(io);

// CRON JOBS — Only run when NOT in serverless Vercel
if (process.env.VERCEL !== '1') {
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
  // Daily at 6 AM — AI Discovery for Programs & Benefits
  cron.schedule('0 6 * * *', async () => {
    console.log('[CRON] Running daily AI discovery for programs & benefits...');
    try { await runDailyDiscovery(); } catch (e) { console.error('[CRON] Discovery failed:', e.message); }
  });
  console.log('[CRON] Background scheduled jobs active');
}

const PORT = process.env.PORT || 5000;

if (process.env.VERCEL !== '1') {
  server.listen(PORT, () => {
    console.log(`🚀 LevelUp Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

export default app;

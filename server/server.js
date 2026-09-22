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
import Module from './models/Module.js';
import { canAccessClassroom } from './middleware/auth.js';
import { getJwtSecret } from './config/jwt.js';
import { corsOrigin } from './config/cors.js';

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
    // Same policy as the REST API — this was previously allow-everything.
    origin: corsOrigin,
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
    const decoded = jwt.verify(token, getJwtSecret());
    socket.userId = decoded.id;
    next();
  } catch (err) {
    return next(new Error('Invalid token'));
  }
});

// ---------------------------------------------------------------------------
// Peer-to-peer room occupancy
// ---------------------------------------------------------------------------
// A WebRTC room is created ad hoc by whoever navigates to /interview/:id —
// there is no server-side record to authorize against. What must not happen is
// a third party quietly joining an in-progress 1:1 interview and receiving the
// signalling needed to pull both streams.
//
// So the first two sockets to arrive own the room, and everyone after them is
// refused. Occupancy is per-process, which is correct here because the
// signalling relay is per-process too: two peers who cannot reach the same
// Socket.io instance cannot connect to each other anyway.
const P2P_ROOM_CAPACITY = 2;
const p2pRooms = new Map(); // roomId -> Set<socket.id>

const joinP2PRoom = (roomId, socketId) => {
  const occupants = p2pRooms.get(roomId) || new Set();
  if (occupants.has(socketId)) return true;
  if (occupants.size >= P2P_ROOM_CAPACITY) return false;
  occupants.add(socketId);
  p2pRooms.set(roomId, occupants);
  return true;
};

const leaveP2PRoom = (roomId, socketId) => {
  const occupants = p2pRooms.get(roomId);
  if (!occupants) return;
  occupants.delete(socketId);
  if (occupants.size === 0) p2pRooms.delete(roomId);
};

// Socket.io logic for WebRTC + Chat + Session Tracking
io.on('connection', (socket) => {
  console.log('[Socket] Client connected:', socket.id);
  
  let currentRoomId = null;

  socket.on('join-room', (roomId, userId) => {
    if (!roomId || typeof roomId !== 'string' || roomId.length > 100) return;

    if (!joinP2PRoom(roomId, socket.id)) {
      socket.emit('room-full', {
        roomId,
        message: 'This interview room already has two participants.',
      });
      return;
    }

    currentRoomId = roomId;
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', userId);
  });

  // Relay WebRTC signalling to the other occupant of the sender's room.
  //
  // This previously read `io.to(payload.target)`, but the client never sends a
  // `target` — it sends `{ roomId, offer | answer | candidate }`. So every
  // relay resolved to `io.to(undefined)` and reached nobody, which is why a
  // peer room sat on "Waiting for peer..." forever and no P2P call ever
  // connected.
  //
  // Relaying by room also settles the authorization question: `socket.to()`
  // only reaches sockets that joined, the sender's own room is used rather
  // than whatever room the payload claims, and joins are capped at two.
  const relayToPeer = (event) => (payload) => {
    if (!currentRoomId) return;
    socket.to(currentRoomId).emit(event, payload);
  };

  socket.on('offer', relayToPeer('offer'));
  socket.on('answer', relayToPeer('answer'));
  socket.on('ice-candidate', relayToPeer('ice-candidate'));

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
    if (!classroomCode || typeof classroomCode !== 'string' || classroomCode.length > 40) return;
    const user = await User.findById(socket.userId)
      .select('role assignedClassrooms college department classroomCode')
      .lean();
    if (!user || !['faculty', 'hod', 'principal', 'placement'].includes(user.role)) return;

    // Holding a staff role is not the same as having a claim on *this*
    // classroom. This previously stopped at the role check — so any faculty
    // account could stream live telemetry for any class in any college.
    if (!(await canAccessClassroom(user, classroomCode))) {
      socket.emit('faculty:join-denied', {
        classroomCode,
        message: 'You are not assigned to this classroom.',
      });
      return;
    }

    socket.join(`faculty:${classroomCode}`);
    console.log(`[WS] Faculty ${socket.userId} joined room faculty:${classroomCode}`);
  });

  socket.on('faculty:leave', (classroomCode) => {
    if (classroomCode) socket.leave(`faculty:${classroomCode}`);
  });

  // Course group chat
  // A course chat room is a module slug. Validating it against the module
  // catalogue stops arbitrary room names being conjured up and used as
  // unlisted channels, and stops history reads for rooms that never existed.
  const isRealModuleSlug = async (slug) => {
    try {
      return Boolean(await Module.exists({ slug }));
    } catch (e) {
      console.error('[WS] Module slug check failed:', e.message);
      return false;
    }
  };

  socket.on('join-course-chat', async (room) => {
    if (!room || typeof room !== 'string' || room.length > 30) return;
    if (!(await isRealModuleSlug(room))) {
      socket.emit('course-chat-denied', { room, message: 'Unknown course room.' });
      return;
    }
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
    // Posting requires having joined — otherwise the join-time slug check
    // could be skipped by emitting straight to an arbitrary room.
    if (!socket.rooms.has(`chat:${room}`)) return;
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
      // Free the slot, or the room stays "full" forever after two people leave.
      leaveP2PRoom(currentRoomId, socket.id);
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

// Read by /api/health so the client can tell "no one is studying right now"
// apart from "this deployment has no live tracking at all".
global.__levelupRealtime = true;

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

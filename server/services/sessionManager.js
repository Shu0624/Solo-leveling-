// =====================================================================
// LevelUp — Session Manager Service
// Manages real-time student activity tracking sessions
// Uses in-memory Map for active state (upgrade to Redis for production)
// =====================================================================

import Session from '../models/Session.js';
import Activity from '../models/Activity.js';
import DailyAnalytics from '../models/DailyAnalytics.js';
import User from '../models/User.js';

// ---- In-memory active session state ----
// Key: userId (string), Value: { sessionId, category, label, startTime, lastHeartbeat, ... }
const activeSessions = new Map();

// ---- Constants ----
const HEARTBEAT_TIMEOUT_MS = 90_000;       // 90s — if no heartbeat, session is abandoned
const BATCH_FLUSH_INTERVAL_MS = 60_000;    // 60s — batch flush to MongoDB
const CLEANUP_INTERVAL_MS = 30_000;        // 30s — check for abandoned sessions

// ---- Pending batch updates (accumulated between flushes) ----
const pendingUpdates = new Map();          // sessionId → { heartbeats, activeSecs, idleSecs, tabSwitches }

// =====================================================================
// START SESSION
// =====================================================================
export async function startSession(userId, data, io) {
  // End any existing active session first
  const existing = activeSessions.get(userId.toString());
  if (existing) {
    await endSession(existing.sessionId, userId, io);
  }

  // Get user info for denormalization
  const user = await User.findById(userId).select('classroomCode department college').lean();

  const session = await Session.create({
    user: userId,
    classroomCode: user?.classroomCode || data.classroomCode || '',
    department: user?.department || '',
    college: user?.college || '',
    category: data.category || 'other',
    label: data.label || '',
    startTime: new Date(),
    status: 'active',
    lastHeartbeat: new Date(),
    source: data.source || 'manual',
    deviceInfo: data.deviceInfo || {},
  });

  // Store in active sessions map
  const sessionState = {
    sessionId: session._id.toString(),
    mongoId: session._id,
    userId: userId.toString(),
    category: data.category || 'other',
    label: data.label || '',
    classroomCode: user?.classroomCode || '',
    startTime: Date.now(),
    lastHeartbeat: Date.now(),
    lastActiveTime: Date.now(),
    isIdle: false,
    idleStart: null,
    activeSecs: 0,
    idleSecs: 0,
    tabSwitches: 0,
    heartbeats: 0,
    userName: data.userName || '',
  };
  activeSessions.set(userId.toString(), sessionState);

  // Initialize pending update accumulator
  pendingUpdates.set(session._id.toString(), {
    heartbeats: 0,
    activeSecs: 0,
    idleSecs: 0,
    tabSwitches: 0,
  });

  // Broadcast to faculty room
  if (io) {
    const payload = {
      userId: userId.toString(),
      name: sessionState.userName,
      category: sessionState.category,
      label: sessionState.label,
      startTime: session.startTime,
    };
    if (sessionState.classroomCode) {
      io.to(`faculty:${sessionState.classroomCode}`).emit('live:student-started', payload);
    }
    io.to('faculty:all').emit('live:student-started', payload);
  }

  return {
    sessionId: session._id,
    startTime: session.startTime,
    category: session.category,
    status: 'active',
  };
}

// =====================================================================
// HEARTBEAT — Called every 30s from client
// =====================================================================
export function heartbeat(userId, data, io) {
  const state = activeSessions.get(userId.toString());
  if (!state) return { error: 'No active session' };

  const now = Date.now();
  const elapsed = Math.floor((now - state.lastHeartbeat) / 1000);

  state.heartbeats++;
  state.lastHeartbeat = now;

  // Accumulate active/idle time
  if (state.isIdle) {
    state.idleSecs += elapsed;
  } else {
    state.activeSecs += elapsed;
  }

  // Tab switch tracking
  if (data?.tabVisible === false) {
    state.tabSwitches++;
  }

  // Accumulate in pending batch update
  const pending = pendingUpdates.get(state.sessionId);
  if (pending) {
    pending.heartbeats++;
    if (state.isIdle) pending.idleSecs += elapsed;
    else pending.activeSecs += elapsed;
    if (data?.tabVisible === false) pending.tabSwitches++;
  }

  // Broadcast to faculty room
  const totalSecs = Math.floor((now - state.startTime) / 1000);
  if (io) {
    const payload = {
      userId: state.userId,
      name: state.userName,
      category: state.category,
      duration: totalSecs,
      activeDuration: state.activeSecs,
      status: state.isIdle ? 'idle' : 'active',
      focusPercent: state.activeSecs > 0
        ? Math.round((state.activeSecs / (state.activeSecs + state.idleSecs)) * 100)
        : 100,
    };
    if (state.classroomCode) {
      io.to(`faculty:${state.classroomCode}`).emit('live:student-update', payload);
    }
    io.to('faculty:all').emit('live:student-update', payload);
  }

  return {
    sessionId: state.sessionId,
    totalDuration: totalSecs,
    activeDuration: state.activeSecs,
    idleDuration: state.idleSecs,
    status: state.isIdle ? 'idle' : 'active',
  };
}

// =====================================================================
// IDLE — Client detected user went idle
// =====================================================================
export function markIdle(userId, io) {
  const state = activeSessions.get(userId.toString());
  if (!state || state.isIdle) return;

  state.isIdle = true;
  state.idleStart = Date.now();

  // Broadcast to faculty
  if (io) {
    const payload = {
      userId: state.userId,
      name: state.userName,
      category: state.category,
    };
    if (state.classroomCode) {
      io.to(`faculty:${state.classroomCode}`).emit('live:student-idle', payload);
    }
    io.to('faculty:all').emit('live:student-idle', payload);
  }
}

// =====================================================================
// RESUME — Client detected user returned from idle
// =====================================================================
export function markResume(userId, io) {
  const state = activeSessions.get(userId.toString());
  if (!state || !state.isIdle) return;

  const idleDuration = Math.floor((Date.now() - state.idleStart) / 1000);
  state.isIdle = false;
  state.idleSecs += idleDuration;
  state.idleStart = null;

  // Broadcast to faculty
  if (io) {
    const payload = {
      userId: state.userId,
      name: state.userName,
      category: state.category,
      duration: Math.floor((Date.now() - state.startTime) / 1000),
      status: 'active',
    };
    if (state.classroomCode) {
      io.to(`faculty:${state.classroomCode}`).emit('live:student-update', payload);
    }
    io.to('faculty:all').emit('live:student-update', payload);
  }
}

// =====================================================================
// TAB SWITCH — Client reports visibility change
// =====================================================================
export function tabSwitch(userId, visible) {
  const state = activeSessions.get(userId.toString());
  if (!state) return;

  if (!visible) {
    state.tabSwitches++;
  }
}

// =====================================================================
// END SESSION — Finalize, compute focus score, create Activity record
// =====================================================================
export async function endSession(sessionIdOrNull, userId, io) {
  const state = activeSessions.get(userId.toString());
  if (!state) return { error: 'No active session' };

  const now = Date.now();
  const totalDuration = Math.floor((now - state.startTime) / 1000);

  // Finalize any active idle period
  if (state.isIdle && state.idleStart) {
    state.idleSecs += Math.floor((now - state.idleStart) / 1000);
  }

  // Finalize active time (total minus idle)
  const finalActive = Math.max(totalDuration - state.idleSecs, 0);

  // Compute focus score
  const focusScore = computeFocusScore({
    activeDuration: finalActive,
    totalDuration,
    idleEvents: 0, // simplified — count from state
    tabSwitches: state.tabSwitches,
    targetMinutes: 30,
  });

  // Update Session document in MongoDB
  try {
    await Session.findByIdAndUpdate(state.mongoId, {
      $set: {
        endTime: new Date(),
        totalDuration,
        activeDuration: finalActive,
        idleDuration: state.idleSecs,
        status: 'completed',
        heartbeats: state.heartbeats,
        lastHeartbeat: new Date(),
        tabSwitches: state.tabSwitches,
        focusScore,
      }
    });
  } catch (err) {
    console.error('[SessionManager] Failed to update session:', err.message);
  }

  // Create Activity record (backward-compatible with existing analytics)
  if (totalDuration >= 10) {
    try {
      await Activity.create({
        user: userId,
        classroomCode: state.classroomCode,
        department: state.department || '',
        college: state.college || '',
        category: state.category,
        label: state.label || state.category,
        duration: totalDuration,
        type: 'study',
        date: new Date(state.startTime),
      });
    } catch (err) {
      console.error('[SessionManager] Failed to create activity:', err.message);
    }

    // Update DailyAnalytics rollup
    await updateDailyAnalytics(userId, state, totalDuration, finalActive, state.idleSecs, focusScore);
  }

  // Broadcast to faculty
  if (io) {
    const payload = {
      userId: state.userId,
      name: state.userName,
      category: state.category,
      duration: totalDuration,
      focusScore,
    };
    if (state.classroomCode) {
      io.to(`faculty:${state.classroomCode}`).emit('live:student-ended', payload);
    }
    io.to('faculty:all').emit('live:student-ended', payload);
  }

  // Clean up
  activeSessions.delete(userId.toString());
  pendingUpdates.delete(state.sessionId);

  return {
    sessionId: state.sessionId,
    totalDuration,
    activeDuration: finalActive,
    idleDuration: state.idleSecs,
    focusScore,
    status: 'completed',
  };
}

// =====================================================================
// FOCUS SCORE ALGORITHM
// =====================================================================
function computeFocusScore({ activeDuration, totalDuration, idleEvents = 0, tabSwitches = 0, targetMinutes = 30 }) {
  if (totalDuration < 10) return 0;

  // Active ratio (40% weight)
  const activeRatio = Math.min(activeDuration / totalDuration, 1) * 100;

  // Idle penalty (20% weight) — fewer idle events = better
  const idleBonus = idleEvents < 2 ? 100 : Math.max(0, 100 - idleEvents * 15);

  // Tab focus (20% weight) — fewer tab switches = better
  const expectedSwitches = Math.max(Math.floor(totalDuration / 300), 1); // 1 per 5 min is "normal"
  const tabFocus = Math.min(Math.max(100 - ((tabSwitches / expectedSwitches) * 50), 0), 100);

  // Session completeness (20% weight) — longer sessions toward target
  const totalMinutes = totalDuration / 60;
  const sessionScore = Math.min((totalMinutes / targetMinutes) * 100, 100);

  const score = Math.round(
    activeRatio * 0.4 +
    idleBonus * 0.2 +
    tabFocus * 0.2 +
    sessionScore * 0.2
  );

  return Math.min(Math.max(score, 0), 100);
}

// =====================================================================
// UPDATE DAILY ANALYTICS
// =====================================================================
async function updateDailyAnalytics(userId, state, totalDuration, activeDuration, idleDuration, focusScore) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const hour = new Date().getHours();

  try {
    await DailyAnalytics.findOneAndUpdate(
      { user: userId, date: today },
      {
        $setOnInsert: {
          classroomCode: state.classroomCode || '',
          department: state.department || '',
          college: state.college || '',
        },
        $inc: {
          totalTime: totalDuration,
          activeTime: activeDuration,
          idleTime: idleDuration,
          sessionCount: 1,
          tabSwitches: state.tabSwitches || 0,
        },
        $push: {
          categoryBreakdown: {
            category: state.category,
            duration: totalDuration,
            sessions: 1,
          },
        },
      },
      { upsert: true, new: true }
    );

    // Update focus score as running average
    const daily = await DailyAnalytics.findOne({ user: userId, date: today });
    if (daily && daily.sessionCount > 0) {
      const avgFocus = Math.round(
        ((daily.focusScore * (daily.sessionCount - 1)) + focusScore) / daily.sessionCount
      );
      daily.focusScore = avgFocus;

      // Update peak hours
      const existingHour = daily.peakHours.find(p => p.hour === hour);
      if (existingHour) {
        existingHour.minutes += Math.round(totalDuration / 60);
      } else {
        daily.peakHours.push({ hour, minutes: Math.round(totalDuration / 60) });
      }

      // Determine consistency
      if (daily.totalTime >= 10800) daily.consistency = 'high';        // 3h+
      else if (daily.totalTime >= 3600) daily.consistency = 'medium';  // 1h+
      else if (daily.totalTime > 0) daily.consistency = 'low';

      await daily.save();
    }
  } catch (err) {
    console.error('[SessionManager] DailyAnalytics update failed:', err.message);
  }
}

// =====================================================================
// GET ACTIVE SESSION for a user
// =====================================================================
export function getActiveSession(userId) {
  const state = activeSessions.get(userId.toString());
  if (!state) return null;

  const now = Date.now();
  return {
    sessionId: state.sessionId,
    category: state.category,
    label: state.label,
    duration: Math.floor((now - state.startTime) / 1000),
    activeDuration: state.activeSecs,
    idleDuration: state.idleSecs,
    status: state.isIdle ? 'idle' : 'active',
    startTime: new Date(state.startTime),
  };
}

// =====================================================================
// GET ALL ACTIVE SESSIONS for a classroom (faculty live view)
// =====================================================================
export function getActiveSessions(classroomCode) {
  const now = Date.now();
  const result = [];

  for (const [uid, state] of activeSessions) {
    if (!classroomCode || state.classroomCode === classroomCode) {
      result.push({
        userId: state.userId,
        name: state.userName,
        category: state.category,
        label: state.label,
        duration: Math.floor((now - state.startTime) / 1000),
        activeDuration: state.activeSecs,
        status: state.isIdle ? 'idle' : 'active',
        focusPercent: state.activeSecs > 0
          ? Math.round((state.activeSecs / (state.activeSecs + state.idleSecs)) * 100)
          : 100,
      });
    }
  }

  return result.sort((a, b) => b.duration - a.duration);
}

// =====================================================================
// BATCH FLUSH — Write accumulated updates to MongoDB
// =====================================================================
async function batchFlush() {
  if (pendingUpdates.size === 0) return;

  const ops = [];
  for (const [sessionId, data] of pendingUpdates) {
    if (data.heartbeats === 0) continue;

    ops.push({
      updateOne: {
        filter: { _id: sessionId },
        update: {
          $inc: {
            heartbeats: data.heartbeats,
            activeDuration: data.activeSecs,
            idleDuration: data.idleSecs,
            tabSwitches: data.tabSwitches,
          },
          $set: { lastHeartbeat: new Date() },
        },
      },
    });

    // Reset accumulators
    data.heartbeats = 0;
    data.activeSecs = 0;
    data.idleSecs = 0;
    data.tabSwitches = 0;
  }

  if (ops.length > 0) {
    try {
      await Session.bulkWrite(ops);
    } catch (err) {
      console.error('[SessionManager] Batch flush failed:', err.message);
    }
  }
}

// =====================================================================
// CLEANUP — Auto-end abandoned sessions (no heartbeat for 90s)
// =====================================================================
async function cleanupAbandonedSessions(io) {
  const now = Date.now();

  for (const [uid, state] of activeSessions) {
    if (now - state.lastHeartbeat > HEARTBEAT_TIMEOUT_MS) {
      console.log(`[SessionManager] Abandoning session for user ${uid} (no heartbeat)`);

      const totalDuration = Math.floor((now - state.startTime) / 1000);
      const finalActive = Math.max(totalDuration - state.idleSecs, 0);
      const focusScore = computeFocusScore({
        activeDuration: finalActive,
        totalDuration,
        tabSwitches: state.tabSwitches,
      });

      try {
        await Session.findByIdAndUpdate(state.mongoId, {
          $set: {
            endTime: new Date(),
            totalDuration,
            activeDuration: finalActive,
            idleDuration: state.idleSecs,
            status: 'abandoned',
            focusScore,
          },
        });

        // Still create Activity record if meaningful
        if (totalDuration >= 60) {
          await Activity.create({
            user: uid,
            classroomCode: state.classroomCode,
            category: state.category,
            label: state.label || state.category,
            duration: totalDuration,
            type: 'study',
            date: new Date(state.startTime),
          });
        }
      } catch (err) {
        console.error('[SessionManager] Cleanup DB error:', err.message);
      }

      // Broadcast to faculty
      if (io) {
        const payload = {
          userId: state.userId,
          name: state.userName,
          category: state.category,
          duration: totalDuration,
          status: 'abandoned',
        };
        if (state.classroomCode) {
          io.to(`faculty:${state.classroomCode}`).emit('live:student-ended', payload);
        }
        io.to('faculty:all').emit('live:student-ended', payload);
      }

      activeSessions.delete(uid);
      pendingUpdates.delete(state.sessionId);
    }
  }
}

// =====================================================================
// INITIALIZE — Start background intervals
// =====================================================================
let _flushInterval = null;
let _cleanupInterval = null;

export function initSessionManager(io) {
  console.log('[SessionManager] Initializing background tasks...');

  // Batch flush every 60s
  _flushInterval = setInterval(() => batchFlush(), BATCH_FLUSH_INTERVAL_MS);

  // Cleanup abandoned sessions every 30s
  _cleanupInterval = setInterval(() => cleanupAbandonedSessions(io), CLEANUP_INTERVAL_MS);

  console.log('[SessionManager] ✅ Background tasks started (flush: 60s, cleanup: 30s)');
}

export function shutdownSessionManager() {
  if (_flushInterval) clearInterval(_flushInterval);
  if (_cleanupInterval) clearInterval(_cleanupInterval);
  batchFlush(); // Final flush
  console.log('[SessionManager] Shutdown complete');
}

// =====================================================================
// STATS — For monitoring
// =====================================================================
export function getStats() {
  return {
    activeSessions: activeSessions.size,
    pendingFlushes: pendingUpdates.size,
  };
}

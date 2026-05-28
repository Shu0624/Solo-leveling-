import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';

const ActivityContext = createContext(null);

// Centralized category map to make it accessible everywhere
export const ACTIVITY_CATEGORIES = [
  // High-level App Features
  { value: 'dashboard', label: 'Dashboard', color: '#3b82f6' },
  { value: 'learn', label: 'Learn Hub', color: '#fbbf24' },
  { value: 'resume', label: 'Resume Work', color: '#f97316' },
  { value: 'interview', label: 'Interview Prep', color: '#06b6d4' },
  { value: 'assessment', label: 'Assessments', color: '#10b981' },
  { value: 'roadmap', label: 'Career Roadmaps', color: '#8b5cf6' },
  { value: 'programs', label: 'Language Hub', color: '#14b8a6' },
  { value: 'benefits', label: 'Benefits / Perks', color: '#ec4899' },
  { value: 'timepass', label: 'Timepass / Break', color: '#e91e63' },

  // Granular Study Topics
  { value: 'java', label: 'Java', color: '#f59e0b' },
  { value: 'c', label: 'C Programming', color: '#0ea5e9' },
  { value: 'python', label: 'Python', color: '#6366f1' },
  { value: 'dsa', label: 'DSA Solving', color: '#22c55e' },
  { value: 'ai', label: 'AI / GenAI', color: '#a855f7' },
  { value: 'aptitude', label: 'Aptitude', color: '#f43f5e' },
  { value: 'group-discussion', label: 'Group Discussion', color: '#115e59' },
  { value: 'other', label: 'Other / Misc', color: '#6b7280' },
];

// ---- Constants ----
const IDLE_THRESHOLD_MS = 120_000;      // 2 min no interaction → idle
const HEARTBEAT_INTERVAL_MS = 30_000;   // 30s heartbeat to server
const IDLE_CHECK_INTERVAL_MS = 5_000;   // 5s idle check frequency

export const ActivityProvider = ({ children }) => {
  const { api, user, socket } = useAuth();
  
  // Timer State
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerCategory, setTimerCategory] = useState('java');
  const [timerLabel, setTimerLabel] = useState('');
  
  // Advanced Timer State
  const [timerMode, setTimerMode] = useState('stopwatch'); // 'stopwatch' or 'countdown'
  const [countdownMinutes, setCountdownMinutes] = useState(25);
  
  // Session Intelligence State (NEW)
  const [sessionId, setSessionId] = useState(null);
  const [isIdle, setIsIdle] = useState(false);
  const [focusStatus, setFocusStatus] = useState('Ready');  // Ready | Deep Focus | Active | Idle | Background
  const [activeDuration, setActiveDuration] = useState(0);
  const [idleDuration, setIdleDuration] = useState(0);
  const [focusScore, setFocusScore] = useState(null);
  const [tabVisible, setTabVisible] = useState(true);
  const [todayStats, setTodayStats] = useState(null);

  // Refs
  const timerRef = useRef(null);
  const heartbeatRef = useRef(null);
  const idleCheckRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const isIdleRef = useRef(false);
  const sessionIdRef = useRef(null);

  // =====================================================================
  // IDLE DETECTION — Mouse, keyboard, scroll, touch listeners
  // =====================================================================
  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // If was idle, mark as resumed
    if (isIdleRef.current && timerRunning) {
      isIdleRef.current = false;
      setIsIdle(false);
      setFocusStatus('Active');
      
      // Notify server
      if (socket?.connected) {
        socket.emit('session:resume');
      }
    }
  }, [timerRunning, socket]);

  // Attach/detach user activity listeners
  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => window.addEventListener(event, resetIdleTimer, { passive: true }));
    
    return () => {
      events.forEach(event => window.removeEventListener(event, resetIdleTimer));
    };
  }, [resetIdleTimer]);

  // Idle check interval (every 5s when timer is running)
  useEffect(() => {
    if (!timerRunning) {
      if (idleCheckRef.current) clearInterval(idleCheckRef.current);
      return;
    }

    idleCheckRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      
      if (elapsed >= IDLE_THRESHOLD_MS && !isIdleRef.current) {
        isIdleRef.current = true;
        setIsIdle(true);
        setFocusStatus('Idle');
        
        // Notify server
        if (socket?.connected) {
          socket.emit('session:idle');
        }
      }
    }, IDLE_CHECK_INTERVAL_MS);

    return () => {
      if (idleCheckRef.current) clearInterval(idleCheckRef.current);
    };
  }, [timerRunning, socket]);

  // =====================================================================
  // TAB VISIBILITY — Track when user switches tabs
  // =====================================================================
  useEffect(() => {
    const handleVisibility = () => {
      const visible = document.visibilityState === 'visible';
      setTabVisible(visible);
      
      if (timerRunning && socket?.connected) {
        socket.emit('session:tab-switch', { visible });
      }
      
      if (visible) {
        setFocusStatus(prev => prev === 'Background' ? 'Active' : prev);
        resetIdleTimer();
      } else if (timerRunning) {
        setFocusStatus('Background');
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [timerRunning, socket, resetIdleTimer]);

  // =====================================================================
  // HEARTBEAT — Send to server every 30s while session is active
  // =====================================================================
  useEffect(() => {
    if (!timerRunning || !socket?.connected) {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      return;
    }

    heartbeatRef.current = setInterval(() => {
      socket.emit('session:heartbeat', {
        tabVisible: document.visibilityState === 'visible',
        isActive: !isIdleRef.current,
      });
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [timerRunning, socket]);

  // =====================================================================
  // SOCKET EVENT LISTENERS
  // =====================================================================
  useEffect(() => {
    if (!socket) return;

    const handleConfirmed = (data) => {
      setSessionId(data.sessionId);
      sessionIdRef.current = data.sessionId;
      console.log('[Activity] Session confirmed:', data.sessionId);
    };

    const handleHeartbeatAck = (data) => {
      if (data.activeDuration !== undefined) setActiveDuration(data.activeDuration);
      if (data.idleDuration !== undefined) setIdleDuration(data.idleDuration);
      
      // Update focus status based on server data
      if (data.status === 'idle') setFocusStatus('Idle');
      else if (!tabVisible) setFocusStatus('Background');
      else if (data.activeDuration > 1800) setFocusStatus('Deep Focus');
      else setFocusStatus('Active');
    };

    const handleEnded = (data) => {
      if (data.focusScore !== undefined) setFocusScore(data.focusScore);
      console.log('[Activity] Session ended, focus score:', data.focusScore);
    };

    const handleError = (data) => {
      console.error('[Activity] Session error:', data.message);
    };

    socket.on('session:confirmed', handleConfirmed);
    socket.on('session:heartbeat-ack', handleHeartbeatAck);
    socket.on('session:ended', handleEnded);
    socket.on('session:error', handleError);

    return () => {
      socket.off('session:confirmed', handleConfirmed);
      socket.off('session:heartbeat-ack', handleHeartbeatAck);
      socket.off('session:ended', handleEnded);
      socket.off('session:error', handleError);
    };
  }, [socket, tabVisible]);

  // =====================================================================
  // SESSION PERSISTENCE — Survive page reloads
  // =====================================================================
  useEffect(() => {
    const savedSession = sessionStorage.getItem('levelup_active_session');
    if (savedSession) {
      const parsed = JSON.parse(savedSession);
      if (parsed.timerRunning) {
        setTimerCategory(parsed.timerCategory);
        setTimerLabel(parsed.timerLabel);
        if (parsed.timerMode) setTimerMode(parsed.timerMode);
        if (parsed.countdownMinutes) setCountdownMinutes(parsed.countdownMinutes);
        
        // Calculate seconds elapsed while away
        const now = Date.now();
        const diffSecs = Math.floor((now - parsed.lastUpdated) / 1000);
        const restoredSecs = parsed.timerSeconds + diffSecs;
        setTimerSeconds(restoredSecs);
        
        // Re-start the local timer
        startInternalTimer(restoredSecs);
        
        // Re-establish server session via WebSocket (will happen on socket connect)
        if (parsed.sessionId) {
          setSessionId(parsed.sessionId);
          sessionIdRef.current = parsed.sessionId;
        }
      }
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Handle countdown hitting zero
  useEffect(() => {
    if (timerRunning && timerMode === 'countdown') {
      const remaining = (countdownMinutes * 60) - timerSeconds;
      if (remaining <= 0) {
        stopAndSaveTimer();
        import('canvas-confetti').then(confetti => confetti.default({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        }));
      }
    }
  }, [timerSeconds, timerRunning, timerMode, countdownMinutes]);

  // Save to session storage periodically
  useEffect(() => {
    if (timerRunning) {
      sessionStorage.setItem('levelup_active_session', JSON.stringify({
        timerRunning,
        timerSeconds,
        timerCategory,
        timerLabel,
        timerMode,
        countdownMinutes,
        sessionId: sessionIdRef.current,
        lastUpdated: Date.now()
      }));
    } else {
      sessionStorage.removeItem('levelup_active_session');
    }
  }, [timerRunning, timerSeconds, timerCategory, timerLabel]);

  // =====================================================================
  // TIMER CONTROLS
  // =====================================================================
  const startInternalTimer = (startSecs = 0) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(true);
    setTimerSeconds(startSecs);
    setFocusStatus('Active');
    setIsIdle(false);
    isIdleRef.current = false;
    lastActivityRef.current = Date.now();
    
    timerRef.current = setInterval(() => {
      setTimerSeconds(prev => prev + 1);
    }, 1000);
  };

  const startTimer = () => {
    if (timerRunning) return;
    
    // Start local timer
    startInternalTimer(timerSeconds);
    
    // Start server session via WebSocket
    if (socket?.connected) {
      socket.emit('session:start', {
        category: timerCategory,
        label: timerLabel || ACTIVITY_CATEGORIES.find(c => c.value === timerCategory)?.label || timerCategory,
        source: 'manual',
        deviceInfo: {
          browser: navigator.userAgent.split(' ').pop(),
          os: navigator.platform,
          screenRes: `${window.screen.width}x${window.screen.height}`,
        },
      });
    } else {
      // Fallback: start via REST if WebSocket not connected
      api.post('/sessions/start', {
        category: timerCategory,
        label: timerLabel || ACTIVITY_CATEGORIES.find(c => c.value === timerCategory)?.label,
        source: 'manual',
      }).then(res => {
        setSessionId(res.data.sessionId);
        sessionIdRef.current = res.data.sessionId;
      }).catch(err => console.error('[Activity] REST start failed:', err));
    }
  };

  const pauseTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(false);
    setFocusStatus('Paused');
  };

  const stopAndSaveTimer = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(false);
    setFocusStatus('Ready');
    
    // End server session via WebSocket
    if (socket?.connected && sessionIdRef.current) {
      socket.emit('session:end');
    } else if (timerSeconds >= 10 && user) {
      // Fallback: end via REST
      try {
        await api.post('/sessions/end');
      } catch (err) {
        // Double fallback: create activity directly (old method)
        try {
          await api.post('/activity', {
            category: timerCategory,
            label: timerLabel || ACTIVITY_CATEGORIES.find(c => c.value === timerCategory)?.label,
            duration: timerSeconds,
            type: 'study'
          });
        } catch (e) {
          console.error('[Activity] All save methods failed:', e);
        }
      }
    }
    
    // Dispatch event so dashboard can refresh
    window.dispatchEvent(new Event('activity-logged'));
    
    // Reset
    setTimerSeconds(0);
    setTimerLabel('');
    setSessionId(null);
    sessionIdRef.current = null;
    setActiveDuration(0);
    setIdleDuration(0);
    setFocusScore(null);
    setIsIdle(false);
    isIdleRef.current = false;
    sessionStorage.removeItem('levelup_active_session');
  };

  // =====================================================================
  // FETCH TODAY'S STATS
  // =====================================================================
  const fetchTodayStats = useCallback(async () => {
    try {
      const res = await api.get('/sessions/today');
      setTodayStats(res.data);
    } catch (err) {
      console.error('[Activity] Failed to fetch today stats:', err);
    }
  }, [api]);

  // Fetch on mount and when activity is logged
  useEffect(() => {
    if (user) fetchTodayStats();
    
    const handleLog = () => fetchTodayStats();
    window.addEventListener('activity-logged', handleLog);
    return () => window.removeEventListener('activity-logged', handleLog);
  }, [user, fetchTodayStats]);

  // =====================================================================
  // FORMAT HELPERS
  // =====================================================================
  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
      : `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <ActivityContext.Provider value={{
      // Timer (backward compatible)
      timerRunning,
      timerSeconds,
      timerCategory,
      timerLabel,
      timerMode,
      countdownMinutes,
      setTimerCategory,
      setTimerLabel,
      setTimerMode,
      setCountdownMinutes,
      startTimer,
      pauseTimer,
      stopAndSaveTimer,
      formatTime,
      
      // Session Intelligence (NEW)
      sessionId,
      isIdle,
      focusStatus,
      activeDuration,
      idleDuration,
      focusScore,
      tabVisible,
      todayStats,
      fetchTodayStats,
    }}>
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (!context) throw new Error("useActivity must be used within ActivityProvider");
  return context;
};

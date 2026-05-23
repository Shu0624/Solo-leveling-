import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { ACTIVITY_CATEGORIES } from '../../context/ActivityContext';
import { Radio, Users, Search, Target, Clock, Zap, Pause, Brain } from 'lucide-react';

const formatDuration = (s) => {
  if (!s || s <= 0) return '0m';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const LiveStudentGrid = ({ classroomCode = 'all' }) => {
  const { api, socket, user } = useAuth();
  const [activeStudents, setActiveStudents] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Fetch initial state via REST
  useEffect(() => {
    const fetchLiveSessions = async () => {
      try {
        const res = await api.get(`/sessions/live/${classroomCode}`);
        const sessionMap = new Map();
        res.data.activeSessions.forEach(session => {
          sessionMap.set(session.userId, session);
        });
        setActiveStudents(sessionMap);
      } catch (err) {
        console.error('[LiveGrid] Failed to fetch live sessions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLiveSessions();
  }, [api, classroomCode]);

  // 2. Subscribe to WebSocket events
  useEffect(() => {
    if (!socket) return;

    // Join faculty room
    socket.emit('faculty:join', classroomCode);

    const handleStarted = (data) => {
      setActiveStudents(prev => {
        const next = new Map(prev);
        next.set(data.userId, {
          ...data,
          duration: 0,
          activeDuration: 0,
          status: 'active',
          focusPercent: 100
        });
        return next;
      });
    };

    const handleUpdate = (data) => {
      setActiveStudents(prev => {
        const next = new Map(prev);
        const existing = next.get(data.userId);
        if (existing) {
          next.set(data.userId, { ...existing, ...data });
        } else {
          // If we missed the start event, we can just add it
          next.set(data.userId, data);
        }
        return next;
      });
    };

    const handleIdle = (data) => {
      setActiveStudents(prev => {
        const next = new Map(prev);
        const existing = next.get(data.userId);
        if (existing) {
          next.set(data.userId, { ...existing, status: 'idle' });
        }
        return next;
      });
    };

    const handleEnded = (data) => {
      setActiveStudents(prev => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
    };

    socket.on('live:student-started', handleStarted);
    socket.on('live:student-update', handleUpdate);
    socket.on('live:student-idle', handleIdle);
    socket.on('live:student-ended', handleEnded);

    return () => {
      socket.emit('faculty:leave', classroomCode);
      socket.off('live:student-started', handleStarted);
      socket.off('live:student-update', handleUpdate);
      socket.off('live:student-idle', handleIdle);
      socket.off('live:student-ended', handleEnded);
    };
  }, [socket, classroomCode]);

  // Filter and sort students
  const filteredStudents = Array.from(activeStudents.values())
    .filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                 s.category?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.duration - a.duration);

  // Status config
  const getStatusConfig = (status, focusPercent) => {
    if (status === 'idle') {
      return { label: 'Idle', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Pause };
    }
    if (focusPercent < 50) {
      return { label: 'Distracted', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: Target };
    }
    if (status === 'active') {
      return { label: 'Focused', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Brain };
    }
    return { label: 'Active', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Zap };
  };

  return (
    <div className="glass-morphism p-8 min-h-[400px] flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <Radio className="text-red-500 animate-pulse" /> 
            Live Monitoring Station
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time view of currently active student sessions
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search students..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 border border-border rounded-xl whitespace-nowrap">
            <Users size={16} className="text-primary" />
            <span className="font-bold">{activeStudents.size}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Active</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-12">
          <Radio className="animate-pulse mb-4 text-primary" size={32} />
          <p className="animate-pulse font-medium text-sm">Connecting to live feed...</p>
        </div>
      ) : filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredStudents.map(student => {
              const cat = ACTIVITY_CATEGORIES.find(c => c.value === student.category);
              const status = getStatusConfig(student.status, student.focusPercent);
              const StatusIcon = status.icon;

              return (
                <motion.div
                  key={student.userId}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`p-4 rounded-2xl border bg-secondary/20 relative overflow-hidden group hover:border-border/80 transition-colors ${status.bg} ${status.border}`}
                >
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-background border border-border/50 flex items-center justify-center font-bold text-foreground">
                        {student.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground truncate max-w-[120px]">{student.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{student.category}</p>
                      </div>
                    </div>
                    
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-background/50 backdrop-blur-sm ${status.border}`}>
                      <StatusIcon size={10} className={status.color} />
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 relative z-10">
                    <div className="bg-background/40 rounded-xl p-2 border border-border/30">
                      <div className="text-[10px] font-bold text-muted-foreground mb-0.5 flex items-center gap-1">
                        <Clock size={10} /> Duration
                      </div>
                      <div className="text-sm font-black text-foreground tabular-nums">
                        {formatDuration(student.duration)}
                      </div>
                    </div>
                    <div className="bg-background/40 rounded-xl p-2 border border-border/30">
                      <div className="text-[10px] font-bold text-muted-foreground mb-0.5 flex items-center gap-1">
                        <Target size={10} /> Focus
                      </div>
                      <div className={`text-sm font-black tabular-nums ${student.focusPercent >= 80 ? 'text-emerald-400' : student.focusPercent >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                        {student.focusPercent ?? 100}%
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-12 border-2 border-dashed border-border rounded-2xl">
          <Users size={32} className="mb-4 opacity-50" />
          <p className="font-medium">No active sessions</p>
          <p className="text-sm opacity-70 mt-1">Students will appear here when they start tracking.</p>
        </div>
      )}
    </div>
  );
};

export default LiveStudentGrid;

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { ACTIVITY_CATEGORIES } from '../../context/ActivityContext';
import {
  History, Clock, Target, Activity, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, Zap
} from 'lucide-react';

// =====================================================================
// Session History — Shows today's completed tracking sessions
// Displays: session list with category, duration, focus score, status
// =====================================================================

const formatDuration = (s) => {
  if (!s || s <= 0) return '0m';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const formatTimeOfDay = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const SessionHistory = () => {
  const { api } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/sessions/history?limit=10');
      setSessions(res.data || []);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();

    const handleRefresh = () => fetchSessions();
    window.addEventListener('activity-logged', handleRefresh);
    return () => window.removeEventListener('activity-logged', handleRefresh);
  }, []);

  if (loading) {
    return (
      <div className="border border-border bg-card rounded-md p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-secondary rounded-lg w-32" />
          <div className="h-12 bg-secondary rounded-md" />
          <div className="h-12 bg-secondary rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="border border-border bg-card rounded-md p-6"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-4 group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-indigo-500/10 border border-indigo-500/20">
            <History size={18} className="text-[hsl(var(--primary-accent))]" />
          </div>
          <div className="text-left">
            <h2 className="text-lg font-bold text-foreground">Recent Sessions</h2>
            <p className="text-[11px] text-muted-foreground font-medium">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''} tracked
            </p>
          </div>
        </div>
        <div className="text-muted-foreground group-hover:text-muted-foreground transition-colors">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {sessions.length > 0 ? (
              <div className="space-y-2">
                {sessions.map((session, i) => {
                  const cat = ACTIVITY_CATEGORIES.find(c => c.value === session.category);
                  const isAbandoned = session.status === 'abandoned';
                  
                  return (
                    <motion.div
                      key={session._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`flex items-center gap-3 p-3 rounded-md border transition-colors ${
                        isAbandoned
                          ? 'bg-amber-500/5 border-amber-500/10 hover:border-amber-500/20'
                          : 'bg-white/[0.02] border-border hover:border-border'
                      }`}
                    >
                      {/* Category dot */}
                      <div
                        className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 border border-border"
                        style={{ backgroundColor: `${cat?.color || '#6b7280'}15` }}
                      >
                        <Activity size={14} style={{ color: cat?.color || '#6b7280' }} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground truncate">
                            {session.label || cat?.label || session.category}
                          </span>
                          {isAbandoned && (
                            <AlertTriangle size={12} className="text-warning shrink-0" />
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-2">
                          <Clock size={10} />
                          {formatTimeOfDay(session.startTime)}
                          {session.endTime && ` — ${formatTimeOfDay(session.endTime)}`}
                        </div>
                      </div>

                      {/* Duration */}
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold text-muted-foreground">
                          {formatDuration(session.totalDuration)}
                        </div>
                        {session.focusScore !== null && session.focusScore !== undefined && (
                          <div className={`text-[10px] font-bold flex items-center gap-1 justify-end ${
                            session.focusScore >= 70 ? 'text-success' :
                            session.focusScore >= 40 ? 'text-warning' : 'text-destructive'
                          }`}>
                            <Target size={9} />
                            {session.focusScore}%
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Zap size={28} className="mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground font-medium">No sessions yet</p>
                <p className="text-xs text-muted-foreground mt-1">Start tracking to see your history</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SessionHistory;

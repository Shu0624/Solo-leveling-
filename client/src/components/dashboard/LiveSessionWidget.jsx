import { motion, AnimatePresence } from 'framer-motion';
import { useActivity, ACTIVITY_CATEGORIES } from '../../context/ActivityContext';
import { 
  Activity, Wifi, WifiOff, Eye, EyeOff, Zap, 
  Brain, Pause, AlertTriangle, Timer
} from 'lucide-react';

// =====================================================================
// Live Session Widget — Shows real-time tracking status when active
// Displays: current activity, duration, focus status, idle warning
// =====================================================================
const LiveSessionWidget = () => {
  const {
    timerRunning, timerSeconds, timerCategory, timerLabel,
    focusStatus, isIdle, activeDuration, idleDuration,
    tabVisible, sessionId, formatTime
  } = useActivity();

  if (!timerRunning) return null;

  const category = ACTIVITY_CATEGORIES.find(c => c.value === timerCategory);
  const focusPercent = (activeDuration + idleDuration) > 0
    ? Math.round((activeDuration / (activeDuration + idleDuration)) * 100)
    : 100;

  // Focus status styling
  const statusConfig = {
    'Active':     { color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', icon: Zap, pulse: false },
    'Deep Focus': { color: 'text-blue-400',    bg: 'bg-blue-500/20',    border: 'border-blue-500/30',    icon: Brain, pulse: true },
    'Idle':       { color: 'text-amber-400',   bg: 'bg-amber-500/20',   border: 'border-amber-500/30',   icon: Pause, pulse: true },
    'Background': { color: 'text-purple-400',  bg: 'bg-purple-500/20',  border: 'border-purple-500/30',  icon: EyeOff, pulse: false },
    'Paused':     { color: 'text-gray-400',    bg: 'bg-gray-500/20',    border: 'border-gray-500/30',    icon: Pause, pulse: false },
    'Ready':      { color: 'text-white/50',    bg: 'bg-white/5',        border: 'border-white/10',       icon: Timer, pulse: false },
  };

  const status = statusConfig[focusStatus] || statusConfig['Active'];
  const StatusIcon = status.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        className={`relative overflow-hidden border ${status.border} ${status.bg} backdrop-blur-2xl rounded-[2rem] p-5 shadow-2xl`}
      >
        {/* Animated background glow */}
        <div className={`absolute inset-0 ${status.bg} opacity-30 ${status.pulse ? 'animate-pulse' : ''}`} />
        
        <div className="relative z-10">
          {/* Top row: Status + Timer */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Pulsing dot */}
              <div className="relative">
                <div className={`w-3 h-3 rounded-full ${isIdle ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                {!isIdle && (
                  <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-50" />
                )}
              </div>
              
              {/* Status badge */}
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${status.bg} ${status.border} border backdrop-blur-md`}>
                <StatusIcon size={12} className={status.color} />
                <span className={`text-[11px] font-bold uppercase tracking-widest ${status.color}`}>
                  {focusStatus}
                </span>
              </div>

              {/* Connection indicator */}
              <div className="flex items-center gap-1">
                {sessionId ? (
                  <Wifi size={12} className="text-emerald-500/60" />
                ) : (
                  <WifiOff size={12} className="text-red-500/60" />
                )}
              </div>
            </div>

            {/* Live timer */}
            <div className="text-right">
              <div className="text-2xl font-black text-white tabular-nums tracking-tight">
                {formatTime(timerSeconds)}
              </div>
            </div>
          </div>

          {/* Middle: Activity info */}
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner border border-white/10"
              style={{ backgroundColor: `${category?.color || '#6b7280'}25` }}
            >
              <Activity size={18} style={{ color: category?.color || '#6b7280' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white truncate">
                {timerLabel || category?.label || timerCategory}
              </div>
              <div className="text-[11px] text-white/50 font-medium">
                Currently tracking • {category?.label}
              </div>
            </div>
          </div>

          {/* Bottom: Focus metrics bar */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-black/30 rounded-xl p-2.5 text-center border border-white/5">
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-0.5">Active</div>
              <div className="text-sm font-black text-emerald-400">{formatTime(activeDuration)}</div>
            </div>
            <div className="bg-black/30 rounded-xl p-2.5 text-center border border-white/5">
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-0.5">Idle</div>
              <div className="text-sm font-black text-amber-400">{formatTime(idleDuration)}</div>
            </div>
            <div className="bg-black/30 rounded-xl p-2.5 text-center border border-white/5">
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-0.5">Focus</div>
              <div className={`text-sm font-black ${focusPercent >= 80 ? 'text-emerald-400' : focusPercent >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                {focusPercent}%
              </div>
            </div>
          </div>

          {/* Idle warning */}
          {isIdle && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl"
            >
              <AlertTriangle size={14} className="text-amber-400 shrink-0" />
              <span className="text-[11px] text-amber-300 font-medium">
                You seem to be away — move your mouse or press a key to resume tracking
              </span>
            </motion.div>
          )}

          {/* Tab hidden warning */}
          {!tabVisible && !isIdle && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl"
            >
              <EyeOff size={14} className="text-purple-400 shrink-0" />
              <span className="text-[11px] text-purple-300 font-medium">
                Tab is in background — session is still being tracked
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LiveSessionWidget;

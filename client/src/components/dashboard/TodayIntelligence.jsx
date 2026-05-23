import { motion } from 'framer-motion';
import { useActivity, ACTIVITY_CATEGORIES } from '../../context/ActivityContext';
import {
  Clock, Flame, Target, TrendingUp, Zap, 
  BarChart3, Brain, Award, Sparkles
} from 'lucide-react';

// =====================================================================
// Today's Intelligence Panel — Real-time daily analytics overview
// Shows: productive time, sessions, focus score, consistency,
//        category breakdown, and peak productive hours
// =====================================================================

const formatDuration = (s) => {
  if (!s || s <= 0) return '0m';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const TodayIntelligence = () => {
  const { todayStats, timerRunning, timerSeconds } = useActivity();

  const daily = todayStats?.daily || {};
  const activeSession = todayStats?.activeSession;
  const sessions = todayStats?.sessions || [];

  // Compute real-time totals (include running timer)
  const liveTotal = (daily.totalTime || 0) + (timerRunning ? timerSeconds : 0);
  const sessionCount = (daily.sessionCount || 0) + (timerRunning ? 1 : 0);
  const focusScore = daily.focusScore || 0;
  const consistency = daily.consistency || 'none';

  // Category breakdown from today's sessions
  const categoryMap = {};
  (daily.categoryBreakdown || []).forEach(cb => {
    if (categoryMap[cb.category]) {
      categoryMap[cb.category].duration += cb.duration;
      categoryMap[cb.category].sessions += cb.sessions;
    } else {
      categoryMap[cb.category] = { ...cb };
    }
  });
  const categoryData = Object.values(categoryMap)
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 6);

  // Find most focused subject
  const topCategory = categoryData.length > 0
    ? ACTIVITY_CATEGORIES.find(c => c.value === categoryData[0].category)
    : null;

  // Consistency styling
  const consistencyConfig = {
    high:   { label: 'High',   color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    medium: { label: 'Medium', color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
    low:    { label: 'Low',    color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20' },
    none:   { label: '—',      color: 'text-white/30',    bg: 'bg-white/5',        border: 'border-white/10' },
  };
  const consConfig = consistencyConfig[consistency] || consistencyConfig.none;

  // KPI Cards
  const kpis = [
    {
      label: 'Productive Time',
      value: formatDuration(liveTotal),
      icon: Clock,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      live: timerRunning,
    },
    {
      label: 'Sessions',
      value: sessionCount,
      icon: Zap,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    },
    {
      label: 'Focus Score',
      value: focusScore > 0 ? `${focusScore}%` : '—',
      icon: Target,
      color: focusScore >= 70 ? 'text-emerald-400' : focusScore >= 40 ? 'text-amber-400' : 'text-red-400',
      bg: focusScore >= 70 ? 'bg-emerald-500/10' : focusScore >= 40 ? 'bg-amber-500/10' : 'bg-red-500/10',
      border: focusScore >= 70 ? 'border-emerald-500/20' : focusScore >= 40 ? 'border-amber-500/20' : 'border-red-500/20',
    },
    {
      label: 'Consistency',
      value: consConfig.label,
      icon: TrendingUp,
      color: consConfig.color,
      bg: consConfig.bg,
      border: consConfig.border,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="border border-white/10 bg-[#121217]/60 backdrop-blur-3xl rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20">
            <Brain size={20} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Today's Intelligence</h2>
            <p className="text-[11px] text-white/40 font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        {timerRunning && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Live</span>
          </div>
        )}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 relative z-10">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className={`${kpi.bg} ${kpi.border} border rounded-2xl p-4 relative overflow-hidden group hover:scale-[1.02] transition-transform`}
            >
              {kpi.live && (
                <div className="absolute top-2 right-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              )}
              <Icon size={16} className={`${kpi.color} mb-2 opacity-70`} />
              <div className="text-xl font-black text-white mb-0.5">{kpi.value}</div>
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{kpi.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Activity Breakdown */}
      {categoryData.length > 0 && (
        <div className="relative z-10">
          <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3 flex items-center gap-2">
            <BarChart3 size={14} /> Activity Breakdown
          </h3>
          <div className="space-y-2">
            {categoryData.map((cat, i) => {
              const catMeta = ACTIVITY_CATEGORIES.find(c => c.value === cat.category);
              const maxDuration = categoryData[0]?.duration || 1;
              const barWidth = Math.max((cat.duration / maxDuration) * 100, 8);

              return (
                <motion.div
                  key={cat.category}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-24 flex items-center gap-2 shrink-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: catMeta?.color || '#6b7280' }}
                    />
                    <span className="text-xs font-semibold text-white/70 truncate">
                      {catMeta?.label || cat.category}
                    </span>
                  </div>
                  <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden relative border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.6, ease: 'easeOut' }}
                      className="h-full rounded-full relative"
                      style={{ backgroundColor: `${catMeta?.color || '#6b7280'}40` }}
                    >
                      <div
                        className="absolute inset-0 rounded-full opacity-60"
                        style={{ backgroundColor: `${catMeta?.color || '#6b7280'}30` }}
                      />
                    </motion.div>
                  </div>
                  <div className="w-16 text-right shrink-0">
                    <span className="text-xs font-bold text-white/60">{formatDuration(cat.duration)}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Most Focused Subject callout */}
      {topCategory && (
        <div className="mt-5 flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/15 rounded-2xl relative z-10">
          <Award size={18} className="text-blue-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-[11px] text-white/50 font-medium">Most focused on</span>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: topCategory.color }} />
              {topCategory.label}
              <span className="text-white/40 font-medium">— {formatDuration(categoryData[0].duration)}</span>
            </div>
          </div>
          <Sparkles size={14} className="text-blue-400/50" />
        </div>
      )}

      {/* Empty state */}
      {categoryData.length === 0 && !timerRunning && (
        <div className="text-center py-8 relative z-10">
          <Brain size={32} className="mx-auto mb-3 text-white/10" />
          <p className="text-sm text-white/30 font-medium">No activity yet today</p>
          <p className="text-xs text-white/20 mt-1">Start a focus session to see your intelligence data</p>
        </div>
      )}

      {/* Peak Hours (if available) */}
      {(daily.peakHours || []).length > 0 && (
        <div className="mt-5 relative z-10">
          <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Zap size={14} /> Peak Hours
          </h3>
          <div className="flex gap-2 flex-wrap">
            {daily.peakHours
              .sort((a, b) => b.minutes - a.minutes)
              .slice(0, 4)
              .map((ph, i) => (
                <div
                  key={i}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-white/60"
                >
                  <span className="text-white/80">{ph.hour.toString().padStart(2, '0')}:00</span>
                  <span className="text-white/30 ml-1.5">({ph.minutes}m)</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default TodayIntelligence;

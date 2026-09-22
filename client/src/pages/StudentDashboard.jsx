import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, Square, CalendarClock, Trophy, StickyNote, 
  Plus, Trash2, Rocket, PieChart as PieChartIcon, Clock, 
  Flame, History, X, Target, BrainCircuit, FileSearch, Users, Activity, FileDown, Globe, ExternalLink, Calendar
} from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, BarChart, Bar, Legend } from 'recharts';
import ProgressRing from '../components/dashboard/ProgressRing';
import { useActivity, ACTIVITY_CATEGORIES } from '../context/ActivityContext';
import confetti from 'canvas-confetti';
import BinauralBeatsPlayer from '../components/dashboard/BinauralBeatsPlayer';
import TaskChecklist from '../components/dashboard/TaskChecklist';
import LiveSessionWidget from '../components/dashboard/LiveSessionWidget';
import TodayIntelligence from '../components/dashboard/TodayIntelligence';
import FocusScoreRing from '../components/dashboard/FocusScoreRing';
import SessionHistory from '../components/dashboard/SessionHistory';
import { Skeleton, SkeletonCard, PageHeader, StatTile, Button, tooltipStyle, axisProps, CHART_COLORS } from '../components/ui';

const StudentDashboard = () => {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [reportLoading, setReportLoading] = useState(false);
  const [progress, setProgress] = useState({ programming: 0, ai: 0, aptitude: 0 });
  const [events, setEvents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [resumeScore, setResumeScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streakData, setStreakData] = useState(null);
  const [lastActiveModule, setLastActiveModule] = useState(null);
  const [moduleProgress, setModuleProgress] = useState(0);
  const [programs, setPrograms] = useState([]);

  // Global Timer state + Session Intelligence
  const {
    timerRunning, timerSeconds, timerCategory, timerLabel,
    timerMode, countdownMinutes,
    setTimerCategory, setTimerLabel, setTimerMode, setCountdownMinutes,
    startTimer, pauseTimer, stopAndSaveTimer,
    formatTime,
    // Session Intelligence (new)
    focusStatus, isIdle, focusScore: lastFocusScore, todayStats,
  } = useActivity();

  // History & Analytics
  const [activityHistory, setActivityHistory] = useState([]);
  const [selectedStreakDate, setSelectedStreakDate] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeRange, setActiveRange] = useState('7days');

  useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  // Notes form
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTopic, setNoteTopic] = useState('');

  useEffect(() => {
    fetchDashboard();
    fetchNotes();
    fetchHistory();
    loadAnalyticsData(activeRange);
    fetchPrograms();
    
    // Listen for global timer saves to refresh history
    const handleActivityLog = () => {
      fetchHistory();
      loadAnalyticsData(activeRange);
    };
    window.addEventListener('activity-logged', handleActivityLog);
    return () => window.removeEventListener('activity-logged', handleActivityLog);
  }, [activeRange]);

  const fetchDashboard = async () => {
    try {
      const [res, modRes, progRes] = await Promise.all([
        api.get('/dashboard/student'),
        api.get('/modules').catch(() => ({ data: [] })),
        api.get('/modules/progress').catch(() => ({ data: { modules: [] } }))
      ]);
      setProgress(res.data.progress || { programming: 0, ai: 0, aptitude: 0 });
      setEvents(res.data.events || []);
      setResumeScore(res.data.resumeScore);

      const prog = progRes.data.modules || [];
      const mods = modRes.data || [];
      // Find the first module that has progress but is not fully complete, or the last one played
      const activeProg = prog.find(p => p.completedLessons && p.completedLessons.length > 0);
      if (activeProg) {
         const matchingMod = mods.find(m => m._id === activeProg.moduleId);
         if (matchingMod) {
           const percent = Math.round((activeProg.completedLessons.length / matchingMod.lessons.length) * 100);
           if (percent < 100) {
             setLastActiveModule(matchingMod);
             setModuleProgress(percent);
           }
         }
      }
      
      const streak = res.data.streak;
      setStreakData(streak);
      if (streak && streak.current >= 7) {
        // Trigger celebration
        setTimeout(() => {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
          });
        }, 500);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchNotes = async () => {
    try { const res = await api.get('/dashboard/notes'); setNotes(res.data || []); }
    catch (err) { console.error(err); }
  };

  const fetchPrograms = async () => {
    try {
      const res = await api.get('/discover/programs');
      setPrograms(res.data.active || []);
    } catch (e) { console.error('Failed to fetch programs:', e); }
  };

  const fetchHistory = async () => {
    try { const res = await api.get('/activity/history'); setActivityHistory(res.data || []); }
    catch (err) { console.error(err); }
  };

  const loadAnalyticsData = async (range = '7days') => {
    try {
      const res = await api.get(`/activity/analytics?range=${range}`);
      setAnalytics(res.data);
    } catch (err) { console.error(err); }
  };

  const openAnalyticsModal = () => {
    setShowAnalytics(true);
  };

  const formatDuration = (s) => {
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  };

  // Notes CRUD
  const createNote = async (e) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;
    try { 
      await api.post('/dashboard/notes', { title: noteTitle, content: noteContent, topic: noteTopic }); 
      setNoteTitle(''); setNoteContent(''); setNoteTopic(''); setShowNoteForm(false); 
      fetchNotes(); 
    }
    catch (err) { alert('Failed to save note'); }
  };
  
  const deleteNote = async (id) => { 
    try { await api.delete(`/dashboard/notes/${id}`); fetchNotes(); } 
    catch (err) { alert('Failed'); } 
  };

  const formatDate = (dateStr) => { 
    const d = new Date(dateStr); 
    return { month: d.toLocaleString('default', { month: 'short' }), day: d.getDate() }; 
  };

  // ---- CHART DATA PREP ----
  const categoryChartData = analytics?.byCategory.map(c => ({
    name: ACTIVITY_CATEGORIES.find(cat => cat.value === c._id)?.label || c._id,
    value: Math.round(c.totalSeconds / 60),
    color: ACTIVITY_CATEGORIES.find(cat => cat.value === c._id)?.color || '#6b7280'
  })) || [];

  const dailyChartData = analytics ? (() => {
    if (!analytics.daily || analytics.daily.length === 0) return [];
    
    return analytics.daily.map(d => {
      let formattedName = d._id;
      
      try {
        if (d._id.length === 7) { // %Y-%m format
          const [year, month] = d._id.split('-');
          const dateObj = new Date(year, parseInt(month) - 1, 1);
          formattedName = dateObj.toLocaleString('en', { month: 'short' });
        } else { // %Y-%m-%d format
          const [year, month, day] = d._id.split('-');
          const dateObj = new Date(year, parseInt(month) - 1, parseInt(day));
          formattedName = dateObj.toLocaleDateString('en', { month: 'short', day: 'numeric' });
        }
      } catch (err) {
        console.error(err);
      }
      
      return {
        dateStr: d._id,
        name: formattedName,
        minutes: Math.round(d.totalSeconds / 60)
      };
    });
  })() : [];

  if (loading) {
    return (
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
        {/* Header skeleton */}
        <div className="flex justify-between items-center mb-10">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32 rounded-md" rounded="rounded-md" />
        </div>
        {/* Stat row skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
        {/* Body skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-md" rounded="rounded-md" />
          <Skeleton className="h-80 rounded-md" rounded="rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in min-h-screen font-sans">
      {/* Dynamic Background Blurs for Dark Neon Vibe */}
      <div className="fixed inset-0 z-[-1] bg-card"></div>
      <div className="fixed top-[-15%] left-[-5%] w-[45vh] h-[45vh] bg-primary/[0.06] rounded-full hidden -z-10 pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[45vh] h-[45vh] bg-accent/[0.05] rounded-full hidden -z-10 pointer-events-none" />

      {/* Header */}
      <PageHeader
        eyebrow={currentTime.toLocaleTimeString()}
        title={`Welcome back, ${user?.name?.split(' ')[0] || ''}`}
        subtitle="Let's make today productive and meaningful."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => navigate('/my-analytics')}>
              <PieChartIcon size={16} /> Analytics
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={reportLoading}
              onClick={async () => {
                try {
                  setReportLoading(true);
                  const res = await api.get('/dashboard/report-data');
                  // Load the heavy PDF generator (jsPDF) only when actually needed
                  const { generateReadinessReport } = await import('../utils/generateReport');
                  generateReadinessReport(res.data);
                } catch (err) {
                  alert('Failed to generate report. Try again.');
                } finally {
                  setReportLoading(false);
                }
              }}
            >
              <FileDown size={16} /> Report
            </Button>
          </>
        }
      />

      {/* Fintech-style stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatTile
          label="Day Streak"
          value={streakData?.current || 0}
          suffix="d"
          icon={<Flame size={16} />}
          tone="warning"
          hero
        />
        <StatTile
          label="Focus Today"
          value={(analytics?.today?.totalSeconds || 0) / 3600}
          decimals={1}
          suffix="h"
          icon={<Clock size={16} />}
          tone="primary"
        />
        <StatTile
          label="This Week"
          value={(analytics?.weekly?.totalSeconds || 0) / 3600}
          decimals={1}
          suffix="h"
          icon={<Activity size={16} />}
          tone="accent"
        />
        <StatTile
          label="Resume Score"
          value={resumeScore || 0}
          suffix={resumeScore ? '/100' : ''}
          icon={<FileSearch size={16} />}
          tone="success"
        />
      </div>

      {/* 1. TOP SECTION (ACTION ROW) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left: Today's Tasks */}
        <div className="border border-border bg-secondary rounded-md p-6 flex flex-col min-h-[350px] overflow-hidden">
             <div className="mb-4 shrink-0 flex justify-between items-center">
               <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><Target size={18} className="text-[hsl(var(--primary-accent))]" /> Your Tasks</h2>
             </div>
             <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <TaskChecklist />
             </div>
        </div>

        {/* Right: Binaural Beats */}
        <div className="border border-border bg-secondary rounded-md p-6 flex flex-col min-h-[350px] relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 text-muted-foreground group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <BrainCircuit size={100} />
           </div>
           <div className="relative z-10 w-full h-full">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4"><Play size={18} className="text-[hsl(var(--primary-accent))]" /> Binaural Beats</h2>
              <BinauralBeatsPlayer />
           </div>
        </div>
      </div>

      {/* 1.5 LIVE SESSION WIDGET — Shows when timer is running */}
      <div className="mb-6">
        <LiveSessionWidget />
      </div>

      {/* 2. FOCUS & INTELLIGENCE SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
         
         {/* LEFT: FOCUS ZONE */}
         <div className="lg:col-span-5 xl:col-span-5 border border-border bg-card rounded-md p-6 md:p-8 relative overflow-hidden flex flex-col justify-between min-h-[440px]">
             {/* Glowing Orbs for the Hero */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full hidden pointer-events-none"></div>
             <div className="absolute top-0 inset-x-0 h-px bg-border"></div>

             <div className="relative z-10 flex justify-between items-center w-full mb-4">
               <h2 className="text-xl font-bold flex items-center gap-3 text-foreground">
                 <div className="p-2 rounded-md bg-primary/20 border border-primary/30"><Target className="text-[hsl(var(--primary-accent))]" size={20}/></div>
                 Focus Zone
               </h2>
               
               <div className="flex bg-secondary p-1 rounded-md border border-border">
                {['stopwatch', 'countdown'].map(mode => (
                  <button 
                    key={mode} 
                    onClick={() => { if (!timerRunning) setTimerMode(mode); }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all duration-300 ${
                      timerMode === mode ? 'bg-primary/90 text-foreground ' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {mode}
                  </button>
                 ))}
               </div>
             </div>

             {/* The Big Timer */}
             <div className="flex flex-col items-center justify-center flex-1 relative w-full">
                {/* Neon Ring Background */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] rounded-full border border-border pointer-events-none ${timerRunning ? 'animate-[spin_10s_linear_infinite]' : ''}`}>
                    <div className="absolute top-0 left-1/2 w-2 h-2 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                </div>

                <div className={`text-[4.5rem] sm:text-[5rem] md:text-[5.5rem] md:tracking-tighter tabular-nums transition-colors duration-700 drop- relative z-10 font-[600] font-sans ${
                  timerRunning ? 'text-[hsl(var(--primary-accent))]' : 'text-foreground'
                }`}>
                  {timerMode === 'countdown' ? formatTime(Math.max((countdownMinutes * 60) - timerSeconds, 0)) : formatTime(timerSeconds)}
                </div>

                <div className="mt-4 mb-2 relative z-20 text-muted-foreground text-sm font-semibold tracking-widest uppercase">
                  {timerRunning ? 'Session Active' : 'Ready'}
                </div>
             </div>

             {/* Sub Controls & Start Button */}
             <div className="relative z-20 flex flex-col items-center gap-4 mt-auto w-full">
                <div className="flex w-full gap-2">
                   <select 
                    value={timerCategory} 
                    onChange={e => setTimerCategory(e.target.value)} 
                    disabled={timerRunning}
                    className="flex-1 bg-card border border-border text-foreground rounded-md px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary/50 outline-none transition-all disabled:opacity-50 appearance-none text-center hover:bg-secondary truncate"
                   >
                    {ACTIVITY_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                   </select>

                   {timerMode === 'countdown' && (
                    <div className="flex items-center justify-center bg-card border border-border rounded-md px-4 py-3 text-sm focus-within:ring-2 focus-within:ring-primary/50 transition-all w-24">
                       <input 
                        type="number" min="1" max="480" 
                        value={countdownMinutes} 
                        onChange={e => setCountdownMinutes(parseInt(e.target.value) || 1)} 
                        disabled={timerRunning}
                        className="w-full bg-transparent text-foreground text-center outline-none disabled:opacity-50 font-bold" 
                      />
                      <span className="text-muted-foreground font-medium text-xs">m</span>
                    </div>
                   )}
                 </div>

                 <div className="w-full">
                  {!timerRunning ? (
                    <button 
                      onClick={startTimer} 
                      className="w-full py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm transition-colors border border-primary flex items-center justify-center gap-2"
                    >
                      <div className="absolute inset-0 bg-secondary opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                      <Play fill="currentColor" size={18} /> START FOCUS
                    </button>
                  ) : (
                    <div className="flex w-full gap-2">
                      <button 
                        onClick={pauseTimer} 
                        className="flex-1 py-4 rounded-md bg-warning/20 border border-warning/50 text-warning flex items-center justify-center transition-all hover:bg-warning/30"
                      >
                        <Pause fill="currentColor" size={20} />
                      </button>
                      <button 
                        onClick={stopAndSaveTimer} 
                        className="flex-[2] py-4 rounded-md bg-destructive/10 border border-destructive/50 text-destructive-foreground font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:bg-destructive/20"
                      >
                        <Square fill="currentColor" size={16} /> END SESSION
                      </button>
                    </div>
                  )}
                </div>
             </div>
         </div>

         {/* RIGHT: PROGRESS */}
         <div className="lg:col-span-7 xl:col-span-7 border border-border bg-secondary rounded-md p-6 md:p-8 relative overflow-hidden flex flex-col justify-center min-h-[440px]">
             
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <PieChartIcon size={20} className="text-[hsl(var(--primary-accent))]" /> Progress
                </h2>
                <div className="px-3 py-1 bg-secondary border border-border rounded-lg text-muted-foreground text-xs font-bold uppercase cursor-pointer hover:bg-secondary transition">Today v</div>
             </div>

             {/* FOCUS STREAK & STATS (Replaces 3 min-cards) */}
             <div className="bg-card rounded-md p-6 border border-border relative overflow-hidden mb-6 group shrink-0">
                <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 opacity-10 group-hover:scale-110 transition-transform"><Flame size={120} className="text-orange-500" /></div>
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                   <div>
                     <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-2">
                       <div className="w-6 h-6 rounded bg-orange-500/20 text-warning flex items-center justify-center"><Flame size={14}/></div>
                       Focus Streak
                     </h3>
                     <div className="text-3xl font-semibold text-foreground">{streakData?.current || 0} <span className="text-lg text-muted-foreground font-semibold tracking-normal">Days</span></div>
                     <p className="text-xs font-semibold text-warning mt-1">Keep it up! 🔥</p>
                   </div>
                   
                   <div className="flex gap-2 sm:gap-3">
                      <div className="bg-secondary border border-border p-2 sm:p-3 rounded-md min-w-[70px] sm:min-w-[80px]">
                         <div className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Today</div>
                         <div className="font-bold text-foreground shadow-sm text-sm sm:text-base">{formatDuration(analytics?.today?.totalSeconds || 0)}</div>
                      </div>
                       <div className="bg-secondary border border-border p-2 sm:p-3 rounded-md min-w-[70px] sm:min-w-[80px]">
                          <div className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Week</div>
                          <div className="font-bold text-foreground shadow-sm text-sm sm:text-base">{formatDuration(analytics?.weekly?.totalSeconds || 0)}</div>
                       </div>
                   </div>
                </div>

                {/* 7 Days Circles */}
                <div className="flex items-center justify-between gap-1 sm:gap-2 relative z-10 pt-4 border-t border-border">
                   {dailyChartData.map((day, idx) => {
                      const isToday = idx === 6;
                      const hasStudied = day.minutes > 0;
                      return (
                        <button 
                          key={day.dateStr} 
                          onClick={() => setSelectedStreakDate(selectedStreakDate === day.dateStr ? null : day.dateStr)}
                          className="flex flex-col items-center gap-2 hover:scale-110 transition-transform group/btn"
                        >
                           <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center  transition-colors ${selectedStreakDate === day.dateStr ? 'ring-2 ring-primary ring-offset-2 ring-offset-[#121215]' : ''} ${hasStudied ? 'bg-primary/20 text-primary-400' : (isToday ? 'bg-orange-500/20 text-warning' : 'bg-secondary text-muted-foreground')} `}>
                              {hasStudied ? <Target size={14} className="opacity-80"/> : <Flame size={14} className={isToday ? 'opacity-80' : 'opacity-40'}/>}
                           </div>
                           <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-foreground' : 'text-muted-foreground'} group-hover/btn:text-foreground transition-colors`}>
                             {day.name}
                           </span>
                        </button>
                      );
                   })}
                </div>

                {/* Active Day Info */}
                <AnimatePresence>
                {selectedStreakDate && (
                   <motion.div 
                     initial={{ height: 0, opacity: 0 }} 
                     animate={{ height: 'auto', opacity: 1 }} 
                     exit={{ height: 0, opacity: 0 }}
                     className="overflow-hidden mt-4 bg-secondary rounded-md"
                   >
                      <div className="p-4 border border-border rounded-md text-left">
                         <div className="text-xs font-bold text-muted-foreground mb-2">Study Sessions for {new Date(selectedStreakDate).toLocaleDateString()}</div>
                         <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                           {activityHistory.filter(h => h.date.split('T')[0] === selectedStreakDate).length === 0 ? (
                              <div className="text-[11px] text-muted-foreground italic">No activity logged on this day.</div>
                           ) : activityHistory.filter(h => h.date.split('T')[0] === selectedStreakDate).map(hist => (
                              <div key={hist._id} className="flex justify-between items-center text-xs bg-secondary px-3 py-2 rounded-lg border border-border">
                                 <span className="text-muted-foreground font-medium">{hist.label || ACTIVITY_CATEGORIES.find(c => c.value === hist.category)?.label || hist.category}</span>
                                 <span className="text-muted-foreground">{formatDuration(hist.duration)}</span>
                              </div>
                           ))}
                         </div>
                      </div>
                   </motion.div>
                )}
                </AnimatePresence>
             </div>

         </div>
      </div>

      {/* 2.5 TODAY'S INTELLIGENCE + SESSION HISTORY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
        {/* Left: Today's Intelligence Panel */}
        <div className="lg:col-span-7">
          <TodayIntelligence />
        </div>

        {/* Right: Session History + Focus Score */}
        <div className="lg:col-span-5 space-y-6">
          {/* Last Session Focus Score */}
          {lastFocusScore !== null && lastFocusScore > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-border bg-card rounded-md p-6 flex items-center justify-between"
            >
              <div>
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Last Session</h3>
                <p className="text-xs text-muted-foreground">
                  {lastFocusScore >= 80 ? 'Excellent focus! Keep it up 🔥' :
                   lastFocusScore >= 60 ? 'Good focus session ✨' :
                   lastFocusScore >= 40 ? 'Room for improvement 💪' :
                   'Try minimizing distractions 🎯'}
                </p>
              </div>
              <FocusScoreRing score={lastFocusScore} size="sm" showLabel={false} />
            </motion.div>
          )}

          {/* Session History */}
          <SessionHistory />
        </div>
      </div>

      {/* 3. EXTENDED INSIGHTS SECTION */}
      <div className="mb-10 border border-border bg-card rounded-md p-6 md:p-8 relative overflow-hidden">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Activity size={20} className="text-[hsl(var(--primary-accent))]" /> Focus Time History
            </h2>
            <div className="flex flex-wrap items-center gap-1.5 bg-secondary p-1 rounded-md border border-border">
              {[
                { value: '7days', label: '7 Days' },
                { value: 'thisMonth', label: 'This Month' },
                { value: 'lastMonth', label: 'Last Month' },
                { value: 'everyMonth', label: 'Monthly' },
                { value: 'lastYear', label: 'Last Year' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setActiveRange(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                    activeRange === opt.value
                      ? 'bg-primary text-foreground '
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
         </div>
         <div className="h-[250px] sm:h-[320px] w-full relative z-10">
            {dailyChartData.some(d => d.minutes > 0) ? (
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorBlueDark" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.5}/>
                       <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <XAxis dataKey="name" {...axisProps()} dy={10} />
                   <YAxis {...axisProps()} />
                   <Tooltip contentStyle={tooltipStyle()} itemStyle={{ color: 'inherit' }} cursor={{ stroke: CHART_COLORS[0], strokeOpacity: 0.3 }} />
                   <Area type="monotone" dataKey="minutes" stroke={CHART_COLORS[0]} strokeWidth={2.5} fillOpacity={1} fill="url(#colorBlueDark)" />
                 </AreaChart>
               </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-muted-foreground text-sm border-dashed border-border border rounded-md bg-secondary">No study history for the last 7 days.</div>
             )}
         </div>
      </div>

      {/* 4. SMART ACTIONS */}
      <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2"><Rocket size={24} className="text-success" /> Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { to: '/interview', title: 'Mock Interview', desc: 'Practice technical and behavioral questions', icon: <Users size={24} />, bg: 'bg-indigo-500/10', color: 'text-[hsl(var(--primary-accent))]', border: 'border-indigo-500/20' },
            { to: '/resume', title: 'Resume Analyzer', desc: resumeScore ? `Current Score: ${resumeScore}/100` : 'Get instant ATS feedback', icon: <FileSearch size={24} />, bg: 'bg-blue-500/10', color: 'text-[hsl(var(--primary-accent))]', border: 'border-blue-500/20' },
            { to: '/modules', title: 'Learning Hub', desc: lastActiveModule ? `Continue: ${lastActiveModule.title}` : 'Start your technical modules', icon: <Rocket size={24} />, bg: 'bg-emerald-500/10', color: 'text-success', border: 'border-emerald-500/20' },
          ].map((action, i) => (
            <Link 
              key={i} 
              to={action.to} 
              className={`group flex items-start gap-4 ${action.bg} ${action.border} border  p-6 rounded-md hover:bg-secondary transition-all duration-300 relative overflow-hidden `}
            >
              <div className={`p-4 rounded-md bg-secondary ${action.color} border border-border  group-hover:scale-110 transition-transform duration-300`}>
                {action.icon}
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-foreground group-hover:text-muted-foreground transition-colors">{action.title}</h4>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{action.desc}</p>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-muted-foreground group-hover:text-muted-foreground transition-colors uppercase tracking-widest">
                  Get Started <Target size={12} />
                </div>
              </div>
            </Link>
          ))}
      </div>

      {/* 4.5 PROGRAMS & OPPORTUNITIES (HORIZONTAL SCROLL) */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Globe size={24} className="text-[hsl(var(--primary-accent))]" /> Programs & Opportunities
          </h2>
          <Link to="/activities" className="text-xs font-bold px-3 py-1 bg-secondary border border-border rounded-full text-muted-foreground hover:bg-secondary transition-colors">
            View All
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x w-full">
          {programs.slice(0, 5).map((program, i) => (
            <div key={program._id || i} className="min-w-[300px] md:min-w-[350px] shrink-0 border border-border bg-secondary rounded-md p-6 snap-start hover:bg-secondary transition-colors flex flex-col justify-between relative group">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-md flex items-center justify-center text-2xl shadow-sm bg-secondary">
                      {program.logo || '🏢'}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{program.company}</p>
                      <h4 className="text-base font-bold text-foreground leading-snug line-clamp-1">{program.title}</h4>
                    </div>
                  </div>
                </div>
                {program.isExpiringSoon && (
                  <div className="absolute top-4 right-4 text-[9px] bg-red-500/20 text-destructive px-2 py-0.5 rounded border border-red-500/30 whitespace-nowrap font-bold uppercase tracking-wider">
                    Expiring Soon
                  </div>
                )}
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 mt-2 leading-relaxed">{program.description}</p>
              </div>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                  <Calendar size={14} className="text-muted-foreground" /> {program.deadline}
                </span>
                {program.link && (
                  <a href={program.link} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[hsl(var(--primary-accent))] hover:text-[hsl(var(--primary-accent))] flex items-center gap-1 group-hover:underline">
                    Apply <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          ))}
          {programs.length === 0 && (
            <div className="w-full text-center py-10 text-muted-foreground border border-dashed border-border rounded-md bg-secondary">
              No active programs found at the moment.
            </div>
          )}
        </div>
      </div>

      {/* 5. LOWER SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="border border-border bg-secondary rounded-md p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2"><History className="text-accent" size={20}/> Recent Activity</h3>
              <span className="text-xs font-bold px-3 py-1 bg-secondary border border-border rounded-full text-muted-foreground cursor-pointer hover:bg-secondary transition-colors">View All</span>
            </div>
            
            <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-px before:bg-border">
              {(() => { const realSessions = activityHistory.filter(a => !a.label?.startsWith('Auto-tracked:')); return realSessions.length === 0 ? (
                 <div className="py-8 text-center text-muted-foreground text-sm border border-dashed border-border rounded-md relative z-10 bg-card backdrop-blur-sm">No focus sessions yet. Hit start above!</div>
               ) : realSessions.slice(0, 4).map((a, i) => {
                const cat = ACTIVITY_CATEGORIES.find(c => c.value === a.category);
                return (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-4">
                     {/* Timeline Node */}
                     <div className="flex items-center justify-center w-10 h-10 rounded-full border-[3px] border-[#121215] bg-white text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10 hover:scale-110 transition-transform" style={{ backgroundColor: cat?.color || '#3b82f6' }}>
                       <Target size={14} className="text-foreground" />
                     </div>
                     {/* Timeline Content */}
                     <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-secondary border border-border p-4 rounded-md hover:border-border transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                           <div>
                             <div className="font-bold text-foreground text-base leading-tight">{a.label || cat?.label}</div>
                             <div className="text-xs font-medium text-muted-foreground mt-1.5 capitalize">{cat?.label} • {formatDuration(a.duration)}</div>
                           </div>
                           <div className="text-xs font-bold text-muted-foreground whitespace-nowrap bg-secondary px-2 py-1 rounded-md">
                             {new Date(a.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </div>
                        </div>
                     </div>
                  </div>
                );
              })})()}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="border border-border bg-secondary rounded-md p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><CalendarClock className="text-[hsl(var(--primary-accent))]" size={20}/> Upcoming Events</h2>
              <span className="text-xs font-bold px-3 py-1 bg-secondary border border-border rounded-full text-muted-foreground cursor-pointer hover:bg-secondary transition-colors">View All</span>
            </div>
            
            <div className="space-y-4">
              {events.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm border border-dashed border-border rounded-md bg-card backdrop-blur-sm">
                  No upcoming events scheduled.
                </div>
              ) : events.slice(0, 4).map(event => {
                const { month, day } = formatDate(event.date);
                return (
                  <div key={event._id} className="flex gap-5 bg-secondary p-4 rounded-md border border-border hover:border-border transition-all group shadow-sm">
                    <div className="flex flex-col items-center justify-center bg-secondary border border-border w-[72px] h-[72px] rounded-md group-hover:bg-primary/20 transition-colors">
                      <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">{month}</span>
                      <span className="text-2xl font-semibold leading-none text-foreground my-0.5">{day}</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="font-bold text-foreground text-base group-hover:text-primary-300 transition-colors">{event.title}</div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 bg-blue-500/10 text-[hsl(var(--primary-accent))] border border-blue-500/20 rounded-full capitalize">
                          {event.type}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Clock size={10} /> {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
      </div>

      {/* Legacy Analytics Modal (If triggered by top button) */}
      <AnimatePresence>
        {showAnalytics && analytics && (
           <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-card z-[100] flex items-center justify-center p-4 sm:p-6"
            onClick={(e) => { if (e.target === e.currentTarget) setShowAnalytics(false); }}
          >
             <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", bounce: 0.15 }}
              className="w-full max-w-lg overflow-y-auto bg-card border border-border rounded-md p-6 md:p-10 relative"
            >
               <button 
                onClick={() => setShowAnalytics(false)} 
                className="absolute top-6 right-6 p-2 bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors z-10"
              >
                <X size={20} />
              </button>
              
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/20 text-primary-400 border border-primary/30 rounded-md flex items-center justify-center">
                    <PieChartIcon size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                      Detailed Analytics
                    </h2>
                    <p className="text-muted-foreground text-sm font-medium">Your study habits and performance data.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Pie Chart for Categories */}
                  <div className="bg-secondary border border-border rounded-md p-5 flex flex-col items-center">
                    <h3 className="text-sm font-bold text-muted-foreground mb-4 w-full text-center tracking-wide uppercase">Time by Category</h3>
                    <div className="h-[200px] w-full">
                      {categoryChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={categoryChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                              {categoryChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={tooltipStyle()} itemStyle={{ color: 'inherit' }} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-xs text-center border border-dashed border-border rounded-md">No category data yet</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Bar Chart for Daily Minutes */}
                  <div className="bg-secondary border border-border rounded-md p-5 flex flex-col items-center">
                    <h3 className="text-sm font-bold text-muted-foreground mb-4 w-full text-center tracking-wide uppercase">Daily Focus (Mins)</h3>
                    <div className="h-[200px] w-full">
                      {dailyChartData.some(d => d.minutes > 0) ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <XAxis dataKey="name" {...axisProps()} dy={5} />
                            <YAxis {...axisProps()} />
                            <Tooltip cursor={{ fill: 'rgba(125,125,140,0.08)' }} contentStyle={tooltipStyle()} />
                            <Bar dataKey="minutes" fill={CHART_COLORS[0]} radius={[6, 6, 0, 0]} barSize={32} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-xs text-center border border-dashed border-border rounded-md">No daily data yet</div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-elevated border border-border rounded-md p-5 flex justify-between items-center mb-2">
                  <div>
                    <div className="text-xs text-[hsl(var(--primary-accent))]/70 uppercase tracking-widest font-bold mb-1">Total Focus Time</div>
                    <div className="text-2xl font-semibold text-foreground">{formatDuration(analytics?.overall?.totalSeconds || 0)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[hsl(var(--primary-accent))]/70 uppercase tracking-widest font-bold mb-1">Total Sessions</div>
                    <div className="text-2xl font-semibold text-foreground">{analytics?.overall?.sessionCount || 0}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentDashboard;

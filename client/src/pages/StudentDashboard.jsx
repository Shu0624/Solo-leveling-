import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
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
import { generateReadinessReport } from '../utils/generateReport';
import LiveSessionWidget from '../components/dashboard/LiveSessionWidget';
import TodayIntelligence from '../components/dashboard/TodayIntelligence';
import FocusScoreRing from '../components/dashboard/FocusScoreRing';
import SessionHistory from '../components/dashboard/SessionHistory';

const StudentDashboard = () => {
  const { user, api } = useAuth();
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground">
        <Activity className="animate-pulse mb-4 text-primary" size={48} />
        <p className="animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in min-h-screen font-sans">
      {/* Dynamic Background Blurs for Dark Neon Vibe */}
      <div className="fixed inset-0 z-[-1] bg-[#09090b]"></div>
      <div className="fixed top-[-20%] left-[-10%] w-[50vh] h-[50vh] bg-purple-600/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[60vh] h-[60vh] bg-blue-600/10 rounded-full blur-[150px] -z-10 pointer-events-none" />
      <div className="fixed top-[40%] left-[50%] w-[80vw] h-[40vh] bg-indigo-500/5 rounded-full blur-[150px] -z-10 pointer-events-none -translate-x-1/2" />

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
             <h1 className="text-3xl font-bold tracking-tight text-white">
               Welcome back, {user?.name?.split(' ')[0]}
             </h1>
             <div className="hidden sm:flex px-4 py-1.5 bg-[#121215]/80 border border-white/10 rounded-full items-center gap-2 shadow-inner backdrop-blur-md">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
               <span className="text-xs font-bold text-white/80 font-mono tracking-widest leading-none mt-0.5">{currentTime.toLocaleTimeString()}</span>
             </div>
          </div>
          <p className="text-white/60 text-sm font-medium">Let's make today productive and meaningful.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link 
            to="/my-analytics" 
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white hover:bg-white/10 backdrop-blur-md rounded-xl text-sm font-medium transition-colors"
          >
            <PieChartIcon size={16} /> Analytics
          </Link>
          <button 
            onClick={async () => {
              try {
                const btn = document.getElementById('report-btn');
                if (btn) { btn.disabled = true; btn.textContent = 'Generating...'; }
                const res = await api.get('/dashboard/report-data');
                generateReadinessReport(res.data);
                if (btn) { btn.disabled = false; btn.textContent = ''; }
              } catch (err) {
                alert('Failed to generate report. Try again.');
                const btn = document.getElementById('report-btn');
                if (btn) { btn.disabled = false; }
              }
            }}
            id="report-btn"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/80 to-teal-500/80 border border-emerald-500/50 text-white hover:opacity-90 shadow-[0_0_15px_rgba(16,185,129,0.3)] rounded-xl text-sm font-medium transition-all disabled:opacity-50 backdrop-blur-md"
          >
            <FileDown size={16} /> Download Report
          </button>
        </div>
      </header>

      {/* 1. TOP SECTION (ACTION ROW) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left: Today's Tasks */}
        <div className="border border-white/10 bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 shadow-xl flex flex-col min-h-[350px] overflow-hidden">
             <div className="mb-4 shrink-0 flex justify-between items-center">
               <h2 className="text-lg font-bold text-white flex items-center gap-2"><Target size={18} className="text-blue-400" /> Your Tasks</h2>
             </div>
             <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <TaskChecklist />
             </div>
        </div>

        {/* Right: Binaural Beats */}
        <div className="border border-white/10 bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 shadow-xl flex flex-col min-h-[350px] relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 text-white/5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <BrainCircuit size={100} />
           </div>
           <div className="relative z-10 w-full h-full">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4"><Play size={18} className="text-purple-400" /> Binaural Beats</h2>
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
         <div className="lg:col-span-5 xl:col-span-5 border border-white/10 bg-[#121217]/60 backdrop-blur-3xl rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[440px]">
             {/* Glowing Orbs for the Hero */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[80px] pointer-events-none line-glow"></div>
             <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

             <div className="relative z-10 flex justify-between items-center w-full mb-4">
               <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                 <div className="p-2 rounded-xl bg-primary/20 border border-primary/30"><Target className="text-blue-400" size={20}/></div>
                 Focus Zone
               </h2>
               
               <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 backdrop-blur-md shadow-inner">
                {['stopwatch', 'countdown'].map(mode => (
                  <button 
                    key={mode} 
                    onClick={() => { if (!timerRunning) setTimerMode(mode); }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all duration-300 ${
                      timerMode === mode ? 'bg-primary/90 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-white/50 hover:text-white'
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
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] rounded-full border border-white/5 pointer-events-none ${timerRunning ? 'animate-[spin_10s_linear_infinite]' : ''}`}>
                    <div className="absolute top-0 left-1/2 w-2 h-2 bg-primary rounded-full shadow-[0_0_20px_rgba(59,130,246,1)] -translate-x-1/2 -translate-y-1/2"></div>
                </div>

                <div className={`text-[4.5rem] sm:text-[5rem] md:text-[5.5rem] md:tracking-tighter tabular-nums transition-colors duration-700 drop-shadow-[0_0_25px_rgba(255,255,255,0.1)] relative z-10 font-[600] font-sans ${
                  timerRunning ? 'text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/60' : 'text-white'
                }`}>
                  {timerMode === 'countdown' ? formatTime(Math.max((countdownMinutes * 60) - timerSeconds, 0)) : formatTime(timerSeconds)}
                </div>

                <div className="mt-4 mb-2 relative z-20 text-white/50 text-sm font-semibold tracking-widest uppercase">
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
                    className="flex-1 bg-[#18181b]/80 border border-white/10 text-white rounded-2xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary/50 outline-none transition-all disabled:opacity-50 appearance-none text-center shadow-lg backdrop-blur-md hover:bg-white/5 truncate"
                   >
                    {ACTIVITY_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                   </select>

                   {timerMode === 'countdown' && (
                    <div className="flex items-center justify-center bg-[#18181b]/80 border border-white/10 rounded-2xl px-4 py-3 text-sm focus-within:ring-2 focus-within:ring-primary/50 transition-all shadow-lg backdrop-blur-md w-24">
                       <input 
                        type="number" min="1" max="480" 
                        value={countdownMinutes} 
                        onChange={e => setCountdownMinutes(parseInt(e.target.value) || 1)} 
                        disabled={timerRunning}
                        className="w-full bg-transparent text-white text-center outline-none disabled:opacity-50 font-bold" 
                      />
                      <span className="text-white/50 font-medium text-xs">m</span>
                    </div>
                   )}
                 </div>

                 <div className="w-full">
                  {!timerRunning ? (
                    <button 
                      onClick={startTimer} 
                      className="w-full relative py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm overflow-hidden transition-all duration-300 shadow-[0_0_20px_rgba(79,70,229,0.3)] border border-white/20 flex items-center justify-center gap-2"
                    >
                      <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                      <Play fill="currentColor" size={18} /> START FOCUS
                    </button>
                  ) : (
                    <div className="flex w-full gap-2">
                      <button 
                        onClick={pauseTimer} 
                        className="flex-1 py-4 rounded-2xl bg-warning/20 border border-warning/50 text-warning flex items-center justify-center transition-all backdrop-blur-md hover:bg-warning/30"
                      >
                        <Pause fill="currentColor" size={20} />
                      </button>
                      <button 
                        onClick={stopAndSaveTimer} 
                        className="flex-[2] py-4 rounded-2xl bg-destructive/10 border border-destructive/50 text-destructive-foreground font-black text-sm flex items-center justify-center gap-2 transition-all backdrop-blur-md hover:bg-destructive/20"
                      >
                        <Square fill="currentColor" size={16} /> END SESSION
                      </button>
                    </div>
                  )}
                </div>
             </div>
         </div>

         {/* RIGHT: PROGRESS */}
         <div className="lg:col-span-7 xl:col-span-7 border border-white/10 bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-center min-h-[440px]">
             
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <PieChartIcon size={20} className="text-purple-400" /> Progress
                </h2>
                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-white/50 text-xs font-bold uppercase cursor-pointer hover:bg-white/10 transition">Today v</div>
             </div>

             {/* FOCUS STREAK & STATS (Replaces 3 min-cards) */}
             <div className="bg-[#121215]/80 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-inner relative overflow-hidden mb-6 group shrink-0">
                <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 opacity-10 group-hover:scale-110 transition-transform"><Flame size={120} className="text-orange-500" /></div>
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                   <div>
                     <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest flex items-center gap-2 mb-2">
                       <div className="w-6 h-6 rounded bg-orange-500/20 text-orange-400 flex items-center justify-center"><Flame size={14}/></div>
                       Focus Streak
                     </h3>
                     <div className="text-3xl font-black text-white">{streakData?.current || 0} <span className="text-lg text-white/50 font-semibold tracking-normal">Days</span></div>
                     <p className="text-xs font-semibold text-orange-400 mt-1">Keep it up! 🔥</p>
                   </div>
                   
                   <div className="flex gap-2 sm:gap-3">
                      <div className="bg-black/40 border border-white/5 p-2 sm:p-3 rounded-xl min-w-[70px] sm:min-w-[80px]">
                         <div className="text-[9px] sm:text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Today</div>
                         <div className="font-bold text-white shadow-sm text-sm sm:text-base">{formatDuration(analytics?.today?.totalSeconds || 0)}</div>
                      </div>
                       <div className="bg-black/40 border border-white/5 p-2 sm:p-3 rounded-xl min-w-[70px] sm:min-w-[80px]">
                          <div className="text-[9px] sm:text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Week</div>
                          <div className="font-bold text-white shadow-sm text-sm sm:text-base">{formatDuration(analytics?.weekly?.totalSeconds || 0)}</div>
                       </div>
                   </div>
                </div>

                {/* 7 Days Circles */}
                <div className="flex items-center justify-between gap-1 sm:gap-2 relative z-10 pt-4 border-t border-white/5">
                   {dailyChartData.map((day, idx) => {
                      const isToday = idx === 6;
                      const hasStudied = day.minutes > 0;
                      return (
                        <button 
                          key={day.dateStr} 
                          onClick={() => setSelectedStreakDate(selectedStreakDate === day.dateStr ? null : day.dateStr)}
                          className="flex flex-col items-center gap-2 hover:scale-110 transition-transform group/btn"
                        >
                           <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-lg transition-colors ${selectedStreakDate === day.dateStr ? 'ring-2 ring-primary ring-offset-2 ring-offset-[#121215]' : ''} ${hasStudied ? 'bg-primary/20 text-primary-400' : (isToday ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-white/20')} `}>
                              {hasStudied ? <Target size={14} className="opacity-80"/> : <Flame size={14} className={isToday ? 'opacity-80' : 'opacity-40'}/>}
                           </div>
                           <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-white' : 'text-white/40'} group-hover/btn:text-white transition-colors`}>
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
                     className="overflow-hidden mt-4 bg-black/30 rounded-xl"
                   >
                      <div className="p-4 border border-white/5 rounded-xl text-left">
                         <div className="text-xs font-bold text-white/60 mb-2">Study Sessions for {new Date(selectedStreakDate).toLocaleDateString()}</div>
                         <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                           {activityHistory.filter(h => h.date.split('T')[0] === selectedStreakDate).length === 0 ? (
                              <div className="text-[11px] text-white/30 italic">No activity logged on this day.</div>
                           ) : activityHistory.filter(h => h.date.split('T')[0] === selectedStreakDate).map(hist => (
                              <div key={hist._id} className="flex justify-between items-center text-xs bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                                 <span className="text-white/80 font-medium">{hist.label || ACTIVITY_CATEGORIES.find(c => c.value === hist.category)?.label || hist.category}</span>
                                 <span className="text-white/50">{formatDuration(hist.duration)}</span>
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
              className="border border-white/10 bg-[#121217]/60 backdrop-blur-3xl rounded-[2.5rem] p-6 shadow-2xl flex items-center justify-between"
            >
              <div>
                <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-1">Last Session</h3>
                <p className="text-xs text-white/30">
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
      <div className="mb-10 border border-white/10 bg-[#121217]/60 backdrop-blur-3xl rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative overflow-hidden">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity size={20} className="text-blue-400" /> Focus Time History
            </h2>
            <div className="flex flex-wrap items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 backdrop-blur-md shadow-inner">
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
                      ? 'bg-primary text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
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
                       <stop offset="5%" stopColor="#818cf8" stopOpacity={0.6}/>
                       <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '12px', border: '1px solid #3f3f46', color: '#fff', fontSize: '12px' }}
                     itemStyle={{ color: '#fff' }}
                   />
                   <Area type="monotone" dataKey="minutes" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorBlueDark)" />
                 </AreaChart>
               </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-white/30 text-sm border-dashed border-white/10 border rounded-2xl bg-black/20">No study history for the last 7 days.</div>
             )}
         </div>
      </div>

      {/* 4. SMART ACTIONS */}
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Rocket size={24} className="text-emerald-400" /> Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { to: '/interview', title: 'Mock Interview', desc: 'Practice technical and behavioral questions', icon: <Users size={24} />, bg: 'bg-indigo-500/10', color: 'text-indigo-400', border: 'border-indigo-500/20' },
            { to: '/resume', title: 'Resume Analyzer', desc: resumeScore ? `Current Score: ${resumeScore}/100` : 'Get instant ATS feedback', icon: <FileSearch size={24} />, bg: 'bg-blue-500/10', color: 'text-blue-400', border: 'border-blue-500/20' },
            { to: '/modules', title: 'Learning Hub', desc: lastActiveModule ? `Continue: ${lastActiveModule.title}` : 'Start your technical modules', icon: <Rocket size={24} />, bg: 'bg-emerald-500/10', color: 'text-emerald-400', border: 'border-emerald-500/20' },
          ].map((action, i) => (
            <Link 
              key={i} 
              to={action.to} 
              className={`group flex items-start gap-4 ${action.bg} ${action.border} border backdrop-blur-md p-6 rounded-[2rem] hover:bg-white/10 transition-all duration-300 relative overflow-hidden shadow-lg`}
            >
              <div className={`p-4 rounded-2xl bg-black/40 ${action.color} border border-white/5 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                {action.icon}
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-white group-hover:text-white/80 transition-colors">{action.title}</h4>
                <p className="text-sm text-white/50 mt-1 line-clamp-2 leading-relaxed">{action.desc}</p>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-white/40 group-hover:text-white/80 transition-colors uppercase tracking-widest">
                  Get Started <Target size={12} />
                </div>
              </div>
            </Link>
          ))}
      </div>

      {/* 4.5 PROGRAMS & OPPORTUNITIES (HORIZONTAL SCROLL) */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Globe size={24} className="text-blue-400" /> Programs & Opportunities
          </h2>
          <Link to="/activities" className="text-xs font-bold px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/60 hover:bg-white/10 transition-colors">
            View All
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x w-full">
          {programs.slice(0, 5).map((program, i) => (
            <div key={program._id || i} className="min-w-[300px] md:min-w-[350px] shrink-0 border border-white/10 bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 shadow-lg snap-start hover:bg-white/10 transition-colors flex flex-col justify-between relative group">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm bg-white/10">
                      {program.logo || '🏢'}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">{program.company}</p>
                      <h4 className="text-base font-bold text-white leading-snug line-clamp-1">{program.title}</h4>
                    </div>
                  </div>
                </div>
                {program.isExpiringSoon && (
                  <div className="absolute top-4 right-4 text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30 whitespace-nowrap font-bold uppercase tracking-wider">
                    Expiring Soon
                  </div>
                )}
                <p className="text-sm text-white/60 mb-4 line-clamp-2 mt-2 leading-relaxed">{program.description}</p>
              </div>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                <span className="text-xs font-bold text-white/40 flex items-center gap-1">
                  <Calendar size={14} className="text-white/30" /> {program.deadline}
                </span>
                {program.link && (
                  <a href={program.link} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 group-hover:underline">
                    Apply <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          ))}
          {programs.length === 0 && (
            <div className="w-full text-center py-10 text-white/40 border border-dashed border-white/10 rounded-[2rem] bg-black/20">
              No active programs found at the moment.
            </div>
          )}
        </div>
      </div>

      {/* 5. LOWER SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="border border-white/10 bg-white/5 backdrop-blur-xl rounded-[2rem] p-8 shadow-lg">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><History className="text-accent" size={20}/> Recent Activity</h3>
              <span className="text-xs font-bold px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/60 cursor-pointer hover:bg-white/10 transition-colors">View All</span>
            </div>
            
            <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-px before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
              {(() => { const realSessions = activityHistory.filter(a => !a.label?.startsWith('Auto-tracked:')); return realSessions.length === 0 ? (
                 <div className="py-8 text-center text-white/30 text-sm border border-dashed border-white/10 rounded-2xl relative z-10 bg-[#09090b]/50 backdrop-blur-sm">No focus sessions yet. Hit start above!</div>
               ) : realSessions.slice(0, 4).map((a, i) => {
                const cat = ACTIVITY_CATEGORIES.find(c => c.value === a.category);
                return (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-4">
                     {/* Timeline Node */}
                     <div className="flex items-center justify-center w-10 h-10 rounded-full border-[3px] border-[#121215] bg-white text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10 hover:scale-110 transition-transform" style={{ backgroundColor: cat?.color || '#3b82f6' }}>
                       <Target size={14} className="text-white" />
                     </div>
                     {/* Timeline Content */}
                     <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white/5 border border-white/10 backdrop-blur-md p-4 rounded-2xl shadow-lg hover:border-white/20 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                           <div>
                             <div className="font-bold text-white text-base leading-tight">{a.label || cat?.label}</div>
                             <div className="text-xs font-medium text-white/50 mt-1.5 capitalize">{cat?.label} • {formatDuration(a.duration)}</div>
                           </div>
                           <div className="text-xs font-bold text-white/30 whitespace-nowrap bg-black/20 px-2 py-1 rounded-md">
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
          <div className="border border-white/10 bg-white/5 backdrop-blur-xl rounded-[2rem] p-8 shadow-lg">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><CalendarClock className="text-blue-400" size={20}/> Upcoming Events</h2>
              <span className="text-xs font-bold px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/60 cursor-pointer hover:bg-white/10 transition-colors">View All</span>
            </div>
            
            <div className="space-y-4">
              {events.length === 0 ? (
                <div className="py-12 text-center text-white/30 text-sm border border-dashed border-white/10 rounded-2xl bg-[#09090b]/50 backdrop-blur-sm">
                  No upcoming events scheduled.
                </div>
              ) : events.slice(0, 4).map(event => {
                const { month, day } = formatDate(event.date);
                return (
                  <div key={event._id} className="flex gap-5 bg-black/40 p-4 rounded-2xl border border-white/5 hover:border-white/20 transition-all group shadow-sm">
                    <div className="flex flex-col items-center justify-center bg-white/5 border border-white/10 w-[72px] h-[72px] rounded-xl shadow-inner group-hover:bg-primary/20 transition-colors">
                      <span className="text-[10px] font-black tracking-widest text-white/50 uppercase">{month}</span>
                      <span className="text-2xl font-black leading-none text-white my-0.5">{day}</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="font-bold text-white text-base group-hover:text-primary-300 transition-colors">{event.title}</div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full capitalize">
                          {event.type}
                        </span>
                        <span className="text-xs font-medium text-white/40 flex items-center gap-1">
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
            className="fixed inset-0 bg-[#09090b]/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 sm:p-6"
            onClick={(e) => { if (e.target === e.currentTarget) setShowAnalytics(false); }}
          >
             <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", bounce: 0.15 }}
              className="w-full max-w-lg overflow-y-auto bg-[#121215] border border-white/10 rounded-3xl shadow-2xl p-6 md:p-10 relative"
            >
               <button 
                onClick={() => setShowAnalytics(false)} 
                className="absolute top-6 right-6 p-2 bg-white/5 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors backdrop-blur-md z-10"
              >
                <X size={20} />
              </button>
              
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/20 text-primary-400 border border-primary/30 rounded-2xl flex items-center justify-center">
                    <PieChartIcon size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">
                      Detailed Analytics
                    </h2>
                    <p className="text-white/60 text-sm font-medium">Your study habits and performance data.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Pie Chart for Categories */}
                  <div className="bg-black/30 border border-white/10 rounded-2xl p-5 flex flex-col items-center shadow-inner">
                    <h3 className="text-sm font-bold text-white/70 mb-4 w-full text-center tracking-wide uppercase">Time by Category</h3>
                    <div className="h-[200px] w-full">
                      {categoryChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={categoryChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                              {categoryChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '12px', color: '#fff', fontSize: '12px' }} itemStyle={{ color: '#fff' }} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-white/30 text-xs text-center border border-dashed border-white/5 rounded-xl">No category data yet</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Bar Chart for Daily Minutes */}
                  <div className="bg-black/30 border border-white/10 rounded-2xl p-5 flex flex-col items-center shadow-inner">
                    <h3 className="text-sm font-bold text-white/70 mb-4 w-full text-center tracking-wide uppercase">Daily Focus (Mins)</h3>
                    <div className="h-[200px] w-full">
                      {dailyChartData.some(d => d.minutes > 0) ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} dy={5} />
                            <YAxis tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                            <Bar dataKey="minutes" fill="#818cf8" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-white/30 text-xs text-center border border-dashed border-white/5 rounded-xl">No daily data yet</div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-indigo-500/30 rounded-2xl p-6 flex justify-between items-center mb-2 shadow-lg">
                  <div>
                    <div className="text-xs text-indigo-200/70 uppercase tracking-widest font-bold mb-1">Total Focus Time</div>
                    <div className="text-2xl font-black text-white">{formatDuration(analytics?.overall?.totalSeconds || 0)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-indigo-200/70 uppercase tracking-widest font-bold mb-1">Total Sessions</div>
                    <div className="text-2xl font-black text-white">{analytics?.overall?.sessionCount || 0}</div>
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

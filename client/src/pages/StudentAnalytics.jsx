import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  ArrowLeft, TrendingUp, TrendingDown, Minus, Award, Brain, FileText, Clock,
  BookOpen, Target, Flame, Lightbulb, CheckCircle2, AlertCircle, ChevronRight,
  BarChart3, Zap, GraduationCap, Users
} from 'lucide-react';
import { ACTIVITY_CATEGORIES } from '../context/ActivityContext';

const TOPIC_LABELS = {
  hr: 'Behavioral', java: 'Java', python: 'Python', dsa: 'DSA',
  fullstack: 'MERN Stack', os: 'OS', dbms: 'DBMS', cn: 'Networks', project: 'Project'
};

const CATEGORY_COLORS = {
  coding: '#818cf8', interview: '#f472b6', resume: '#34d399',
  learning: '#fbbf24', dsa: '#a78bfa', aptitude: '#f97316', other: '#6b7280'
};

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const RECC_ICONS = {
  resume: <FileText size={16} />,
  quiz: <Brain size={16} />,
  interview: <Target size={16} />,
  focus: <Clock size={16} />,
  modules: <BookOpen size={16} />,
  dsa: <Zap size={16} />,
  academics: <GraduationCap size={16} />,
  language: <Users size={16} />
};

const StudentAnalytics = () => {
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRange, setActiveRange] = useState('7days');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/dashboard/student-analytics?range=${activeRange}`);
        setData(res.data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [api, activeRange]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent animate-pulse" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">Loading analytics...</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <p className="text-muted-foreground">Failed to load analytics. Please try again.</p>
    </div>
  );

  const {
    readinessScore,
    quiz,
    interview,
    resume,
    modules,
    focus,
    streak,
    recommendations,
    dsa,
    language,
    roadmap,
    academics
  } = data;

  const dsaStats = dsa || { platform: 'leetcode', totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0, totalScore: 0 };
  const languageStats = language || { currentLanguage: 'None Selected', totalXP: 0, eloRating: 800, unlockedScenariosCount: 0 };
  const roadmapStats = roadmap || { targetRole: 'Not Set', companyType: 'Not Set', experienceLevel: 'Beginner', estimatedReadiness: '0%', completedTasks: 0, totalTasks: 0 };
  const academicsStats = academics || { attendance: 0, assignmentCompletion: 0, avgGrade: 0, totalAssignments: 0, submittedAssignments: 0, totalLectures: 0, lecturesAttended: 0 };

  // Chart data
  const categoryChartData = (focus.byCategory || []).map(c => {
    const cat = ACTIVITY_CATEGORIES.find(a => a.value === c._id);
    return {
      name: cat?.label || c._id || 'Other',
      value: Math.round((c.totalSeconds || 0) / 60),
      color: cat?.color || '#6b7280'
    };
  });

  const dailyChartData = (() => {
    const dailyList = focus.daily || [];
    if (dailyList.length === 0) return [];
    
    return dailyList.map(d => {
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
        name: formattedName,
        minutes: Math.round((d.totalSeconds || 0) / 60)
      };
    });
  })();

  const quizTrendData = (quiz.recent || []).reverse().map((q, i) => ({
    attempt: `#${i + 1}`,
    score: q.score
  }));

  const interviewTopicData = (interview.byTopic || []).map(t => ({
    name: TOPIC_LABELS[t.topic] || t.topic,
    sessions: t.sessions,
    score: t.avgScore
  }));

  // Readiness ring
  const ringRadius = 70;
  const circumference = 2 * Math.PI * ringRadius;
  const ringProgress = (readinessScore / 100) * circumference;
  const ringColor = readinessScore >= 70 ? '#34d399' : readinessScore >= 40 ? '#fbbf24' : '#f87171';

  const TrendIcon = quiz.trend === 'up' ? TrendingUp : quiz.trend === 'down' ? TrendingDown : Minus;
  const trendColor = quiz.trend === 'up' ? 'text-emerald-400' : quiz.trend === 'down' ? 'text-red-400' : 'text-white/40';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative">
      {/* Background */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] -z-10 pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {/* Header */}
      <header className="mb-10">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Performance Analytics</h1>
            <p className="text-muted-foreground">Deep insights into your preparation journey.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl">
              <Flame size={18} className="text-orange-500" />
              <span className="font-bold text-orange-500">{streak.current || 0} day streak</span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Row 1: Readiness Score + Quick Stats ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Readiness Ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-4 glass-morphism rounded-3xl p-8 flex flex-col items-center justify-center text-center"
        >
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6">Interview Readiness</h3>
          <div className="relative w-48 h-48 mb-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r={ringRadius} fill="none" stroke="currentColor" strokeWidth="8" className="text-border/30" />
              <circle
                cx="80" cy="80" r={ringRadius} fill="none" stroke={ringColor} strokeWidth="8"
                strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - ringProgress}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black" style={{ color: ringColor }}>{readinessScore}</span>
              <span className="text-xs text-muted-foreground font-medium mt-1">/ 100</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground max-w-[200px]">
            Composite score from quizzes, interviews, resume, focus time & modules.
          </p>
        </motion.div>

        {/* Quick Stats Grid */}
        <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Quiz Avg', value: `${quiz.avgScore}%`, sub: `${quiz.total} attempts`, icon: <Brain size={20} />, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
            { label: 'Interview Score', value: interview.avgScore > 0 ? `${interview.avgScore}%` : '—', sub: `${interview.total} sessions`, icon: <Target size={20} />, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
            { label: 'Resume ATS', value: resume.uploaded ? `${resume.score}/100` : 'Not uploaded', sub: resume.uploaded ? (resume.score >= 70 ? 'Strong' : 'Needs work') : 'Upload now', icon: <FileText size={20} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Focus Time', value: formatDuration(focus.overall?.totalSeconds || 0), sub: `${focus.overall?.sessions || 0} sessions`, icon: <Clock size={20} />, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
            { label: 'Best Quiz', value: `${quiz.bestScore}%`, sub: 'Highest score', icon: <Award size={20} />, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
            { label: 'This Week', value: formatDuration(focus.weekly?.totalSeconds || 0), sub: `${focus.weekly?.sessions || 0} sessions`, icon: <BarChart3 size={20} />, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
            { label: 'Modules', value: `${modules.started}/${modules.total}`, sub: `${modules.overallProgress}% complete`, icon: <BookOpen size={20} />, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
            { label: 'Quiz Trend', value: quiz.trend === 'up' ? 'Improving' : quiz.trend === 'down' ? 'Declining' : 'Steady', sub: 'vs previous attempts', icon: <TrendIcon size={20} />, color: trendColor, bg: quiz.trend === 'up' ? 'bg-emerald-500/10 border-emerald-500/20' : quiz.trend === 'down' ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/10' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-2xl p-4 border ${stat.bg} backdrop-blur-md`}
            >
              <div className={`${stat.color} mb-2`}>{stat.icon}</div>
              <div className="text-xl font-extrabold text-foreground">{stat.value}</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</div>
              <div className="text-[10px] text-muted-foreground/60 mt-0.5">{stat.sub}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ─── Row 2: Charts ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Focus Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-morphism rounded-3xl p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Focus Time History</h3>
            <div className="flex flex-wrap items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 shadow-inner">
              {[
                { value: '7days', label: '7D' },
                { value: 'thisMonth', label: 'This Month' },
                { value: 'lastMonth', label: 'Last Month' },
                { value: 'everyMonth', label: 'Monthly' },
                { value: 'lastYear', label: 'Last Year' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setActiveRange(opt.value)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all duration-300 ${
                    activeRange === opt.value
                      ? 'bg-primary text-white shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[220px]">
            {dailyChartData.some(d => d.minutes > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    formatter={(val) => [`${val} min`, 'Focus']}
                  />
                  <Bar dataKey="minutes" fill="#818cf8" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground/40 text-sm border border-dashed border-border/30 rounded-xl">No focus data yet</div>
            )}
          </div>
        </motion.div>

        {/* Quiz Score Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-morphism rounded-3xl p-6"
        >
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Quiz Score Trend</h3>
          <div className="h-[220px]">
            {quizTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={quizTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="attempt" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '12px', color: '#fff', fontSize: '12px' }} formatter={(val) => [`${val}%`, 'Score']} />
                  <Line type="monotone" dataKey="score" stroke="#f472b6" strokeWidth={3} dot={{ fill: '#f472b6', r: 5 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground/40 text-sm border border-dashed border-border/30 rounded-xl">Take a quiz to see trends</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ─── Row 3: Interview by Topic + Category Pie ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Interview by Topic */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-morphism rounded-3xl p-6"
        >
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Interview Performance by Topic</h3>
          {interviewTopicData.length > 0 ? (
            <div className="space-y-3">
              {interviewTopicData.map((t, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-background/30 border border-border/30">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center flex-shrink-0">
                    <Target size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-foreground">{t.name}</div>
                    <div className="text-[10px] text-muted-foreground">{t.sessions} session{t.sessions !== 1 ? 's' : ''}</div>
                  </div>
                  {t.score > 0 && (
                    <div className={`text-lg font-black ${t.score >= 70 ? 'text-emerald-400' : t.score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                      {t.score}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground/40 text-sm border border-dashed border-border/30 rounded-xl">
              <Target size={32} className="mx-auto mb-3 opacity-30" />
              <p>Start mock interviews to see topic analysis</p>
              <Link to="/interview" className="inline-flex items-center gap-1 mt-3 text-primary text-xs font-medium hover:underline">
                Go to Interview Studio <ChevronRight size={14} />
              </Link>
            </div>
          )}
        </motion.div>

        {/* Focus by Category Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-morphism rounded-3xl p-6"
        >
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Study Time by Category</h3>
          <div className="h-[250px]">
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '12px', color: '#fff', fontSize: '12px' }} formatter={(val) => [`${val} min`, 'Time']} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground/40 text-sm border border-dashed border-border/30 rounded-xl">No category data yet</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ─── Row 4: Resume Summary + Module Progress ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Resume */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-morphism rounded-3xl p-6"
        >
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Resume Analysis</h3>
          {resume.uploaded ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                <div className="text-4xl font-black" style={{ color: resume.score >= 70 ? '#34d399' : resume.score >= 40 ? '#fbbf24' : '#f87171' }}>{resume.score}</div>
                <div>
                  <div className="font-bold text-foreground">ATS Score</div>
                  <div className="text-xs text-muted-foreground">{resume.score >= 70 ? 'Strong resume' : resume.score >= 40 ? 'Room for improvement' : 'Needs significant work'}</div>
                </div>
              </div>
              {resume.strengths.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-emerald-400 mb-2">Strengths</div>
                  {resume.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-foreground/80 mb-1">
                      <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              )}
              {resume.weaknesses.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-amber-400 mb-2">Areas to Improve</div>
                  {resume.weaknesses.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-foreground/80 mb-1">
                      <AlertCircle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}
              <Link to="/resume" className="inline-flex items-center gap-1 text-primary text-xs font-medium hover:underline">
                View full analysis <ChevronRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="py-12 text-center border border-dashed border-border/30 rounded-xl">
              <FileText size={32} className="mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground/50 text-sm mb-3">Upload your resume to get ATS scoring</p>
              <Link to="/resume" className="inline-flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-all">
                <Zap size={14} /> Upload Resume
              </Link>
            </div>
          )}
        </motion.div>

        {/* Module Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-morphism rounded-3xl p-6"
        >
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Module Progress</h3>
          {modules.details.length > 0 ? (
            <div className="space-y-3">
              {modules.details.map((m, i) => (
                <div key={i} className="p-3 rounded-xl bg-background/30 border border-border/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-foreground">{m.name}</span>
                    <span className="text-xs text-muted-foreground">{m.lessonsCompleted} lessons</span>
                  </div>
                  <div className="w-full h-2 bg-border/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(m.lessonsCompleted * 20, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              <Link to="/modules" className="inline-flex items-center gap-1 text-primary text-xs font-medium hover:underline">
                Continue learning <ChevronRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="py-12 text-center border border-dashed border-border/30 rounded-xl">
              <GraduationCap size={32} className="mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground/50 text-sm mb-3">Start a module to track your learning</p>
                  <Link to="/modules" className="inline-flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-all">
                <BookOpen size={14} /> Browse Modules
              </Link>
            </div>
          )}
        </motion.div>
      </div>

      {/* ─── Row 4.5: Class Benchmarks & Peer Comparison ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75 }}
        className="glass-morphism rounded-3xl p-6 md:p-8 mb-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none">
          <Users size={120} />
        </div>
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="w-10 h-10 bg-primary/10 text-primary border border-primary/20 rounded-xl flex items-center justify-center">
            <Users size={20} />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Class Benchmarks & Peer Comparison</h3>
            <p className="text-xs text-muted-foreground">Compare your readiness metrics against your peers and global industry standards</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          {/* Quiz benchmark */}
          <div className="p-5 rounded-2xl bg-background/20 border border-border/30">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-foreground">Quiz Accuracy</span>
              <span className="text-xs font-bold text-muted-foreground">Target: 85%</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground font-semibold">You</span>
                  <span className="text-indigo-400 font-extrabold">{quiz.avgScore}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${quiz.avgScore}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground font-semibold">Class Peer Average</span>
                  <span className="text-muted-foreground font-extrabold">68%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-white/10 rounded-full" style={{ width: '68%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Interview benchmark */}
          <div className="p-5 rounded-2xl bg-background/20 border border-border/30">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-foreground">AI Mock Interview Accuracy</span>
              <span className="text-xs font-bold text-muted-foreground">Target: 80%</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground font-semibold">You</span>
                  <span className="text-pink-400 font-extrabold">{interview.avgScore > 0 ? `${interview.avgScore}%` : '0%'}</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-pink-500 rounded-full" style={{ width: `${interview.avgScore}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground font-semibold">Class Peer Average</span>
                  <span className="text-muted-foreground font-extrabold">72%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-white/10 rounded-full" style={{ width: '72%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Resume benchmark */}
          <div className="p-5 rounded-2xl bg-background/20 border border-border/30">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-foreground">Resume ATS Score</span>
              <span className="text-xs font-bold text-muted-foreground">Target: 80/100</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground font-semibold">You</span>
                  <span className="text-emerald-400 font-extrabold">{resume.uploaded ? `${resume.score}/100` : 'Not Uploaded'}</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${resume.uploaded ? resume.score : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground font-semibold">Class Peer Average</span>
                  <span className="text-muted-foreground font-extrabold">65/100</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-white/10 rounded-full" style={{ width: '65%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Study hours benchmark */}
          <div className="p-5 rounded-2xl bg-background/20 border border-border/30">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-foreground">Monthly Focus Duration</span>
              <span className="text-xs font-bold text-muted-foreground">Target: 15 Hours</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground font-semibold">You</span>
                  <span className="text-amber-400 font-extrabold">{focus.overall?.totalSeconds ? Math.round(focus.overall.totalSeconds / 3600) : 0} Hours</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(((focus.overall?.totalSeconds || 0) / 3600) / 15 * 100, 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground font-semibold">Class Peer Average</span>
                  <span className="text-muted-foreground font-extrabold">8.5 Hours</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-white/10 rounded-full" style={{ width: `${8.5 / 15 * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Row 4.6: Multi-Module Detailed Performance ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* DSA Performance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.77 }}
          className="glass-morphism rounded-3xl p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Zap size={16} />
                </div>
                <h4 className="font-bold text-foreground">DSA Coding Practice</h4>
              </div>
              <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                {dsaStats.platform}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center mb-4">
              <div className="bg-background/20 border border-border/30 rounded-xl p-2.5">
                <div className="text-lg font-bold text-emerald-400">{dsaStats.easySolved}</div>
                <div className="text-[10px] text-muted-foreground font-semibold uppercase">Easy</div>
              </div>
              <div className="bg-background/20 border border-border/30 rounded-xl p-2.5">
                <div className="text-lg font-bold text-amber-400">{dsaStats.mediumSolved}</div>
                <div className="text-[10px] text-muted-foreground font-semibold uppercase">Medium</div>
              </div>
              <div className="bg-background/20 border border-border/30 rounded-xl p-2.5">
                <div className="text-lg font-bold text-red-400">{dsaStats.hardSolved}</div>
                <div className="text-[10px] text-muted-foreground font-semibold uppercase">Hard</div>
              </div>
            </div>

            {/* Solved Progress Bar */}
            <div className="space-y-1 mb-4">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Total Solved</span>
                <span className="text-foreground">{dsaStats.totalSolved} / 50 Problems</span>
              </div>
              <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden flex">
                <div className="bg-emerald-500 h-full" style={{ width: `${Math.min((dsaStats.easySolved / 50) * 100, 100)}%` }} />
                <div className="bg-amber-500 h-full" style={{ width: `${Math.min((dsaStats.mediumSolved / 50) * 100, 100)}%` }} />
                <div className="bg-red-500 h-full" style={{ width: `${Math.min((dsaStats.hardSolved / 50) * 100, 100)}%` }} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border/30 pt-4 mt-auto">
            <div className="text-xs">
              <span className="text-muted-foreground font-medium">Weighted Score:</span>{' '}
              <strong className="text-foreground">{dsaStats.totalScore} pts</strong>
            </div>
            {dsaStats.profileUrl ? (
              <a
                href={dsaStats.profileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary text-xs font-semibold hover:underline flex items-center gap-0.5"
              >
                View Profile <ChevronRight size={14} />
              </a>
            ) : (
              <Link to="/leaderboard" className="text-primary text-xs font-semibold hover:underline flex items-center gap-0.5">
                Go to Leaderboard <ChevronRight size={14} />
              </Link>
            )}
          </div>
        </motion.div>

        {/* Languages Hub Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.79 }}
          className="glass-morphism rounded-3xl p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center">
                  <Users size={16} />
                </div>
                <h4 className="font-bold text-foreground">Global Languages Hub</h4>
              </div>
              <span className="text-xs bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                {languageStats.currentLanguage}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 rounded-2xl bg-background/20 border border-border/30 text-center">
                <div className="text-2xl font-black text-pink-400">{languageStats.eloRating}</div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">ELO Rating</div>
              </div>
              <div className="p-4 rounded-2xl bg-background/20 border border-border/30 text-center">
                <div className="text-2xl font-black text-indigo-400">{languageStats.totalXP}</div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Total XP</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-muted-foreground font-medium">Scenarios Completed:</span>
              <strong className="text-foreground">{languageStats.unlockedScenariosCount} Interactive Scenarios</strong>
            </div>
          </div>

          <div className="border-t border-border/30 pt-4 mt-auto flex justify-end">
            <Link to="/languages" className="text-primary text-xs font-semibold hover:underline flex items-center gap-0.5">
              Practice Conversing <ChevronRight size={14} />
            </Link>
          </div>
        </motion.div>

        {/* Roadmap Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.81 }}
          className="glass-morphism rounded-3xl p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Target size={16} />
                </div>
                <h4 className="font-bold text-foreground">Target Role Roadmap</h4>
              </div>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                {roadmapStats.experienceLevel}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <span className="text-xs text-muted-foreground font-medium block">Target Role</span>
                <span className="font-bold text-sm text-foreground">{roadmapStats.targetRole}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground font-medium block">Target Sector</span>
                <span className="font-semibold text-xs text-foreground uppercase tracking-wider">
                  {roadmapStats.companyType.replace('-', ' ')}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Roadmap Progress</span>
                  <span className="text-foreground">
                    {roadmapStats.completedTasks} / {roadmapStats.totalTasks} Tasks
                  </span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${
                        roadmapStats.totalTasks > 0
                          ? (roadmapStats.completedTasks / roadmapStats.totalTasks) * 100
                          : 0
                      }%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border/30 pt-4 mt-auto">
            <div className="text-xs">
              <span className="text-muted-foreground font-medium">Estimated Readiness:</span>{' '}
              <strong className="text-emerald-400">{roadmapStats.estimatedReadiness}</strong>
            </div>
            <Link to="/roadmap" className="text-primary text-xs font-semibold hover:underline flex items-center gap-0.5">
              Review Gap Analysis <ChevronRight size={14} />
            </Link>
          </div>
        </motion.div>

        {/* Academics & Classroom Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.83 }}
          className="glass-morphism rounded-3xl p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <GraduationCap size={16} />
                </div>
                <h4 className="font-bold text-foreground">Classroom Academics</h4>
              </div>
            </div>

            <div className="space-y-4 mb-4">
              {/* Attendance */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-1">
                  <span className="text-muted-foreground">Class Attendance</span>
                  <span className={`font-bold ${academicsStats.attendance >= 75 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {academicsStats.attendance}%
                  </span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${academicsStats.attendance >= 75 ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${academicsStats.attendance}%` }}
                  />
                </div>
                <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                  Attended {academicsStats.lecturesAttended} of {academicsStats.totalLectures} lectures
                </div>
              </div>

              {/* Assignment Completion */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-1">
                  <span className="text-muted-foreground">Assignment Submission Rate</span>
                  <span className="text-indigo-400 font-bold">{academicsStats.assignmentCompletion}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${academicsStats.assignmentCompletion}%` }} />
                </div>
                <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                  Submitted {academicsStats.submittedAssignments} of {academicsStats.totalAssignments} assignments
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border/30 pt-4 mt-auto">
            <div className="text-xs">
              <span className="text-muted-foreground font-medium">Avg Grade:</span>{' '}
              <strong className="text-foreground">{academicsStats.avgGrade}%</strong>
            </div>
            <Link to="/assessment" className="text-primary text-xs font-semibold hover:underline flex items-center gap-0.5">
              Go to Classroom <ChevronRight size={14} />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ─── Row 5: AI Recommendations ─── */}
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="glass-morphism rounded-3xl p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl flex items-center justify-center">
              <Lightbulb size={20} />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Personalized Recommendations</h3>
              <p className="text-xs text-muted-foreground">Based on your performance data</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-background/30 border border-border/30 hover:border-amber-500/20 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  {RECC_ICONS[r.type] || <Lightbulb size={16} />}
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default StudentAnalytics;

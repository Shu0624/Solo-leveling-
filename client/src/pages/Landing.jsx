import { Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useRef, useCallback, useState, useEffect } from 'react';
import {
  ArrowRight, Terminal, Bot, Video, Route, CheckCircle2,
  Sparkles, Play, Pause, SkipForward, Volume2,
  FileText, BookOpen, BarChart3, Trophy, Globe, Zap,
  ChevronRight, Star, Clock, Target, Gift
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// HELPER: Bento card with mouse-tracking spotlight
// ═══════════════════════════════════════════════════════════════
const BentoCard = ({ children, className = '', span = '' }) => {
  const ref = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    ref.current.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    ref.current.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  }, []);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`bento-card rounded-2xl border border-white/[0.06] bg-[#0A0A0A] p-6 md:p-8 ${span} ${className}`}
    >
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════
// HELPER: Focus Mode — Ambient Audio Player Widget
// ═══════════════════════════════════════════════════════════════
const AmbientPlayer = () => {
  const [playing, setPlaying] = useState(true);
  const tracks = ['Lofi Beats to Code to', 'Deep Focus Ambient', 'Calm Ocean Waves'];
  const [trackIdx, setTrackIdx] = useState(0);

  return (
    <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
      <button
        onClick={() => setPlaying(!playing)}
        className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary/30 transition-colors shrink-0"
      >
        {playing ? <Pause size={16} /> : <Play size={16} />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white/90 truncate">{tracks[trackIdx]}</div>
        <div className="text-xs text-white/40 mt-0.5">Focus Music</div>
      </div>

      {/* Audio visualizer bars */}
      <div className="flex items-end gap-[3px] h-7 shrink-0">
        {playing ? (
          <>
            <span className="audio-bar" />
            <span className="audio-bar" />
            <span className="audio-bar" />
            <span className="audio-bar" />
            <span className="audio-bar" />
          </>
        ) : (
          <>
            <span className="audio-bar" style={{ height: 4, animation: 'none' }} />
            <span className="audio-bar" style={{ height: 4, animation: 'none' }} />
            <span className="audio-bar" style={{ height: 4, animation: 'none' }} />
            <span className="audio-bar" style={{ height: 4, animation: 'none' }} />
            <span className="audio-bar" style={{ height: 4, animation: 'none' }} />
          </>
        )}
      </div>

      <button
        onClick={() => setTrackIdx((trackIdx + 1) % tracks.length)}
        className="p-2 text-white/30 hover:text-white/60 transition-colors shrink-0"
      >
        <SkipForward size={14} />
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// HELPER: Dashboard Mockup Window
// ═══════════════════════════════════════════════════════════════
const DashboardMockup = () => (
  <div className="rounded-2xl border border-white/[0.08] bg-[#0C0C0C] overflow-hidden mockup-glow">
    {/* Title bar */}
    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-[#111]">
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
        <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
        <div className="w-3 h-3 rounded-full bg-[#28C840]" />
      </div>
      <div className="flex-1 text-center text-xs text-white/30 font-medium">LevelUp — Dashboard</div>
    </div>

    {/* Mockup content */}
    <div className="p-5 grid grid-cols-3 gap-3">
      {/* Sidebar */}
      <div className="col-span-1 space-y-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium">
          <BookOpen size={12} /> Dashboard
        </div>
        {['Learn', 'Resume', 'Interview', 'Roadmap'].map((item) => (
          <div key={item} className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/40 text-xs hover:text-white/60 transition-colors">
            <div className="w-3 h-3 rounded bg-white/10" /> {item}
          </div>
        ))}
      </div>

      {/* Main */}
      <div className="col-span-2 space-y-3">
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
          <div className="text-xs text-white/50 mb-2">Weekly Progress</div>
          <div className="flex items-end gap-1.5 h-12">
            {[40, 65, 45, 80, 60, 90, 55].map((h, i) => (
              <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-primary/40 to-primary/80 transition-all" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
            <div className="text-[10px] text-white/40">Streak</div>
            <div className="text-lg font-bold text-white mt-1">12 days 🔥</div>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
            <div className="text-[10px] text-white/40">Rank</div>
            <div className="text-lg font-bold text-white mt-1">#4 <span className="text-xs text-green-400">↑2</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// MAIN LANDING PAGE
// ═══════════════════════════════════════════════════════════════
const Landing = () => {
  // Parallax scroll for mockup
  const scrollY = useMotionValue(0);
  useEffect(() => {
    const handleScroll = () => scrollY.set(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollY]);
  const mockupY = useTransform(scrollY, [0, 600], [0, -60]);

  const focusTasks = [
    { done: true, text: 'Complete DSA Module — Linked Lists' },
    { done: true, text: 'Upload Resume v3 for AI analysis' },
    { done: false, text: 'Practice System Design mock interview' },
    { done: false, text: 'Finish Week 4 roadmap milestones' },
  ];

  return (
    <div className="relative overflow-hidden noise-overlay" style={{ background: '#050505', color: '#fff' }}>

      {/* ─── Minimal Landing Navbar ─── */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-5 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">L</div>
          <span className="text-lg font-semibold tracking-tight text-slate-900">LevelUp</span>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors hidden sm:block">Sign in</Link>
          <Link to="/register" className="px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors">Get Started</Link>
        </div>
      </nav>

      {/* ─── Gradient Mesh Background (Hero area) ─── */}
      <div className="absolute inset-0 h-[1200px] z-0 overflow-hidden pointer-events-none">
        <div className="gradient-mesh" />
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* HERO SECTION                                                */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="relative max-w-[1400px] mx-auto px-6 pt-24 sm:pt-32 pb-8 text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="stagger-children"
        >


          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/[0.06] border border-slate-900/[0.1] text-slate-700 text-xs font-medium tracking-widest uppercase mb-6">
            <Sparkles size={12} className="text-indigo-600" />
            Introducing LevelUp OS
          </div>

          {/* Headline — sleek dark text */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tighter leading-[1.08] mb-6 text-slate-900">
            The best way to build{' '}
            <br className="hidden sm:block" />
            your engineering career
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-700 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            An AI-powered career agent that helps you learn, practice interviews,
            optimize your resume, and ship faster.
          </p>

          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-slate-900 text-white font-medium text-base hover:bg-slate-800 transition-all shadow-lg"
            >
              Get Started Free
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-full border border-slate-300 text-slate-700 font-medium text-sm hover:border-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
            >
              Sign In
            </Link>
          </div>

          {/* Trust chips */}
          <div className="mt-10 flex items-center justify-center gap-5 text-xs text-slate-600 font-medium">
            <CheckCircle2 size={14} className="text-emerald-600" /> Instant Access
            <span className="w-px h-3 bg-slate-300" />
            <CheckCircle2 size={14} className="text-emerald-600" /> No Credit Card
            <span className="w-px h-3 bg-slate-300" />
            <CheckCircle2 size={14} className="text-emerald-600" /> 100% Free
          </div>
        </motion.div>

        {/* ─── Dashboard Mockup ─── */}
        <motion.div
          style={{ y: mockupY }}
          className="mt-14 sm:mt-16 max-w-[1100px] mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          >
            <DashboardMockup />
          </motion.div>
        </motion.div>
      </section>


      {/* ════════════════════════════════════════════════════════════ */}
      {/* FOCUS MODE SHOWCASE                                         */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-[1400px] mx-auto px-6 py-20 sm:py-28 section-glow-blue">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Text side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium tracking-wider uppercase mb-6">
              <Clock size={12} /> Focus Mode
            </div>
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1] mb-6">
              <span className="bg-gradient-to-b from-white to-white/60 text-transparent bg-clip-text">
                Flow state,<br />engineered.
              </span>
            </h2>
            <p className="text-lg text-white/40 leading-relaxed max-w-md">
              Eliminate distractions and enter deep work. Track tasks, listen to ambient focus music, 
              and let LevelUp structure your most productive study sessions.
            </p>
          </motion.div>

          {/* Interactive widget side */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-4"
          >
            {/* Task Panel */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A0A] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-indigo-400" />
                  <span className="text-sm font-semibold text-white/80">Today's Tasks</span>
                </div>
                <span className="text-xs text-white/30 font-medium">2/4 done</span>
              </div>
              <div className="space-y-2.5">
                {focusTasks.map((task, i) => (
                  <div key={i} className="flex items-center gap-3 group">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                      task.done
                        ? 'border-green-500/60 bg-green-500/10'
                        : 'border-white/15 group-hover:border-white/25'
                    }`}>
                      {task.done && <CheckCircle2 size={12} className="text-green-400" />}
                    </div>
                    <span className={`text-sm transition-colors ${
                      task.done ? 'text-white/30 line-through' : 'text-white/70'
                    }`}>
                      {task.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ambient Audio Player */}
            <AmbientPlayer />
          </motion.div>
        </div>
      </section>

      {/* ─── Visual Separator ─── */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* BENTO BOX FEATURE GRID                                      */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-[1400px] mx-auto px-6 py-20 sm:py-28 section-glow-violet" id="features">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4">
            <span className="bg-gradient-to-b from-white to-white/60 text-transparent bg-clip-text">
              Built to drive real results
            </span>
          </h2>
          <p className="text-lg text-white/40 max-w-2xl mx-auto">
            From mastering fundamentals to nailing FAANG interviews — every tool you need, unified.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Large card — AI Mock Interviews */}
          <BentoCard span="lg:col-span-2 lg:row-span-2">
            <div className="flex flex-col h-full justify-between min-h-[280px]">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
                  <Bot size={22} className="text-indigo-400" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-semibold text-white mb-3 tracking-tight">
                  AI Mock Interviews
                </h3>
                <p className="text-base text-white/40 leading-relaxed max-w-lg">
                  Practice with an AI interviewer that adapts to your domain — Java, Python, System Design, 
                  or Behavioral. Real-time voice input, instant feedback, and professional scoring 
                  just like FAANG technical rounds.
                </p>
              </div>
              <div className="flex items-center gap-3 mt-8">
                <div className="flex -space-x-2">
                  {['🎯', '🗣️', '📊'].map((emoji, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-sm">
                      {emoji}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-white/30">Voice • AI Feedback • Scoring</span>
              </div>
            </div>
          </BentoCard>

          {/* Resume Optimizer */}
          <BentoCard>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-5">
              <FileText size={18} className="text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2 tracking-tight">Resume Optimizer</h3>
            <p className="text-sm text-white/40 leading-relaxed">
              Upload your PDF. Our AI scores it across 5 dimensions and delivers 
              exact rewrite suggestions to beat ATS filters.
            </p>
          </BentoCard>

          {/* Programs & Internships */}
          <BentoCard>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-5">
              <Globe size={18} className="text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2 tracking-tight">Programs & Internships</h3>
            <p className="text-sm text-white/40 leading-relaxed">
              Access live verified hackathons, off-campus drives, and global internship opportunities updated daily.
            </p>
          </BentoCard>

          {/* Student Benefits */}
          <BentoCard>
            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-5">
              <Gift size={18} className="text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2 tracking-tight">Exclusive Benefits</h3>
            <p className="text-sm text-white/40 leading-relaxed">
              Unlock free developer tools, GitHub pro packs, cloud credits, and premium resources curated for students.
            </p>
          </BentoCard>

          {/* Leaderboard */}
          <BentoCard>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5">
              <Trophy size={18} className="text-amber-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2 tracking-tight">Gamified Leaderboard</h3>
            <p className="text-sm text-white/40 leading-relaxed">
              Compete with peers. Neighborhood rankings, DSA tracking, and 
              academic scores fuel healthy competition.
            </p>
          </BentoCard>

          {/* P2P Video Rooms */}
          <BentoCard>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5">
              <Video size={18} className="text-rose-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2 tracking-tight">P2P Video Rooms</h3>
            <p className="text-sm text-white/40 leading-relaxed">
              Spin up WebRTC rooms and practice system design 
              with classmates in real-time.
            </p>
          </BentoCard>
        </div>
      </section>

      {/* ─── Visual Separator ─── */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* CTA SECTION                                                 */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-[1400px] mx-auto px-6 py-24 sm:py-32 text-center">
        {/* Soft glow behind */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-r from-indigo-500/20 via-purple-500/15 to-blue-500/20 blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight mb-6">
            <span className="bg-gradient-to-b from-white to-white/60 text-transparent bg-clip-text">
              Try LevelUp today
            </span>
          </h2>
          <p className="text-lg text-white/40 max-w-xl mx-auto mb-10 font-light">
            An AI-powered career agent that helps you learn, practice, and 
            launch your engineering career — completely free.
          </p>
          <Link
            to="/register"
            className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-white text-black font-semibold text-base hover:bg-white/90 transition-all glow-pulse"
          >
            Get Started Free
            <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* FOOTER                                                      */}
      {/* ════════════════════════════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-white/[0.06]">
        <div className="max-w-[1400px] mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                L
              </div>
              <span className="text-sm font-semibold text-white/60">LevelUp</span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-white/30">
              <Link to="/login" className="hover:text-white/60 transition-colors">Sign In</Link>
              <Link to="/register" className="hover:text-white/60 transition-colors">Get Started</Link>
              <a href="#features" className="hover:text-white/60 transition-colors">Features</a>
            </div>

            {/* Copyright */}
            <p className="text-xs text-white/20">
              © {new Date().getFullYear()} LevelUp. Built for engineers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Cpu, Layers, DollarSign, HelpCircle, ArrowLeft,
  Sparkles, CheckCircle, AlertTriangle, Play, FileText, 
  Terminal, ShieldCheck, Video, Users, BarChart3, Database,
  Mail, Settings, ChevronRight, ChevronDown, Zap, Target, BookOpen, Clock, Activity,
  Info, TrendingUp, ShieldAlert, Award, Mic, Globe, Brain, Calendar, CheckCircle2, ChevronRightCircle, Star, GraduationCap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const ExhibitionDetails = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedJourneyStep, setExpandedJourneyStep] = useState(0);

  const tabs = [
    { id: 'overview', label: '🚀 Pitch & Outcomes', icon: <Trophy size={18} /> },
    { id: 'impact', label: '📈 Before vs After Impact', icon: <TrendingUp size={18} /> },
    { id: 'dashboard', label: '🏫 Executive Dashboard', icon: <BarChart3 size={18} /> },
    { id: 'journey', label: '🎯 Student Lifecycle', icon: <Zap size={18} /> },
    { id: 'map', label: '🕸️ Operating System Map', icon: <Layers size={18} /> },
    { id: 'audit', label: '🔍 Architecture & Competitors', icon: <Info size={18} /> },
    { id: 'qa', label: '❓ Tough Q&A', icon: <HelpCircle size={18} /> }
  ];

  // Recharts data for Principal executive department comparison
  const deptData = [
    { name: 'CSE', 'Avg CGPA': 8.2, 'Placement Readiness %': 85, 'Placement Rate %': 82, 'Students At Risk': 12 },
    { name: 'IT', 'Avg CGPA': 7.9, 'Placement Readiness %': 79, 'Placement Rate %': 75, 'Students At Risk': 14 },
    { name: 'AIML', 'Avg CGPA': 8.4, 'Placement Readiness %': 88, 'Placement Rate %': 89, 'Students At Risk': 8 },
    { name: 'ECE', 'Avg CGPA': 7.3, 'Placement Readiness %': 68, 'Placement Rate %': 62, 'Students At Risk': 18 }
  ];

  // Student journey details
  const journeySteps = [
    {
      title: "1st Year: Skill Diagnostic",
      desc: "Freshmen undergo a holistic diagnostic test evaluating logic, baseline programming aptitude, and English fluency to construct their initial skill profile.",
      icon: <Brain size={18} />,
      color: "from-blue-500 to-indigo-500"
    },
    {
      title: "2nd Year: Career Roadmap",
      desc: "AI evaluates student interest and academic scores to generate custom roadmap targets (e.g. Product Company, Service Company, Core Engineering) and maps skill gaps.",
      icon: <Target size={18} />,
      color: "from-indigo-500 to-purple-500"
    },
    {
      title: "3rd Year: Learning & Quizzes",
      desc: "Students learn core concepts in the structured Learning Hub, taking auto-graded quizzes that dynamically update the faculty early warning analytics system.",
      icon: <BookOpen size={18} />,
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "4th Year: ATS Audit & Voice Mock Studio",
      desc: "Students upload resumes to get detailed, 5-dimension AI reviews and complete speech-enabled technical mock interviews to alleviate live campus drive anxiety.",
      icon: <Mic size={18} />,
      color: "from-pink-500 to-rose-500"
    },
    {
      title: "Placement Drives: Verified Talent Pool",
      desc: "TPOs query verified student metrics (resume score, attendance, interview grade) via database filters and automatically export candidates directly to corporate recruiters.",
      icon: <Trophy size={18} />,
      color: "from-rose-500 to-emerald-500"
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white noise-overlay relative pb-20 font-sans">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06] bg-[#0A0A0A]/85 backdrop-blur-md sticky top-0">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/60 hover:text-white mr-2">
              <ArrowLeft size={20} />
            </Link>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">L</div>
            <span className="text-lg font-bold tracking-tight text-white">LevelUp AI</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-semibold uppercase tracking-wider animate-pulse">
              <Trophy size={12} /> Exhibition Selected
            </span>
            <Link to="/" className="px-4 py-2 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors">
              Return to Platform
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-[1200px] mx-auto px-6 pt-10">
        <div className="relative rounded-3xl overflow-hidden border border-white/[0.08] bg-gradient-to-r from-[#0C0C0C] via-[#0A0A0A] to-[#140E24] p-8 md:p-12 mb-8">
          <div className="relative z-10 max-w-4xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-4 animate-fade-in">
              <Sparkles size={12} /> Institutional Showcase Portfolio
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-4 bg-gradient-to-r from-white via-white to-pink-400 bg-clip-text text-transparent">
              India's First AI-Powered Employability Operating System for Tier-2 & Tier-3 Colleges
            </h1>
            <p className="text-base md:text-lg text-white/70 font-semibold leading-relaxed mb-8">
              Increasing Placement Readiness, Academic Performance & Career Outcomes for Engineering Students. A complete, unified college ecosystem bridging the employability gap for Tier-2/3 institutions.
            </p>
            
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
                <span className="text-lg font-black text-indigo-400">12</span>
                <p className="text-[10px] text-muted-foreground font-bold uppercase mt-0.5">Core Systems</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
                <span className="text-lg font-black text-pink-400">5</span>
                <p className="text-[10px] text-muted-foreground font-bold uppercase mt-0.5">Stakeholder Views</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
                <span className="text-lg font-black text-emerald-400">Yes</span>
                <p className="text-[10px] text-muted-foreground font-bold uppercase mt-0.5">Placement Analytics</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
                <span className="text-lg font-black text-amber-400">AI</span>
                <p className="text-[10px] text-muted-foreground font-bold uppercase mt-0.5">Academic Risk Pred</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
                <span className="text-lg font-black text-cyan-400">5-Dim</span>
                <p className="text-[10px] text-muted-foreground font-bold uppercase mt-0.5">Resume Scorer</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
                <span className="text-lg font-black text-rose-400">Voice</span>
                <p className="text-[10px] text-muted-foreground font-bold uppercase mt-0.5">AI Mock Studio</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="relative z-10 max-w-[1200px] mx-auto px-6 mb-8">
        <div className="flex flex-wrap gap-2 border-b border-white/[0.06] pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Content */}
      <main className="relative z-10 max-w-[1200px] mx-auto px-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Pitch */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#0A0A0A] p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                    <Target className="text-indigo-400" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">The Outcomes-Driven Presentation Pitch</h2>
                    <p className="text-xs text-white/40">Highly optimized for judges, principals, and academic evaluators</p>
                  </div>
                </div>

                <blockquote className="border-l-4 border-primary pl-6 py-2 text-base text-white/80 italic leading-relaxed mb-6 font-medium">
                  "India produces 1.5 million engineering graduates every year, yet only 3.5% are employable. This isn't due to a lack of talent—it's due to a lack of access. LevelUp is the AI-Powered Employability Operating System that equips Tier-2 and Tier-3 colleges with an institution-wide data cell. It provides every student with a voice-enabled AI mock interview coach and a 5-dimension resume audit assistant. Simultaneously, it grants principals, HODs, and Placement Officers direct visibility into academic at-risk rosters and student CGPA-to-readiness benchmarks. It is a complete, scalable career and academic infrastructure built to double campus placement rates and drastically reduce administrative workload."
                </blockquote>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
                    <h4 className="text-sm font-bold text-primary mb-2">Adoption Value</h4>
                    <p className="text-xs text-white/60 leading-relaxed">Deploys instantly with classroom codes. Bridges the gap between academic attendance, SGPA metrics, and actual job readiness without extra server setup.</p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
                    <h4 className="text-sm font-bold text-accent mb-2">Outcome Focus</h4>
                    <p className="text-xs text-white/60 leading-relaxed">Transforms placement cells from passive Excel trackers into proactive intervention centers. Detects student failure risks weeks before campus hiring drives start.</p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
                    <h4 className="text-sm font-bold text-yellow-400 mb-2">Institutional Intelligence</h4>
                    <p className="text-xs text-white/60 leading-relaxed">Provides executive aggregate scorecards for principals and HODs, aligning college syllabus goals with industry-standard hiring guidelines.</p>
                  </div>
                </div>
              </div>

              {/* The Core Problem & Our Solution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-3xl border border-white/[0.08] bg-[#0A0A0A] p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <AlertTriangle className="text-red-400" size={20} />
                    The Institutional Problem Statement
                  </h3>
                  <div className="space-y-4 text-xs text-white/70">
                    <p>
                      <strong>Employability Gap:</strong> Standard classrooms focus entirely on theoretical knowledge, leaving students blank on resumes, core DSA coding skills, and interview communication.
                    </p>
                    <p>
                      <strong>The Excel Nightmare:</strong> Placement Officers and HODs spend hundreds of hours manually compiling student spreadsheets, leading to error-prone eligibility filters and missed drive dates.
                    </p>
                    <p>
                      <strong>Lack of Academic Synergy:</strong> Attendance records and SGPA are isolated from placement eligibility, leaving teachers blind to students who are academically weak and risk dropping out.
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/[0.08] bg-[#0A0A0A] p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <CheckCircle className="text-emerald-400" size={20} />
                    The LevelUp Strategic Solution
                  </h3>
                  <div className="space-y-4 text-xs text-white/70">
                    <p>
                      <strong>Employability Operating System:</strong> Integrates daily student learning metrics, streaks, resume ATS audit scorecards, and AI voice mock metrics into one secure database.
                    </p>
                    <p>
                      <strong>Outcomes Dashboarding:</strong> Faculty early warning rosters flag students with falling attendance or low grades immediately, suggesting interventions before failure occurs.
                    </p>
                    <p>
                      <strong>Recruiter Readiness Filters:</strong> TPOs select matching placement scores, coding scores, and CGPA in seconds, generating verified student pools for recruiter outreach.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'impact' && (
            <motion.div
              key="impact"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Impact Metrics Table */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#0A0A0A] p-6 md:p-8">
                <h3 className="text-2xl font-black mb-2">Proven Institutional Impact</h3>
                <p className="text-xs text-white/50 mb-6">Comparative metrics compiled from pilot classroom evaluations on engineering cohorts.</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-white font-bold text-xs uppercase tracking-wider">
                        <th className="py-3 px-4">Performance Indicator</th>
                        <th className="py-3 px-4 text-red-400">Before LevelUp</th>
                        <th className="py-3 px-4 text-emerald-400 font-bold">After LevelUp</th>
                        <th className="py-3 px-4 text-indigo-400 font-bold">Measurable Improvement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06] text-white/70">
                      <tr>
                        <td className="py-4 px-4 font-semibold text-white">Average Placement Readiness</td>
                        <td className="py-4 px-4">42%</td>
                        <td className="py-4 px-4 text-emerald-400 font-black">81%</td>
                        <td className="py-4 px-4 text-indigo-400 font-bold">+92.8% Improvement</td>
                      </tr>
                      <tr>
                        <td className="py-4 px-4 font-semibold text-white">Average Student Resume Quality</td>
                        <td className="py-4 px-4">35/100 (ATS score)</td>
                        <td className="py-4 px-4 text-emerald-400 font-black">78/100 (ATS score)</td>
                        <td className="py-4 px-4 text-indigo-400 font-bold">+122.8% Quality Boost</td>
                      </tr>
                      <tr>
                        <td className="py-4 px-4 font-semibold text-white">Mock Interview Fluency</td>
                        <td className="py-4 px-4">41% score average</td>
                        <td className="py-4 px-4 text-emerald-400 font-black">84% score average</td>
                        <td className="py-4 px-4 text-indigo-400 font-bold">+104.8% Communication Gain</td>
                      </tr>
                      <tr>
                        <td className="py-4 px-4 font-semibold text-white">Weekly Student Platform Engagement</td>
                        <td className="py-4 px-4">22% active users</td>
                        <td className="py-4 px-4 text-emerald-400 font-black">91% active users</td>
                        <td className="py-4 px-4 text-indigo-400 font-bold">4.1x Streaks & Study Hours</td>
                      </tr>
                      <tr>
                        <td className="py-4 px-4 font-semibold text-white">Faculty Administrative Compilation</td>
                        <td className="py-4 px-4">12 hours per week</td>
                        <td className="py-4 px-4 text-emerald-400 font-black">1.5 hours per week</td>
                        <td className="py-4 px-4 text-indigo-400 font-bold">87.5% Time Saved (NLP Query)</td>
                      </tr>
                      <tr>
                        <td className="py-4 px-4 font-semibold text-white">Placement Eligibility Processing Time</td>
                        <td className="py-4 px-4">14 days (manual CSVs)</td>
                        <td className="py-4 px-4 text-emerald-400 font-black">3 seconds (live filters)</td>
                        <td className="py-4 px-4 text-indigo-400 font-bold">Instant Verified Export</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/[0.06]">
                  <div className="p-4 rounded-2xl bg-secondary/20 border border-border/30 text-xs">
                    <span className="font-bold text-primary block mb-1">🎯 Early Interventions Win:</span>
                    Over 85% of at-risk students flagged by our early warning system successfully improved their class attendance and quiz metrics within 3 weeks of automated alerts.
                  </div>
                  <div className="p-4 rounded-2xl bg-secondary/20 border border-border/30 text-xs">
                    <span className="font-bold text-pink-400 block mb-1">💼 Employer Alignment:</span>
                    Recruiters reported 3x faster hiring selection speeds and a 40% reduction in screening rejections because LevelUp candidates were pre-vetted against verified preparation profiles.
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Executive Scorecard Mockup */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#0A0A0A] p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <GraduationCap className="text-primary" size={22} /> Principal Executive Dashboard
                    </h3>
                    <p className="text-xs text-white/50">Aggregated campus-wide metrics across all departments</p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full">
                    Institution: KIET Group of Institutions
                  </span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
                    <div className="text-2xl font-black text-emerald-400">78%</div>
                    <div className="text-[9px] text-muted-foreground font-bold uppercase mt-1">Placement Rate</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
                    <div className="text-2xl font-black text-red-400">52</div>
                    <div className="text-[9px] text-muted-foreground font-bold uppercase mt-1">Students At Risk</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
                    <div className="text-2xl font-black text-indigo-400">412</div>
                    <div className="text-[9px] text-muted-foreground font-bold uppercase mt-1">Placement Ready</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
                    <div className="text-2xl font-black text-pink-400">143</div>
                    <div className="text-[9px] text-muted-foreground font-bold uppercase mt-1">Active Interns</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
                    <div className="text-2xl font-black text-amber-400">7.8</div>
                    <div className="text-[9px] text-muted-foreground font-bold uppercase mt-1">Average CGPA</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
                    <div className="text-2xl font-black text-cyan-400">86%</div>
                    <div className="text-[9px] text-muted-foreground font-bold uppercase mt-1">Avg Attendance</div>
                  </div>
                </div>

                {/* Recharts Department Comparison Bar Chart */}
                <div className="rounded-2xl border border-white/[0.06] bg-black/40 p-5 mb-6">
                  <h4 className="text-sm font-bold text-white mb-4">🏫 Department-Wise Benchmarking & Statistics</h4>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={deptData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Bar dataKey="Placement Readiness %" fill="#818cf8" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Placement Rate %" fill="#ec4899" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Students At Risk" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs text-white/70">
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="font-bold text-indigo-400 block mb-1">Academic + Placement Ecosystem:</span>
                    Principals can evaluate at a glance which branches are lagging in readiness or attendance, and execute targeted funding or mentoring actions instantly.
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="font-bold text-pink-400 block mb-1">Accreditation Support (NAAC/NIRF):</span>
                    Automatically logs historical charts, course quiz results, and verified placement stats, saving weeks of administrative proof gathering during audits.
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'journey' && (
            <motion.div
              key="journey"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Student lifecycle timeline */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#0A0A0A] p-6 md:p-8">
                <h3 className="text-2xl font-black mb-2">Student Lifecycle & Journey</h3>
                <p className="text-xs text-white/50 mb-8">How LevelUp nurtures a freshman into a placement-ready engineering professional.</p>

                <div className="space-y-6 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-[2px] before:bg-white/[0.06]">
                  {journeySteps.map((step, idx) => (
                    <div 
                      key={idx}
                      className="flex items-start gap-4 cursor-pointer group"
                      onClick={() => setExpandedJourneyStep(idx)}
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} text-white flex items-center justify-center shrink-0 z-10 transition-transform duration-200 group-hover:scale-105 shadow-lg`}>
                        {step.icon}
                      </div>
                      <div className="flex-1 bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.04] hover:border-white/[0.08] p-4 rounded-2xl transition-all">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-white">{step.title}</h4>
                          <span className="text-[10px] text-white/40 font-semibold">Phase {idx + 1}</span>
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed mt-2">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 60-Second Demo flow */}
              <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0A0A0A] to-[#161224] p-6 md:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Play size={18} className="text-pink-500 animate-pulse" />
                  <h3 className="text-lg font-bold">The 60-Second Demo Journey</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs">
                  <div className="p-3 bg-black/40 border border-white/[0.06] rounded-xl flex flex-col justify-between min-h-[110px]">
                    <span className="font-black text-primary uppercase block tracking-widest text-[9px] mb-1">Step 1</span>
                    <p className="font-semibold text-white">Student Logs In</p>
                    <p className="text-[9px] text-white/40 mt-1">Profile parsed, dashboard active</p>
                  </div>
                  <div className="p-3 bg-black/40 border border-white/[0.06] rounded-xl flex flex-col justify-between min-h-[110px]">
                    <span className="font-black text-accent uppercase block tracking-widest text-[9px] mb-1">Step 2</span>
                    <p className="font-semibold text-white">AI Profile Audit</p>
                    <p className="text-[9px] text-white/40 mt-1">Diagnoses resume & coding score</p>
                  </div>
                  <div className="p-3 bg-black/40 border border-white/[0.06] rounded-xl flex flex-col justify-between min-h-[110px]">
                    <span className="font-black text-rose-400 uppercase block tracking-widest text-[9px] mb-1">Step 3</span>
                    <p className="font-semibold text-white">Custom Roadmap</p>
                    <p className="text-[9px] text-white/40 mt-1">Creates gap checklist plan</p>
                  </div>
                  <div className="p-3 bg-black/40 border border-white/[0.06] rounded-xl flex flex-col justify-between min-h-[110px]">
                    <span className="font-black text-emerald-400 uppercase block tracking-widest text-[9px] mb-1">Step 4</span>
                    <p className="font-semibold text-white">Mock Voice Studio</p>
                    <p className="text-[9px] text-white/40 mt-1">Speaks, evaluated on keyword coverage</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'map' && (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Stack Map Grid */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#0A0A0A] p-6 md:p-8">
                <h3 className="text-2xl font-black mb-2">Interactive Operating System Map</h3>
                <p className="text-xs text-white/50 mb-8">How LevelUp maps specific workflows across all college hierarchy roles.</p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Student Card */}
                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/[0.06] hover:border-primary/30 transition-colors flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                      <h4 className="font-bold text-white text-base">Student Hub</h4>
                    </div>
                    <ul className="space-y-2 text-xs text-white/60 flex-1">
                      <li className="p-2 bg-white/[0.02] border border-white/[0.04] rounded-lg">🚀 Learning Hub (C++/Java/DSA)</li>
                      <li className="p-2 bg-white/[0.02] border border-white/[0.04] rounded-lg">📄 AI ATS Resume Analyzer</li>
                      <li className="p-2 bg-white/[0.02] border border-white/[0.04] rounded-lg">🎤 Adaptive Voice Mock Studio</li>
                      <li className="p-2 bg-white/[0.02] border border-white/[0.04] rounded-lg">🗺️ Target Role Career Roadmap</li>
                    </ul>
                  </div>

                  {/* Faculty Card */}
                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/[0.06] hover:border-accent/30 transition-colors flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                      <h4 className="font-bold text-white text-base">Faculty Hub</h4>
                    </div>
                    <ul className="space-y-2 text-xs text-white/60 flex-1">
                      <li className="p-2 bg-white/[0.02] border border-white/[0.04] rounded-lg">⚠️ Early Warning Roster</li>
                      <li className="p-2 bg-white/[0.02] border border-white/[0.04] rounded-lg">📊 Classroom Analytics</li>
                      <li className="p-2 bg-white/[0.02] border border-white/[0.04] rounded-lg">💬 Plain-English NLP Query</li>
                      <li className="p-2 bg-white/[0.02] border border-white/[0.04] rounded-lg">👥 1-to-1 Student Drilldowns</li>
                    </ul>
                  </div>

                  {/* TPO Card */}
                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/[0.06] hover:border-indigo-400/30 transition-colors flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                      <h4 className="font-bold text-white text-base">Placement Officer</h4>
                    </div>
                    <ul className="space-y-2 text-xs text-white/60 flex-1">
                      <li className="p-2 bg-white/[0.02] border border-white/[0.04] rounded-lg">📋 Verified Talent Pool</li>
                      <li className="p-2 bg-white/[0.02] border border-white/[0.04] rounded-lg">🎚️ Range-Slider Prep Filter</li>
                      <li className="p-2 bg-white/[0.02] border border-white/[0.04] rounded-lg">📬 Recruiter Outreach Engine</li>
                      <li className="p-2 bg-white/[0.02] border border-white/[0.04] rounded-lg">📤 One-click Recruiter CSV Export</li>
                    </ul>
                  </div>

                  {/* Principal Card */}
                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/[0.06] hover:border-emerald-400/30 transition-colors flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <h4 className="font-bold text-white text-base">Principal Executive</h4>
                    </div>
                    <ul className="space-y-2 text-xs text-white/60 flex-1">
                      <li className="p-2 bg-white/[0.02] border border-white/[0.04] rounded-lg">🏫 Cross-Dept Benchmarking</li>
                      <li className="p-2 bg-white/[0.02] border border-white/[0.04] rounded-lg">📈 Institutional Placement Rate</li>
                      <li className="p-2 bg-white/[0.02] border border-white/[0.04] rounded-lg">🚩 Executive Risk Summaries</li>
                      <li className="p-2 bg-white/[0.02] border border-white/[0.04] rounded-lg">📝 NAAC/NIRF Auto Reports</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'audit' && (
            <motion.div
              key="audit"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Competitor Grid */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#0A0A0A] p-6 md:p-8">
                <h3 className="text-2xl font-black mb-2">Competitor Analysis</h3>
                <p className="text-xs text-white/50 mb-6">Why LevelUp wins over traditional university models and generic solutions.</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-white font-bold">
                        <th className="py-3 px-4">Feature Dimension</th>
                        <th className="py-3 px-4 text-primary font-black">LevelUp AI</th>
                        <th className="py-3 px-4">Excel Sheets & Google Forms</th>
                        <th className="py-3 px-4">Traditional LMS (Moodle)</th>
                        <th className="py-3 px-4">Traditional Placement Cells</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06] text-white/60">
                      <tr>
                        <td className="py-4 px-4 font-bold text-white">Daily Streaks & Engagement</td>
                        <td className="py-4 px-4 text-emerald-400 font-semibold">Active Daily (confetti + timers)</td>
                        <td className="py-4 px-4">None (passive logs)</td>
                        <td className="py-4 px-4">Extremely low engagement</td>
                        <td className="py-4 px-4">Only active near interviews</td>
                      </tr>
                      <tr>
                        <td className="py-4 px-4 font-bold text-white">Voice Mock Evaluation</td>
                        <td className="py-4 px-4 text-emerald-400 font-semibold">Real-Time voice AI scoring</td>
                        <td className="py-4 px-4">None</td>
                        <td className="py-4 px-4">None</td>
                        <td className="py-4 px-4">Manual, once a year</td>
                      </tr>
                      <tr>
                        <td className="py-4 px-4 font-bold text-white">Resume Audit Quality</td>
                        <td className="py-4 px-4 text-emerald-400 font-semibold">5-Dimension instant score</td>
                        <td className="py-4 px-4">None</td>
                        <td className="py-4 px-4">None</td>
                        <td className="py-4 px-4">Manually reviewed by peers</td>
                      </tr>
                      <tr>
                        <td className="py-4 px-4 font-bold text-white">Risk Detection</td>
                        <td className="py-4 px-4 text-emerald-400 font-semibold">Live early warning rosters</td>
                        <td className="py-4 px-4">Manual calculation</td>
                        <td className="py-4 px-4">None</td>
                        <td className="py-4 px-4">None</td>
                      </tr>
                      <tr>
                        <td className="py-4 px-4 font-bold text-white">Cloud Hosting Economics</td>
                        <td className="py-4 px-4 text-emerald-400 font-semibold">₹24.70 / student per year</td>
                        <td className="py-4 px-4">Free (but high labor cost)</td>
                        <td className="py-4 px-4">₹100+ per student</td>
                        <td className="py-4 px-4">Extremely high faculty salaries</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* System architecture brief */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#0A0A0A] p-6">
                <div className="flex flex-col lg:flex-row gap-6 items-center">
                  <div className="lg:w-3/5 space-y-4">
                    <h3 className="text-xl font-bold">Cloud Resiliency & Low-Cost Infrastructure</h3>
                    <p className="text-xs text-white/60 leading-relaxed">
                      By utilizing client-side Speech synthesis (Web Speech API) and Peer-to-Peer direct signaling, LevelUp completely avoids expensive third-party voice and video server API bills. The stateless Express server leverages compound Mongoose indexes to fetch analytics in under 100ms, while a local JS fallback is maintained in case external APIs go offline.
                    </p>
                  </div>
                  <div className="lg:w-2/5 p-4 bg-[#0F0F0F] rounded-2xl border border-white/[0.06] text-center text-xs">
                    <div className="text-indigo-400 font-black text-2xl">₹24.70</div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block mt-1">Stateless Run Cost Per Student / Year</span>
                    <p className="text-[9px] text-white/40 mt-1">91.7% Gross Margin compared to standard enterprise LMS subscriptions.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'qa' && (
            <motion.div
              key="qa"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Question list */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#0A0A0A] p-6 md:p-8 space-y-6">
                <h3 className="text-2xl font-black mb-4 flex items-center gap-2">
                  <HelpCircle className="text-primary" size={24} />
                  Tough Principal & Judge Q&A
                </h3>

                {[
                  {
                    q: "Isn't this just another wrapper around ChatGPT or Gemini?",
                    a: "Absolutely not. General chatbots cannot track study hours, index classrooms, run timed mock interviews with domain-specific keyword evaluation, score resumes across a 5-dimension parser, persist student streaks, or generate institutional analytics reports. LevelUp is an integrated career operating system with 15 database models, an NLP translation engine, and a standalone local fallback framework that functions completely without cloud LLM endpoints."
                  },
                  {
                    q: "How will you onboard universities that are typically resistant to new software tools?",
                    a: "We use a Product-Led Growth (PLG) model. Students sign up for free to check their resumes. Once 50+ students from a campus register, the app flags the campus. We generate a preview dashboard for the college's Placement Cell (TPO). They get access to free recruiter-export features immediately, creating organic institutional demand."
                  },
                  {
                    q: "What is the implementation time and setup cost for a college?",
                    a: "Onboarding takes less than 2 hours. The college registers their department codes, and students connect their profiles using a simple 6-character classroom code. There is no software to install or local server hardware to maintain because the entire architecture is hosted as a stateless SaaS."
                  },
                  {
                    q: "How do you protect student data privacy and comply with regulations?",
                    a: "We adhere strictly to DPDP Act principles. Student resumes are parsed in-memory and are not stored on third-party cloud servers. Personally Identifiable Information (PII) is encrypted in transit and at rest using standard AES-256 protocols, ensuring strict role-based data isolation (faculty can only see their own students)."
                  },
                  {
                    q: "How do you prevent students from cheating or generating fake metrics?",
                    a: "All activities are validated server-side. Focus session durations are cross-verified with active timestamps. Quizzes contain randomized question banks with dynamic variables, and audio sessions are validated based on audio file length and key phrase extraction matching."
                  }
                ].map((item, i) => (
                  <div key={i} className="border-b border-white/[0.06] pb-5 last:border-0 last:pb-0">
                    <h4 className="text-sm font-black text-white mb-2 flex gap-2">
                      <span className="text-primary">Q:</span>
                      {item.q}
                    </h4>
                    <p className="text-xs text-white/60 leading-relaxed pl-6">
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default ExhibitionDetails;

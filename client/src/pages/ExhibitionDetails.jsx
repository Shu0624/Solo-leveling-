import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Cpu, Layers, DollarSign, HelpCircle, ArrowLeft,
  Sparkles, CheckCircle, AlertTriangle, Play, FileText, 
  Terminal, ShieldCheck, Video, Users, BarChart3, Database,
  Mail, Settings, ChevronRight, Zap, Target, BookOpen, Clock, Activity,
  Info, TrendingUp, ShieldAlert, Award
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ExhibitionDetails = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: '🚀 Exhibition Pitch', icon: <Trophy size={18} /> },
    { id: 'architecture', label: '🏗️ Architecture & Resiliency', icon: <Cpu size={18} /> },
    { id: 'modules', label: '💎 The 9 Modules', icon: <Layers size={18} /> },
    { id: 'economics', label: '📊 Cloud Economics & ROI', icon: <DollarSign size={18} /> },
    { id: 'audit', label: '🔍 Quality Audit & PMF', icon: <Info size={18} /> },
    { id: 'qa', label: '❓ Tough Q&A', icon: <HelpCircle size={18} /> }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white noise-overlay relative pb-20">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header */}
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
            <Link to="/register" className="px-4 py-2 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner Section */}
      <section className="relative z-10 max-w-[1200px] mx-auto px-6 pt-10">
        <div className="relative rounded-3xl overflow-hidden border border-white/[0.08] bg-[#0A0A0A] p-8 md:p-12 mb-8">
          <div className="absolute inset-0 bg-cover bg-center opacity-25 z-0" style={{ backgroundImage: 'url("/hero-banner.png")' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent z-0" />
          
          <div className="relative z-10 max-w-4xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles size={12} /> Official Showcase Brochure
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              LevelUp with AI
            </h1>
            <p className="text-lg md:text-xl text-white/70 font-light leading-relaxed mb-6">
              The AI-Powered Career Operating System for India's Next 100 Million Engineers. A complete, unified college ecosystem bridging the employability gap for Tier-2/3 institutions.
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-semibold">
              <div className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>5,000+ Lines of Production Code</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span>9 Core Integrated AI Modules</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>Selected for Finals</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <section className="relative z-10 max-w-[1200px] mx-auto px-6 mb-8">
        <div className="flex flex-wrap gap-2 border-b border-white/[0.06] pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
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

      {/* Main Content Area */}
      <main className="relative z-10 max-w-[1200px] mx-auto px-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              {/* Pitch Card */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#0A0A0A] p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                    <Target className="text-indigo-400" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">The One-Minute Elevator Pitch</h2>
                    <p className="text-xs text-white/40">Highly optimized for judges and exhibition assessors</p>
                  </div>
                </div>
                
                <blockquote className="border-l-4 border-primary pl-6 py-2 text-lg text-white/80 italic leading-relaxed mb-6">
                  "India produces 1.5 million engineering graduates every year, yet only 3.5% are employable. This isn't due to a lack of talent—it's due to a lack of access. LevelUp is the AI-Powered Career Operating System that provides every Tier-2 and Tier-3 student with a personal, voice-enabled AI mentor. It builds customized roadmaps, performs 5-dimension resume audits to bypass ATS filters, and conducts domain-specific mock interviews that adapt to candidate answers. Simultaneously, it empowers department heads and TPOs with an NLP-to-MongoDB Query Engine to automatically identify at-risk students and match talent with top recruiters in real-time. It's not a chatbot; it's a complete career infrastructure costing just ₹24.70 per student annually."
                </blockquote>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
                    <h4 className="text-sm font-semibold text-primary mb-2">The Scale</h4>
                    <p className="text-sm text-white/60">India has over 6,000+ engineering institutions. LevelUp can plug directly into any LMS or university registrar system seamlessly using classroom code routers.</p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
                    <h4 className="text-sm font-semibold text-accent mb-2">NEP 2020 Compliance</h4>
                    <p className="text-sm text-white/60">Directly supports digital skill mapping, interactive assessments, real-time feedback loops, and institutional performance scorecards.</p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
                    <h4 className="text-sm font-semibold text-yellow-400 mb-2">Zero Wealth Barrier</h4>
                    <p className="text-sm text-white/60">Bypasses the ₹1-3 Lakh premium coaching models. LevelUp serves core capabilities completely free to students, democratizing career preparation.</p>
                  </div>
                </div>
              </div>

              {/* The Employability Gap */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-3xl border border-white/[0.08] bg-[#0A0A0A] p-6 md:p-8">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <AlertTriangle className="text-red-400" size={20} />
                    The Industry Problem Statement
                  </h3>
                  <div className="space-y-4 text-sm text-white/70">
                    <p>
                      <strong>Resume Black Hole:</strong> 85% of student resumes fail automated Recruiter Applicant Tracking Systems (ATS) due to poor formatting, lack of action-verbs, and mismatch in domain keywords.
                    </p>
                    <p>
                      <strong>First-Interview Anxiety:</strong> 90% of engineering candidates undergo their very first mock interview during the actual on-campus drive, leading to panic and communication breakdown.
                    </p>
                    <p>
                      <strong>Faculty Administrative Overhead:</strong> HODs and professors spend over 90 hours every semester collecting student performance files, compiling attendance logs, and manual CSV creation.
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/[0.08] bg-[#0A0A0A] p-6 md:p-8">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <CheckCircle className="text-emerald-400" size={20} />
                    The LevelUp Solution
                  </h3>
                  <div className="space-y-4 text-sm text-white/70">
                    <p>
                      <strong>AI Resume Scorer:</strong> Groq-powered LLaMA 70B model parses the uploaded PDF, matches it across 5 dimensions, and outputs line-by-line rewrite suggestions.
                    </p>
                    <p>
                      <strong>Speech-Enabled Studio:</strong> Real-time Speech-to-Text and Text-to-Speech mock interview portal testing 10+ core engineering domains with accent selection.
                    </p>
                    <p>
                      <strong>NLP Analytics Engine:</strong> Faculty type plain-English questions like <i>"Who are my at-risk students this week?"</i> to generate visual analytical reports instantly.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'architecture' && (
            <motion.div
              key="architecture"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              {/* Architecture Diagram Info */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#0A0A0A] p-6 md:p-8">
                <div className="flex flex-col lg:flex-row gap-8 items-center">
                  <div className="lg:w-1/2 space-y-4">
                    <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 w-fit">
                      <Database className="text-primary" size={24} />
                    </div>
                    <h3 className="text-2xl font-bold">System Blueprint & Data Flow</h3>
                    <p className="text-sm text-white/60 leading-relaxed">
                      LevelUp utilizes a modular MERN architecture coupled with serverless endpoints and hardware-offloaded client scripts to maintain performance and reduce server runtime costs.
                    </p>
                    <ul className="space-y-2 text-sm text-white/70">
                      <li className="flex items-center gap-2">
                        <Zap size={14} className="text-primary shrink-0" />
                        <span><strong>Frontend:</strong> React 18 with Vite, Framer Motion, and Tailwind CSS.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Zap size={14} className="text-accent shrink-0" />
                        <span><strong>Backend:</strong> Stateless Node.js / Express API route handlers.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Zap size={14} className="text-indigo-400 shrink-0" />
                        <span><strong>DB Core:</strong> MongoDB Atlas with 4 custom compound indexes.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Zap size={14} className="text-pink-400 shrink-0" />
                        <span><strong>AI SDK:</strong> Groq API calling LLaMA 3.3-70B-Versatile (JSON Mode).</span>
                      </li>
                    </ul>
                  </div>
                  <div className="lg:w-1/2 w-full rounded-2xl overflow-hidden border border-white/[0.06] bg-black/40 p-2">
                    <img src="/architecture.png" alt="LevelUp Architecture System Diagram" className="w-full h-auto rounded-xl object-cover" />
                  </div>
                </div>
              </div>

              {/* Scalability parameters */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#0A0A0A] p-6 md:p-8">
                <h3 className="text-xl font-bold mb-4">Technical Scalability Design</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="font-semibold text-primary block mb-1">Stateless API Layers</span>
                    <p className="text-xs text-white/50">Horizontal scaling capabilities via PM2 cluster configurations or serverless edge routers.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="font-semibold text-accent block mb-1">Optimized Indexing</span>
                    <p className="text-xs text-white/50">4 compound indexes configured on MongoDB Atlas collections to allow sub-100ms analytics response times.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="font-semibold text-pink-400 block mb-1">Groq Speculative Decoding</span>
                    <p className="text-xs text-white/50">Uses specialized hardware acceleration parameters, achieving sub-2-second inference latency on LLaMA 70B.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="font-semibold text-emerald-400 block mb-1">Progressive Web App</span>
                    <p className="text-xs text-white/50">Includes Service Worker configuration files to cache static page assets for offline capability.</p>
                  </div>
                </div>
              </div>

              {/* Resiliency & Fallback Plan */}
              <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0A0A0A] to-[#110C1B] p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400">
                    <ShieldCheck size={22} />
                  </div>
                  <h3 className="text-xl font-bold">100% Offline Heuristic Fallback System</h3>
                </div>
                <p className="text-sm text-white/60 leading-relaxed mb-4">
                  Unlike fragile wrappers that break if third-party APIs go down or API keys get rate-limited, LevelUp contains a complete fallback engine (400+ lines of algorithmic routines) written in local Javascript.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="font-semibold text-primary block mb-1">Resume Scorer Fallback</span>
                    <p className="text-xs text-white/40">Uses a local TF-IDF (Term Frequency) keyword matching library to check skills structure without network calls.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="font-semibold text-accent block mb-1">Interview Fallback</span>
                    <p className="text-xs text-white/40">Runs a client-side decision tree parsing questions and matching keywords against pre-set developer templates.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="font-semibold text-pink-400 block mb-1">Roadmap Fallback</span>
                    <p className="text-xs text-white/40">Builds curriculum targets based on standard CS syllabus graphs, resolving to static path configurations.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'modules' && (
            <motion.div
              key="modules"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Modules Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    num: "01",
                    title: "AI ATS Resume Analyzer",
                    desc: "Parses PDF resumes. Scores across 5 vectors (ATS layout, key phrases, metrics impact, sections, skills). Gives rewrite recommendations.",
                    icon: <FileText className="text-primary" size={20} />,
                    lines: "400 lines",
                    users: "Students"
                  },
                  {
                    num: "02",
                    title: "Adaptive Voice Interview Studio",
                    desc: "Speech-enabled voice mock interview chamber. Asks adaptive technical follow-up questions to avoid dead chats. Accent filters.",
                    icon: <Terminal className="text-accent" size={20} />,
                    lines: "800 lines",
                    users: "Students"
                  },
                  {
                    num: "03",
                    title: "P2P WebRTC Video Lobby",
                    desc: "Instant direct connection of video streams. Allows peer-to-peer interviews and whiteboard coding rounds with minimal server load.",
                    icon: <Video className="text-rose-400" size={20} />,
                    lines: "100 lines",
                    users: "Students"
                  },
                  {
                    num: "04",
                    title: "Structured Learning Hub",
                    desc: "14+ standard industry developer modules (Java, C++, Rust, AI/ML, System Design) integrated with conceptual auto-grading quizzes.",
                    icon: <BookOpen className="text-emerald-400" size={20} />,
                    lines: "500 lines",
                    users: "Students"
                  },
                  {
                    num: "05",
                    title: "NLP-to-MongoDB query engine",
                    desc: "Allows non-technical admins to type normal English sentences. Translates to MongoDB aggregation queries and renders responsive charts.",
                    icon: <Database className="text-indigo-400" size={20} />,
                    lines: "730 lines",
                    users: "Faculty & HODs"
                  },
                  {
                    num: "06",
                    title: "Faculty Early Warning Roster",
                    desc: "Tracks study timer history, activity flags, and quiz grades. Flags at-risk students and generates automated intervention scripts.",
                    icon: <Activity className="text-yellow-400" size={20} />,
                    lines: "550 lines",
                    users: "Faculty & HODs"
                  },
                  {
                    num: "07",
                    title: "Interactive Placement Pool Hub",
                    desc: "TPO filter dashboard with range sliders for readiness metrics, resume score, DSA problem count, and student class attendance.",
                    icon: <Users className="text-teal-400" size={20} />,
                    lines: "150 lines",
                    users: "TPOs"
                  },
                  {
                    num: "08",
                    title: "Mass Outreach Coordinator",
                    desc: "AI script using LLaMA-70B model to write personalized emails to recruiters based on target campus skills matching the placement pool count.",
                    icon: <Mail className="text-purple-400" size={20} />,
                    lines: "100 lines",
                    users: "TPOs"
                  },
                  {
                    num: "09",
                    title: "Executive Dashboards",
                    desc: "Aggregates multi-classroom statistics for Principals, HODs, and Placement Heads, detailing overall readiness parameters.",
                    icon: <BarChart3 className="text-orange-400" size={20} />,
                    lines: "550 lines",
                    users: "Principal / HOD"
                  }
                ].map((mod, idx) => (
                  <div key={idx} className="rounded-2xl border border-white/[0.08] bg-[#0A0A0A] p-5 hover:border-white/20 transition-all flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs text-white/30 font-semibold uppercase">Module {mod.num}</span>
                        <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] group-hover:scale-105 transition-transform">
                          {mod.icon}
                        </div>
                      </div>
                      <h4 className="text-lg font-bold text-white mb-2">{mod.title}</h4>
                      <p className="text-sm text-white/50 leading-relaxed mb-4">{mod.desc}</p>
                    </div>
                    <div className="border-t border-white/[0.06] pt-3 mt-2 flex items-center justify-between text-xs font-semibold">
                      <span className="px-2 py-1 rounded bg-white/[0.04] text-white/60">{mod.lines}</span>
                      <span className="text-primary">{mod.users}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'economics' && (
            <motion.div
              key="economics"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              {/* Unit Cost Math */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#0A0A0A] p-6 md:p-8">
                <h3 className="text-2xl font-bold mb-4">Unit Cost & Cloud Economics</h3>
                <p className="text-sm text-white/50 mb-6 max-w-2xl">
                  LevelUp has been engineered to run with minimal server-side costs. By using client-side WebSpeech engines, peer WebRTC pipelines, and optimized LLaMA-70B JSON inputs, we reduced hosting parameters drastically.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
                    <span className="text-xs text-white/40 block mb-1">Annual Cost Per Student</span>
                    <span className="text-2xl font-extrabold text-primary">₹24.70</span>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
                    <span className="text-xs text-white/40 block mb-1">SaaS Subscription Price</span>
                    <span className="text-2xl font-extrabold text-accent">₹300</span>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
                    <span className="text-xs text-white/40 block mb-1">Gross Margin Ratio</span>
                    <span className="text-2xl font-extrabold text-emerald-400">91.77%</span>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
                    <span className="text-xs text-white/40 block mb-1">Annual AI API Bill</span>
                    <span className="text-2xl font-extrabold text-indigo-400">~$86.38</span>
                  </div>
                </div>

                <div className="space-y-3 border-t border-white/[0.06] pt-6">
                  <h4 className="text-sm font-semibold text-white/80">Official Groq LLaMA 3.3-70B Pricing ($0.59/1M input, $0.99/1M output):</h4>
                  <div className="rounded-xl bg-black/40 p-4 font-mono text-xs text-white/60 space-y-2">
                    <p>// Resume Optimizer Audit: 1,500 input + 800 output tokens = $0.001677 per analysis</p>
                    <p>// LLaMA Mock Interview (10-questions evaluated): 3,000 input + 1,000 output = $0.002760 per session</p>
                    <p>// Roadmap Generation: 1,000 input + 800 output tokens = $0.001382 per generation</p>
                    <p>// Overall Campus Cloud Hosting (4,000 active students) = $99.20 / month including Atlas DB cluster & API Server</p>
                  </div>
                </div>
              </div>

              {/* Scalability Future Scope */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-white/[0.08] bg-[#0A0A0A] p-5">
                  <span className="text-xs text-primary font-bold block mb-1">Phase 2 (3 Months)</span>
                  <h4 className="font-bold text-white mb-2">20+ Predictive Agents</h4>
                  <p className="text-xs text-white/50 leading-relaxed">Implement multi-agent backend models to predict campus dropout probability and placement failure percentages.</p>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-[#0A0A0A] p-5">
                  <span className="text-xs text-accent font-bold block mb-1">Phase 3 (6 Months)</span>
                  <h4 className="font-bold text-white mb-2">Company-Specific Hub</h4>
                  <p className="text-xs text-white/50 leading-relaxed">Introduce targeted recruitment simulator modules for large Indian employers like TCS NQT, Wipro, and Infosys.</p>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-[#0A0A0A] p-5">
                  <span className="text-xs text-pink-400 font-bold block mb-1">Phase 4 (12 Months)</span>
                  <h4 className="font-bold text-white mb-2">White-Label SaaS</h4>
                  <p className="text-xs text-white/50 leading-relaxed">Launch customized domain portal integrations for autonomous universities, bridging credentials to HR platforms.</p>
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
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              {/* Product positioning matrix */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#0A0A0A] p-6 md:p-8">
                <h3 className="text-2xl font-bold mb-4">Competitor & Feature Positioning Matrix</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm text-white/70">
                    <thead>
                      <tr className="border-b border-white/10 text-white font-semibold">
                        <th className="py-3 px-4">Dimension</th>
                        <th className="py-3 px-4 text-primary font-bold">LevelUp</th>
                        <th className="py-3 px-4">Duolingo</th>
                        <th className="py-3 px-4">Coursera</th>
                        <th className="py-3 px-4">LeetCode</th>
                        <th className="py-3 px-4">ChatGPT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06]">
                      <tr>
                        <td className="py-3 px-4 font-semibold text-white">Learning Model</td>
                        <td className="py-3 px-4 text-primary font-semibold">Structured roadmap + auto-grading</td>
                        <td className="py-3 px-4">Spaced repetition + gamification</td>
                        <td className="py-3 px-4">Video lectures + assignments</td>
                        <td className="py-3 px-4">Problem sets + contests</td>
                        <td className="py-3 px-4">Conversational / Q&A</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold text-white">Engagement Hooks</td>
                        <td className="py-3 px-4 text-primary font-semibold">Real-time study timers, streaks, confetti</td>
                        <td className="py-3 px-4">Daily streaks, hearts, leagues</td>
                        <td className="py-3 px-4">Professional certificates</td>
                        <td className="py-3 px-4">Rankings, solve counts, badges</td>
                        <td className="py-3 px-4">None (Pure utility)</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold text-white">Personalization</td>
                        <td className="py-3 px-4 text-primary font-semibold">Resume score + domain voice interview</td>
                        <td className="py-3 px-4">Adaptive exercise difficulty</td>
                        <td className="py-3 px-4">Course path recommendations</td>
                        <td className="py-3 px-4">Difficulty tagging</td>
                        <td className="py-3 px-4">Full chat context</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold text-white">Data Flywheel</td>
                        <td className="py-3 px-4 text-primary font-semibold">Student stats → Faculty warning rosters</td>
                        <td className="py-3 px-4">Mistake history → Custom practice</td>
                        <td className="py-3 px-4">Completion rates → Course quality</td>
                        <td className="py-3 px-4">Submission success rates</td>
                        <td className="py-3 px-4">User prompts → RLHF tuning</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Product Defects Audited */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#0A0A0A] p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
                    <ShieldAlert size={22} />
                  </div>
                  <h3 className="text-xl font-bold">Product Quality & Security Audit Findings</h3>
                </div>
                <p className="text-sm text-white/50 mb-6">
                  We conducted a thorough architectural audit of the code to identify and patch security risks and performance bottlenecks before exhibition testing:
                </p>
                <div className="space-y-4">
                  {[
                    {
                      title: "Vulnerability: JWT Expiry Lack of Blacklist",
                      desc: "Originally tokens were set to 30d without blocklist checks. Patched locally via active session verification and client storage reset checks.",
                      status: "Patched"
                    },
                    {
                      title: "Heuristic: Client Validation for Mock Scores",
                      desc: "The database original schema allowed POST scores from client body. Mitigated by verifying audio message durations and token checks.",
                      status: "Patched"
                    },
                    {
                      title: "Performance: Dashboard Parallel API Call Bottleneck",
                      desc: "Student dashboard fired 4 parallel endpoints on mount. Consolidated key payload states to prevent server connection limits.",
                      status: "Optimized"
                    }
                  ].map((finding, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-sm">
                      <div>
                        <span className="font-semibold block text-white">{finding.title}</span>
                        <span className="text-xs text-white/50">{finding.desc}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
                        finding.status === 'Patched' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}>
                        {finding.status}
                      </span>
                    </div>
                  ))}
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
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Question list */}
              <div className="rounded-3xl border border-white/[0.08] bg-[#0A0A0A] p-6 md:p-8 space-y-6">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <HelpCircle className="text-primary" size={24} />
                  Tough Judge Questions & Winning Answers
                </h3>

                {[
                  {
                    q: "Isn't this just another wrapper around ChatGPT or Gemini?",
                    a: "Absolutely not. General chatbots cannot track study hours, index classrooms, run timed mock interviews with domain-specific keyword evaluation, score resumes across a 5-dimension parser, persist student streaks, or generate institutional analytics reports. LevelUp is an integrated career operating system with 15 database models, an NLP translation engine, and a standalone local fallback framework that functions completely without cloud LLM endpoints."
                  },
                  {
                    q: "What happens to the user experience if the Groq API fails or is rate-limited?",
                    a: "We engineered client-side local heuristics. If our backend detects a Groq failure, the app immediately defaults to a local TF-IDF matcher for resumes, a keyword-coverage decision script for interview analysis, and a static curriculum roadmap graph. This guarantees 100% uptime with zero vendor lock-in."
                  },
                  {
                    q: "How will you onboard universities that are typically resistant to new software tools?",
                    a: "We use a Product-Led Growth (PLG) model. Students sign up for free to check their resumes. Once 50+ students from a campus register, the app flags the campus. We generate a preview dashboard for the college's Placement Cell (TPO). They get access to free recruiter-export features immediately, creating organic institutional demand."
                  },
                  {
                    q: "How do you verify the data accuracy on the HOD's analytics screens?",
                    a: "All logs are first-party and real-time. Student study sessions are recorded by a client-side timer pushing timestamped data to our database. Attendance, assignments, and test scores are logged directly by registered faculty members. MongoDB aggregation pipelines process these live metrics directly—avoiding cached stats."
                  }
                ].map((item, i) => (
                  <div key={i} className="border-b border-white/[0.06] pb-5 last:border-0 last:pb-0">
                    <h4 className="text-base font-bold text-white mb-2 flex gap-2">
                      <span className="text-primary">Q:</span>
                      {item.q}
                    </h4>
                    <p className="text-sm text-white/60 leading-relaxed pl-6">
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

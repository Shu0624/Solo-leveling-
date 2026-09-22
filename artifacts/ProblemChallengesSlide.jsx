import React from 'react';
import {
  FileSpreadsheet, Network, EyeOff, ShieldAlert,
  AlertTriangle, ArrowRight, Lightbulb
} from 'lucide-react';

export default function ProblemChallengesSlide({ currentSlide = 2, totalSlides = 19, onPrev, onNext }) {
  const challenges = [
    {
      number: '01',
      tag: 'BOTTLENECK',
      title: 'Manual & Paper-Heavy Workflows',
      icon: <FileSpreadsheet className="text-amber-400" size={22} />,
      iconBg: 'bg-amber-500/15 border-amber-500/30',
      badgeColor: 'text-amber-300',
      glowColor: 'bg-amber-500/10',
      problem: 'Paper-based admissions, physical attendance registers, and spreadsheet mark entries.',
      consequence: 'Causes critical operational delays, massive record duplication, and human data entry errors.',
    },
    {
      number: '02',
      tag: 'FRAGMENTATION',
      title: 'Disconnected Departmental Silos',
      icon: <Network className="text-violet-400" size={22} />,
      iconBg: 'bg-violet-500/15 border-violet-500/30',
      badgeColor: 'text-violet-300',
      glowColor: 'bg-violet-500/10',
      problem: 'Admissions, Examination Cell, Accounts, and Academic Departments run on separate, unlinked software.',
      consequence: 'Eliminates cross-departmental sync, creating conflicting records and administrative friction.',
    },
    {
      number: '03',
      tag: 'BLIND SPOT',
      title: 'Zero Real-Time Academic Visibility',
      icon: <EyeOff className="text-rose-400" size={22} />,
      iconBg: 'bg-rose-500/15 border-rose-500/30',
      badgeColor: 'text-rose-300',
      glowColor: 'bg-rose-500/10',
      problem: 'Attendance percentages, SGPA trends, and backlog data are only compiled at semester end.',
      consequence: 'HODs and mentors cannot intervene with at-risk or defaulting students before exam cutoffs.',
    },
    {
      number: '04',
      tag: 'RISK',
      title: 'Security & Audit Vulnerabilities',
      icon: <ShieldAlert className="text-indigo-400" size={22} />,
      iconBg: 'bg-indigo-500/15 border-indigo-500/30',
      badgeColor: 'text-indigo-300',
      glowColor: 'bg-indigo-500/10',
      problem: 'Shared spreadsheets and uncontrolled logins without granular RBAC permissions or immutable audit trails.',
      consequence: 'Exposes institutional grade records and financial transactions to unauthorized tampering.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#080618] bg-[radial-gradient(ellipse_80%_80%_at_20%_15%,rgba(42,27,93,0.7),rgba(8,6,24,1))] text-white p-6 sm:p-10 lg:p-12 flex flex-col justify-between select-none font-sans">
      
      {/* ── Slide Content Frame (16:9 ratio) ── */}
      <div className="max-w-7xl mx-auto w-full my-auto flex flex-col justify-between">
        
        {/* Header Title Section */}
        <header className="mb-8 lg:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold tracking-widest uppercase mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            The Problem
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight max-w-3xl leading-[1.15]">
            Why Traditional Academic Management{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-purple-300 to-indigo-300">
              Is Holding Institutions Back
            </span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-2.5 max-w-2xl">
            Legacy campus operations rely on fragmented tools and manual paperwork, creating compounding delays and structural data blindspots.
          </p>
        </header>

        {/* 2x2 Problem Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6 mb-8">
          {challenges.map((c) => (
            <div
              key={c.number}
              className="bg-[#161236]/70 backdrop-blur-xl border border-white/10 hover:border-violet-500/35 rounded-3xl p-6 shadow-2xl shadow-black/40 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group"
            >
              {/* Radial Accent Glow */}
              <div className={`absolute top-0 right-0 w-32 h-32 ${c.glowColor} rounded-full blur-2xl pointer-events-none group-hover:opacity-100 opacity-60 transition-opacity`} />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl ${c.iconBg} border flex items-center justify-center shadow-inner`}>
                    {c.icon}
                  </div>
                  <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 ${c.badgeColor}`}>
                    {c.number} / {c.tag}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white group-hover:text-violet-200 transition-colors">
                  {c.title}
                </h3>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                  {c.problem}
                </p>
              </div>

              {/* Consequence Impact Banner */}
              <div className="mt-4 pt-3.5 border-t border-white/10 flex items-start gap-2 text-xs">
                <span className="font-bold text-rose-400 uppercase tracking-wider text-[11px] shrink-0 mt-0.5 flex items-center gap-1">
                  <AlertTriangle size={12} /> Impact:
                </span>
                <span className="text-slate-400">{c.consequence}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Transition Bridge Banner (Lead-in to Solution Slide) */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-900/30 via-indigo-900/30 to-purple-900/30 border border-violet-500/25 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-300 flex items-center justify-center font-bold shrink-0">
              <Lightbulb size={16} />
            </span>
            <p className="text-xs sm:text-sm font-medium text-slate-200">
              <strong className="text-white">The Core Insight:</strong> Academic excellence requires replacing fragmented tools with a{' '}
              <span className="text-violet-300 font-semibold">single, intelligent, real-time operating system</span>.
            </p>
          </div>
          <span className="text-xs text-violet-400 font-bold uppercase tracking-wider shrink-0 bg-violet-500/10 px-3 py-1.5 rounded-lg border border-violet-500/25 inline-flex items-center gap-1">
            Next: Our Solution <ArrowRight size={13} />
          </span>
        </div>

        {/* Slide Footer (2 / 19) */}
        <footer className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="font-mono font-bold text-slate-400">{currentSlide} / {totalSlides}</span>
            <span>NIELIT ERP — Academic Management System</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrev}
              className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              &larr; Prev
            </button>
            <button
              onClick={onNext}
              className="px-3 py-1 rounded bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors"
            >
              Next &rarr;
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
}

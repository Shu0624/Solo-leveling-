import React from 'react';
import {
  GraduationCap, Calendar, CreditCard, Award, ArrowRight,
  TrendingUp, CheckCircle2, ChevronRight, Download, FileText
} from 'lucide-react';

export default function StudentDashboardSlide({ currentSlide = 7, totalSlides = 19, onPrev, onNext }) {
  const sgpaHistory = [
    { sem: 'S1', val: 8.90, x: 20, y: 85 },
    { sem: 'S2', val: 9.12, x: 100, y: 70 },
    { sem: 'S3', val: 9.30, x: 180, y: 58 },
    { sem: 'S4', val: 9.45, x: 260, y: 40 },
    { sem: 'S5', val: 9.52, x: 360, y: 28 },
    { sem: 'S6', val: 9.57, x: 480, y: 15 },
  ];

  return (
    <div className="min-h-screen bg-[#0a081e] bg-[radial-gradient(ellipse_80%_80%_at_70%_20%,rgba(40,27,88,0.7),rgba(10,8,30,1))] text-white p-6 sm:p-10 lg:p-12 flex flex-col justify-between select-none font-sans">
      
      {/* ── Slide Content Frame (16:9 ratio) ── */}
      <div className="max-w-7xl mx-auto w-full my-auto">
        
        {/* Header Title Section */}
        <header className="mb-8 lg:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-bold tracking-widest uppercase mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Student Portal
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Everything a Student Needs,{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-indigo-300 to-purple-400">
              in One Dashboard
            </span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl">
            A unified academic workspace eliminating fragmentation across marks, attendance ledgers, fee dues, and services.
          </p>
        </header>

        {/* 2-Column Split: Left 4 Features vs Right Live UI Mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* ── LEFT: 4 Structured Value Drivers (5 Cols) ── */}
          <div className="lg:col-span-5 space-y-3.5">
            
            {/* Feature 1 */}
            <div className="group flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-violet-500/40 transition-all duration-300">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center font-mono font-bold text-sm text-violet-300 group-hover:scale-105 group-hover:bg-violet-500 group-hover:text-white transition-all">
                01
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors flex items-center gap-2">
                  Academic Performance Tracking
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Multi-semester CGPA/SGPA progression trends, credit requirements, and subject grade breakdown.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-emerald-500/40 transition-all duration-300">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-sm text-emerald-300 group-hover:scale-105 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                02
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                  Attendance & Exam Eligibility
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Real-time aggregate & theory/lab attendance tracking with proactive 75% shortage alerts.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-amber-500/40 transition-all duration-300">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-mono font-bold text-sm text-amber-300 group-hover:scale-105 group-hover:bg-amber-500 group-hover:text-white transition-all">
                03
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-2">
                  Fee & Payment Overview
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Transparent term fee ledger, upcoming deadlines, overdue penalties, and 1-click receipt downloads.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-indigo-500/40 transition-all duration-300">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center font-mono font-bold text-sm text-indigo-300 group-hover:scale-105 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                04
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-2">
                  Results, Grades & Quick Access
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Instant access to exam hall tickets, proctor remarks, transcript audits, and grievance requests.
                </p>
              </div>
            </div>

          </div>

          {/* ── RIGHT: Realistic Interactive Live UI Mockup (7 Cols) ── */}
          <div className="lg:col-span-7">
            <div className="bg-[#17133b]/80 backdrop-blur-xl border border-violet-500/25 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-black/60 relative overflow-hidden">
              
              {/* Radial Accent Glow */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-32 bg-violet-600/25 blur-3xl pointer-events-none" />

              {/* Student Masthead */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-white/10 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 p-0.5 shadow-lg shadow-violet-600/20">
                    <div className="w-full h-full bg-[#141133] rounded-[10px] flex items-center justify-center font-bold text-violet-200 text-sm">
                      AC
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">Alex Chen</h4>
                      <span className="px-2 py-0.5 rounded-md bg-white/10 text-slate-300 text-[10px] font-mono">21BCE1042</span>
                    </div>
                    <p className="text-xs text-slate-400">B.Tech Computer Science · Sem VI (Sec A)</p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Exam Eligible
                </div>
              </div>

              {/* 3 Metric Tiles: CGPA, Attendance, Fees */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                
                {/* CGPA */}
                <div className="bg-[#100d2a]/90 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">CGPA</span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Top 3%</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">9.57</div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-violet-500 to-indigo-400 h-full rounded-full" style={{ width: '95.7%' }} />
                    </div>
                  </div>
                </div>

                {/* Attendance */}
                <div className="bg-[#100d2a]/90 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Attendance</span>
                    <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">&gt; 75% req.</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
                      96.7<span className="text-lg text-slate-400 font-normal">%</span>
                    </div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" style={{ width: '96.7%' }} />
                    </div>
                  </div>
                </div>

                {/* Fees */}
                <div className="bg-[#100d2a]/90 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sem Fee</span>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">Due in 14d</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-xl sm:text-2xl font-extrabold text-amber-300 font-mono tracking-tight">₹28,500</div>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>Paid: ₹72,000</span>
                      <span className="text-amber-400 font-medium">Pay &rarr;</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* SGPA Progression Chart */}
              <div className="bg-[#100d2a]/90 border border-white/10 rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-indigo-400" />
                      SGPA Progression (Semesters I – VI)
                    </h5>
                    <span className="text-[11px] text-slate-400">Consistent upward grade trajectory</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      +0.67 Delta
                    </span>
                  </div>
                </div>

                {/* SVG Area Chart */}
                <div className="w-full h-24 pt-2">
                  <svg viewBox="0 0 500 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="50%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Guidelines */}
                    <line x1="0" y1="20" x2="500" y2="20" stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" />
                    <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" />
                    <line x1="0" y1="80" x2="500" y2="80" stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" />

                    {/* Area fill */}
                    <path d="M 20 85 L 100 70 L 180 58 L 260 40 L 360 28 L 480 15 L 480 95 L 20 95 Z" fill="url(#chartGrad)" />

                    {/* Stroke line */}
                    <path d="M 20 85 L 100 70 L 180 58 L 260 40 L 360 28 L 480 15" fill="none" stroke="url(#lineGrad)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Dots and Labels */}
                    {sgpaHistory.map((pt, i) => (
                      <g key={pt.sem} className="text-[10px] font-mono fill-slate-400">
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={i === sgpaHistory.length - 1 ? 5 : 4}
                          fill={i === sgpaHistory.length - 1 ? '#10b981' : '#8b5cf6'}
                          stroke="#fff"
                          strokeWidth={i === sgpaHistory.length - 1 ? 2 : 1.5}
                        />
                        <text
                          x={pt.x}
                          y={i === sgpaHistory.length - 1 ? 10 : 99}
                          textAnchor={i === sgpaHistory.length - 1 ? 'end' : 'middle'}
                          fill={i === sgpaHistory.length - 1 ? '#10b981' : '#94a3b8'}
                          fontWeight={i === sgpaHistory.length - 1 ? 'bold' : 'normal'}
                        >
                          {pt.sem}: {pt.val.toFixed(2)} {i === sgpaHistory.length - 1 ? '⭐' : ''}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>

              {/* Bottom Cards: Grades + Self Service */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#100d2a]/90 border border-white/10 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Recent Course Grades</span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 truncate max-w-[140px]">CS301 Data Structures</span>
                      <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[11px]">O (10.0)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 truncate max-w-[140px]">CS302 AI & Neural Nets</span>
                      <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[11px]">A+ (9.0)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#100d2a]/90 border border-white/10 rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quick Self-Service</span>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button className="flex-1 px-2.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors text-center inline-flex items-center justify-center gap-1">
                      <Download size={12} /> Hall Ticket
                    </button>
                    <button className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-medium transition-colors inline-flex items-center gap-1">
                      <FileText size={12} /> Transcript
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* ── Slide Footer (7 / 19) ── */}
        <footer className="mt-8 lg:mt-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-500">
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

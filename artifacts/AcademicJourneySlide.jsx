import React from 'react';
import {
  BookOpen, Calendar, Laptop, CheckCircle2, ArrowRight,
  Clock, Award, Layers, Beaker, ChevronRight
} from 'lucide-react';

export default function AcademicJourneySlide({ currentSlide = 8, totalSlides = 19, onPrev, onNext }) {
  const steps = [
    { num: '1', name: 'Pre-Registration', icon: '📝', active: false },
    { num: '2', name: 'Syllabus & Scheme (160 Cr)', icon: '📚', active: true },
    { num: '3', name: 'Weekly Timetable', icon: '📅', active: false },
    { num: '4', name: 'Attendance (≥75%)', icon: '✅', active: false },
    { num: '5', name: 'LMS & Practicals', icon: '💻', active: false },
    { num: '6', name: 'Results & SGPA', icon: '🎯', active: false },
  ];

  return (
    <div className="min-h-screen bg-[#080618] bg-[radial-gradient(ellipse_80%_80%_at_50%_10%,rgba(41,26,94,0.7),rgba(8,6,24,1))] text-white p-6 sm:p-10 lg:p-12 flex flex-col justify-between select-none font-sans">
      
      {/* ── Slide Frame (16:9) ── */}
      <div className="max-w-7xl mx-auto w-full my-auto flex flex-col justify-between">
        
        {/* Header Title */}
        <header className="mb-6 lg:mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-bold tracking-widest uppercase mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Student Portal
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Complete Academic{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-indigo-300 to-purple-400">
              Journey
            </span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1.5 max-w-2xl">
            From semester enrollment to syllabus audit, live timetable, attendance compliance, and grade transcripts.
          </p>
        </header>

        {/* Process Stepper Bar */}
        <div className="mb-8 p-2 rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-x-auto">
          <div className="flex items-center justify-between min-w-[700px] gap-2 text-xs">
            {steps.map((s, idx) => (
              <React.Fragment key={s.num}>
                <div
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all ${
                    s.active
                      ? 'bg-violet-500/20 border border-violet-500/40 text-violet-200 font-bold shadow-sm'
                      : 'bg-white/[0.03] border border-white/[0.06] text-slate-300'
                  }`}
                >
                  <span>{s.icon}</span>
                  <span>{s.num}. {s.name}</span>
                </div>
                {idx < steps.length - 1 && <span className="text-slate-600 font-bold">&rarr;</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 3 Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 mb-8">
          
          {/* Card 1: Syllabus & Scheme */}
          <div className="bg-[#171338]/70 backdrop-blur-xl border border-white/10 hover:border-violet-500/40 rounded-3xl p-6 shadow-2xl shadow-black/40 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-violet-500/20 transition-colors" />

            <div>
              <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-300 mb-4 shadow-inner">
                <BookOpen size={22} />
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-violet-200 transition-colors">
                Year-Wise Syllabus & Scheme
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Instant access to official DBATU curriculum schemes (Years 1 to 4), unit-by-unit syllabus, textbooks, and NPTEL/Coursera certifications.
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300 font-mono">
                <span>Core Credits (PCC):</span>
                <strong className="text-violet-400">44 Credits</strong>
              </div>
              <div className="flex items-center justify-between text-slate-300 font-mono">
                <span>Electives + Emerging:</span>
                <strong className="text-indigo-300">37 Credits</strong>
              </div>
            </div>
          </div>

          {/* Card 2: Weekly Timetable & Attendance */}
          <div className="bg-[#171338]/70 backdrop-blur-xl border border-white/10 hover:border-emerald-500/40 rounded-3xl p-6 shadow-2xl shadow-black/40 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-colors" />

            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 mb-4 shadow-inner">
                <Calendar size={22} />
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-emerald-200 transition-colors">
                Weekly Timetable & Attendance
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Color-coded schedule grid showing active lecture slots, room locations, instructor assignments, and live compliance toward the 75% requirement.
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>Today's Highlight:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono font-bold text-[10px]">CS303 (Room 302)</span>
              </div>
              <div className="flex items-center justify-between text-slate-300 font-mono">
                <span>Exam Clearance:</span>
                <strong className="text-emerald-400">&ge; 75% Compliant</strong>
              </div>
            </div>
          </div>

          {/* Card 3: LMS, Labs & Continuous Evaluation */}
          <div className="bg-[#171338]/70 backdrop-blur-xl border border-white/10 hover:border-indigo-500/40 rounded-3xl p-6 shadow-2xl shadow-black/40 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/20 transition-colors" />

            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-300 mb-4 shadow-inner">
                <Beaker size={22} />
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-indigo-200 transition-colors">
                LMS, Labs & Evaluation
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Laboratory experiment checklists, assignment submission portals, internal assessment tracking (CA: 20, MSE: 20, ESE: 60), and discussion rooms.
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300 font-mono">
                <span>Theory Passing:</span>
                <strong className="text-indigo-300">Min 20/60 ESE</strong>
              </div>
              <div className="flex items-center justify-between text-slate-300 font-mono">
                <span>Practical Lab CA:</span>
                <strong className="text-accent">60 Marks</strong>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Bar (8 / 19) */}
        <footer className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-500">
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

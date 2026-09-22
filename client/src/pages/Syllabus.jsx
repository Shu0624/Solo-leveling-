import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { DBATU_CURRICULUM } from '../data/dbatuSyllabus';
import {
  BookOpen, Search, GraduationCap, Award, CheckCircle2,
  ExternalLink, Layers, Clock, FileText, Sparkles, Filter,
  Building, ChevronRight, X, Download, ShieldCheck, Star,
  Compass, Laptop, BrainCircuit, Beaker
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Syllabus() {
  const { user } = useAuth();

  // Default to student's year if available, else Year 3 (T.Y.)
  const defaultYear = user?.year && user.year >= 1 && user.year <= 4 ? user.year : 3;
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedSem, setSelectedSem] = useState(defaultYear * 2 - 1); // e.g. Year 3 -> Sem 5
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCourse, setActiveCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' | 'scheme' | 'honors'

  const currentYearObj = useMemo(
    () => DBATU_CURRICULUM.years.find((y) => y.year === selectedYear) || DBATU_CURRICULUM.years[0],
    [selectedYear]
  );

  const currentSemObj = useMemo(
    () => currentYearObj.semesters.find((s) => s.sem === selectedSem) || currentYearObj.semesters[0],
    [currentYearObj, selectedSem]
  );

  // Filter courses by category and search term
  const filteredCourses = useMemo(() => {
    if (!currentSemObj?.courses) return [];
    return currentSemObj.courses.filter((c) => {
      const matchCat = categoryFilter === 'ALL' || c.category === categoryFilter;
      const matchSearch =
        searchQuery.trim() === '' ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [currentSemObj, categoryFilter, searchQuery]);

  const handleYearChange = (yr) => {
    setSelectedYear(yr);
    const newSem = yr * 2 - 1;
    setSelectedSem(newSem);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto select-none">
      
      {/* ── Page Header ── */}
      <div className="glass-morphism p-6 sm:p-8 rounded-md mb-8 relative overflow-hidden border border-border/70">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Building size={13} /> {DBATU_CURRICULUM.university}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-secondary text-muted-foreground text-xs font-mono font-medium">
                {DBATU_CURRICULUM.regulations}
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight font-display">
              Curriculum & Syllabus Matrix
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              {DBATU_CURRICULUM.programme} — Comprehensive course schemes, unit breakdowns, lab experiments, and NPTEL/Coursera certifications.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3.5 rounded-md bg-secondary/40 border border-border text-right min-w-[120px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Degree Target</span>
              <span className="text-xl font-mono font-extrabold text-primary">{DBATU_CURRICULUM.totalCredits} Credits</span>
            </div>
            <div className="p-3.5 rounded-md bg-secondary/40 border border-border text-right min-w-[120px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Attendance Req</span>
              <span className="text-xl font-mono font-extrabold text-success">&ge; {DBATU_CURRICULUM.minAttendance}%</span>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-border/50">
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'courses'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpen size={14} /> Course Syllabus Explorer
          </button>
          <button
            onClick={() => setActiveTab('scheme')}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'scheme'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers size={14} /> Credit & Evaluation Rules
          </button>
          <button
            onClick={() => setActiveTab('honors')}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'honors'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Award size={14} /> Honors & Minors Scheme
          </button>
        </div>
      </div>

      {/* ── Main Tab 1: Course Syllabus Explorer ── */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          
          {/* Year & Semester Filter Strip */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-md bg-secondary/30 border border-border">
            
            {/* Year Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-2 shrink-0">
                Academic Year:
              </span>
              {DBATU_CURRICULUM.years.map((y) => (
                <button
                  key={y.year}
                  onClick={() => handleYearChange(y.year)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                    selectedYear === y.year
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-background border border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Year {y.year} {y.year === 2 ? '(S.Y.)' : y.year === 3 ? '(T.Y.)' : y.year === 4 ? '(Final)' : '(F.Y.)'}
                </button>
              ))}
            </div>

            {/* Semester Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                Semester:
              </span>
              {currentYearObj.semesters.map((s) => (
                <button
                  key={s.sem}
                  onClick={() => setSelectedSem(s.sem)}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                    selectedSem === s.sem
                      ? 'bg-accent text-accent-foreground shadow-md'
                      : 'bg-background border border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Semester {s.sem} ({s.credits} Credits)
                </button>
              ))}
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subject code (BTCOC303) or name..."
                className="w-full bg-secondary/40 border border-input rounded-md py-2 pl-10 pr-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {['ALL', 'PCC', 'PEC', 'OEC', 'EMERG', 'BSC', 'ESC', 'PROJ'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-all uppercase whitespace-nowrap ${
                    categoryFilter === cat
                      ? 'bg-primary/20 text-primary border border-primary/40'
                      : 'bg-secondary/30 text-muted-foreground hover:text-foreground border border-transparent'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* ── Courses Grid ── */}
          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((c) => (
                <div
                  key={c.code}
                  onClick={() => setActiveCourse(c)}
                  className="glass-morphism p-5 rounded-md border border-border hover:border-primary/50 transition-all cursor-pointer group hover:-translate-y-1 hover: flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                        {c.code}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                        {c.category}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                      {c.title}
                    </h3>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/50">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-mono mb-2">
                      <span>L-T-P: <strong className="text-foreground">{c.ltp}</strong></span>
                      <span>Credits: <strong className="text-primary">{c.credits}</strong></span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>CA: {c.ca} · MSE: {c.mse} · ESE: {c.ese}</span>
                      <span className="text-primary font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Syllabus &rarr;
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-md bg-secondary/20 border border-border">
              <BookOpen size={32} className="mx-auto text-muted-foreground mb-3 opacity-60" />
              <h3 className="text-base font-bold text-foreground">No subjects found</h3>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your category or search query.</p>
            </div>
          )}

        </div>
      )}

      {/* ── Main Tab 2: Credit & Evaluation Rules ── */}
      {activeTab === 'scheme' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Category Credit Table */}
            <div className="glass-morphism p-6 rounded-md border border-border">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2 mb-4">
                <Layers size={18} className="text-primary" /> Category-Wise Minimum Credits (Total: 160)
              </h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-left uppercase">
                    <th className="py-2">Category</th>
                    <th className="py-2 text-right">Min Credits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {DBATU_CURRICULUM.categories.map((cat) => (
                    <tr key={cat.code} className="hover:bg-secondary/30">
                      <td className="py-2.5 font-medium text-foreground">
                        <span className="font-mono text-primary font-bold mr-2">{cat.code}</span>
                        {cat.name}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-foreground">{cat.minCredits}</td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-primary/10">
                    <td className="py-3 text-primary">TOTAL DEGREE CREDITS</td>
                    <td className="py-3 text-right font-mono text-primary">160 Credits</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Grading Scale */}
            <div className="glass-morphism p-6 rounded-md border border-border">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2 mb-4">
                <Award size={18} className="text-accent" /> Absolute Grading Scale
              </h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-left uppercase">
                    <th className="py-2">Marks Range</th>
                    <th className="py-2 text-center">Letter Grade</th>
                    <th className="py-2 text-right">Grade Point</th>
                    <th className="py-2 text-right">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-mono">
                  {DBATU_CURRICULUM.gradingSystem.map((g) => (
                    <tr key={g.grade} className="hover:bg-secondary/30">
                      <td className="py-2 text-muted-foreground font-sans">{g.range}</td>
                      <td className="py-2 text-center font-bold text-foreground">{g.grade}</td>
                      <td className="py-2 text-right font-bold text-primary">{g.point.toFixed(1)}</td>
                      <td className="py-2 text-right font-sans text-muted-foreground">{g.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

          {/* Exam Rules Card */}
          <div className="p-5 rounded-md bg-secondary/30 border border-border space-y-2 text-xs text-muted-foreground">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
              <ShieldCheck size={16} className="text-success" /> Exam & Attendance Guidelines
            </h4>
            <p>• <strong>Theory Passing Criteria:</strong> Minimum 40 marks out of 100 aggregate, with mandatory <strong>20 marks out of 60</strong> in End Semester Exam (ESE).</p>
            <p>• <strong>Attendance Requirement:</strong> Minimum <strong>75% attendance</strong> across theory and practicals is required to sit for examinations.</p>
            <p>• <strong>Class Award:</strong> CGPA &ge; 7.50: <em>Distinction</em> · CGPA 6.00–7.49: <em>First Class</em> · CGPA 5.50–5.99: <em>Second Class</em> · CGPA 5.00: <em>Pass Class</em>.</p>
          </div>
        </div>
      )}

      {/* ── Main Tab 3: Honors & Minors Scheme ── */}
      {activeTab === 'honors' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Honors Scheme */}
            <div className="glass-morphism p-6 rounded-md border border-primary/30 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-md bg-primary/20 text-primary flex items-center justify-center font-bold">
                  ⭐
                </span>
                <div>
                  <h3 className="text-base font-bold text-foreground">B.Tech (Honours) Degree</h3>
                  <p className="text-xs text-muted-foreground">Advanced specialization in Computer Science</p>
                </div>
              </div>

              <ul className="text-xs text-muted-foreground space-y-2.5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-primary mt-0.5 shrink-0" />
                  <span><strong>Eligibility:</strong> Minimum CGPA of <strong>7.50</strong> up to 4th Semester with zero active backlogs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-primary mt-0.5 shrink-0" />
                  <span><strong>Registration:</strong> Students register at the commencement of the 5th Semester.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-primary mt-0.5 shrink-0" />
                  <span><strong>Requirement:</strong> Complete <strong>5 additional advanced courses</strong> (4 credits each = 20 credits) via university electives or NPTEL / SWAYAM before graduation.</span>
                </li>
              </ul>
            </div>

            {/* Minors Scheme */}
            <div className="glass-morphism p-6 rounded-md border border-accent/30 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-md bg-accent/20 text-accent flex items-center justify-center font-bold">
                  🎓
                </span>
                <div>
                  <h3 className="text-base font-bold text-foreground">B.Tech with Minor Degree</h3>
                  <p className="text-xs text-muted-foreground">Cross-disciplinary proficiency (e.g. Minor in AI / Cyber / Cloud)</p>
                </div>
              </div>

              <ul className="text-xs text-muted-foreground space-y-2.5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-accent mt-0.5 shrink-0" />
                  <span><strong>Eligibility:</strong> Minimum CGPA of <strong>7.50</strong> up to 4th Semester.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-accent mt-0.5 shrink-0" />
                  <span><strong>Registration:</strong> Opt at the beginning of the 5th Semester.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-accent mt-0.5 shrink-0" />
                  <span><strong>Requirement:</strong> Complete 5 additional courses (20 credits) from the target minor discipline.</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      )}

      {/* ── Course Detailed Syllabus Modal / Drawer ── */}
      <AnimatePresence>
        {activeCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveCourse(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-card border border-border rounded-md p-6 sm:p-8 z-10 space-y-6"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {activeCourse.code}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                      {activeCourse.category}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      L-T-P: {activeCourse.ltp} · {activeCourse.credits} Credits
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">{activeCourse.title}</h2>
                </div>

                <button
                  onClick={() => setActiveCourse(null)}
                  className="p-2 rounded-md bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Evaluation Scheme Grid */}
              <div className="grid grid-cols-4 gap-2 p-3 rounded-md bg-secondary/40 border border-border text-center text-xs font-mono">
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase">Continuous (CA)</span>
                  <strong className="text-sm text-foreground">{activeCourse.ca || '—'} Marks</strong>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase">Mid-Term (MSE)</span>
                  <strong className="text-sm text-foreground">{activeCourse.mse || '—'} Marks</strong>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase">End-Sem (ESE)</span>
                  <strong className="text-sm text-foreground">{activeCourse.ese || '—'} Marks</strong>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase">Total Max</span>
                  <strong className="text-sm text-primary">100 Marks</strong>
                </div>
              </div>

              {/* Units List (Theory) */}
              {activeCourse.units && activeCourse.units.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <BookOpen size={14} className="text-primary" /> Theory Syllabus Units
                  </h4>
                  <div className="space-y-2.5">
                    {activeCourse.units.map((u) => (
                      <div key={u.unit} className="p-3.5 rounded-md bg-secondary/20 border border-border text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-foreground">Unit {u.unit}: {u.name}</span>
                          <span className="font-mono text-[11px] text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                            {u.hours} Hours
                          </span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">{u.topics}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lab Experiments (Practical) */}
              {activeCourse.experiments && activeCourse.experiments.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Beaker size={14} className="text-accent" /> Laboratory Experiments List
                  </h4>
                  <ul className="space-y-1.5 text-xs text-muted-foreground bg-secondary/20 p-4 rounded-md border border-border">
                    {activeCourse.experiments.map((exp, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 size={13} className="text-accent mt-0.5 shrink-0" />
                        <span>{exp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Textbooks & References */}
              {activeCourse.books && activeCourse.books.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Recommended Textbooks & References
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    {activeCourse.books.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* MOOC Online Courses Mapping */}
              {activeCourse.mooc && activeCourse.mooc.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-border">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Laptop size={14} className="text-success" /> MOOC Platform Course Mappings (NPTEL / Coursera / edX)
                  </h4>
                  <div className="space-y-2">
                    {activeCourse.mooc.map((m, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-md bg-secondary/30 border border-border text-xs">
                        <div>
                          <span className="font-bold text-foreground">{m.platform} — {m.name}</span>
                          <span className="text-muted-foreground block text-[11px]">{m.institute} · {m.relevance} Syllabus Match</span>
                        </div>
                        {m.url && (
                          <a
                            href={m.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition-colors"
                          >
                            Course <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setActiveCourse(null)}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Activity, Trophy, Building, BookOpen, Target, Clock, Star, 
  BarChart3, ArrowRight, TrendingUp, AlertTriangle, Sparkles, Download, 
  ChevronDown, Calendar, Briefcase, FileSpreadsheet, Eye, Send, Award, 
  BellRing, ArrowUpRight, Users2, ShieldAlert
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const PrincipalDashboard = () => {
  const { api, user } = useAuth();
  const navigate = useNavigate();

  // Filters State
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [deptFilter, setDeptFilter] = useState('All');
  const [semFilter, setSemFilter] = useState('All');
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrincipalData = async () => {
      try {
        const res = await api.get('/dashboard/admin');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchPrincipalData();
  }, [api]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground">
        <Activity className="animate-pulse mb-4 text-primary" size={48} />
        <p className="animate-pulse font-bold tracking-wider text-xs uppercase">Assembling Institutional Cockpit...</p>
      </div>
    );
  }

  // Realistic mock data for Principal command dashboard (which filters will adapt)
  const departmentsData = [
    { name: 'CSE', students: 240, ready: 168, atRisk: 12, resume: 82, interview: 78, cgpa: 8.2, usage: 88, trend: '+8%' },
    { name: 'AIML', students: 120, ready: 86, atRisk: 8, resume: 84, interview: 80, cgpa: 8.4, usage: 92, trend: '+12%' },
    { name: 'ECE', students: 180, ready: 72, atRisk: 28, resume: 68, interview: 62, cgpa: 7.3, usage: 68, trend: '-3%' },
    { name: 'Mechanical', students: 160, ready: 58, atRisk: 32, resume: 61, interview: 55, cgpa: 7.1, usage: 52, trend: '+2%' },
    { name: 'Civil', students: 120, ready: 44, atRisk: 16, resume: 64, interview: 59, cgpa: 7.2, usage: 58, trend: '0%' }
  ];

  // Filter logic
  const filteredDepts = deptFilter === 'All' 
    ? departmentsData 
    : departmentsData.filter(d => d.name === deptFilter);

  // Compute aggregate stats from filtered data
  const totalSt = filteredDepts.reduce((acc, curr) => acc + curr.students, 0);
  const totalReady = filteredDepts.reduce((acc, curr) => acc + curr.ready, 0);
  const totalAtRisk = filteredDepts.reduce((acc, curr) => acc + curr.atRisk, 0);
  const avgCgpa = (filteredDepts.reduce((acc, curr) => acc + curr.cgpa, 0) / filteredDepts.length).toFixed(2);
  const avgResume = Math.round(filteredDepts.reduce((acc, curr) => acc + curr.resume, 0) / filteredDepts.length);

  // Academic trend line data
  const academicTrendData = [
    { sem: 'Sem 1', CSE: 7.6, ECE: 7.0, MECH: 6.8 },
    { sem: 'Sem 2', CSE: 7.8, ECE: 7.1, MECH: 6.9 },
    { sem: 'Sem 3', CSE: 7.9, ECE: 7.2, MECH: 7.0 },
    { sem: 'Sem 4', CSE: 8.1, ECE: 7.2, MECH: 7.1 },
    { sem: 'Sem 5', CSE: 8.2, ECE: 7.3, MECH: 7.1 }
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in font-sans">
      
      {/* ─── Header: Cockpit Navigation ─── */}
      <header className="mb-8 pb-6 border-b border-white/[0.06] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-black uppercase tracking-wider mb-3">
            <Building size={12} /> Principal Command Center
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-1.5">Institutional Analytics Portal</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{data?.scope?.college || 'KIET Group of Institutions'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <span>Academic Year: <strong className="text-white">{academicYear}</strong></span>
          </div>
        </div>

        {/* Action controls & selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Year selector */}
          <div className="relative">
            <select 
              value={academicYear} 
              onChange={(e) => setAcademicYear(e.target.value)}
              className="appearance-none bg-secondary/50 border border-border/60 rounded-xl px-4 py-2.5 pr-10 text-xs font-bold text-white focus:outline-none focus:border-primary/50 transition-colors"
            >
              <option value="2025-2026">AY 2025-2026</option>
              <option value="2024-2025">AY 2024-2025</option>
            </select>
            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>

          {/* Department filter */}
          <div className="relative">
            <select 
              value={deptFilter} 
              onChange={(e) => setDeptFilter(e.target.value)}
              className="appearance-none bg-secondary/50 border border-border/60 rounded-xl px-4 py-2.5 pr-10 text-xs font-bold text-white focus:outline-none focus:border-primary/50 transition-colors"
            >
              <option value="All">All Departments</option>
              <option value="CSE">CSE Only</option>
              <option value="AIML">AIML Only</option>
              <option value="ECE">ECE Only</option>
              <option value="Mechanical">Mechanical Only</option>
              <option value="Civil">Civil Only</option>
            </select>
            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>

          {/* Detailed Analytics CTA */}
          <button
            onClick={() => navigate('/analytics')}
            className="px-4 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-primary/10"
          >
            <Eye size={14} /> View Detailed Analytics
          </button>

          {/* Export button */}
          <button className="p-2.5 bg-secondary/50 border border-border/60 hover:bg-secondary text-white rounded-xl transition-colors" title="Export CSV Report">
            <Download size={14} />
          </button>
        </div>
      </header>

      {/* ─── Row 1: Executive KPIs ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        
        {/* Employability Score */}
        <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }} className="glass-morphism p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Employability Index</span>
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-black rounded-full">+4%</span>
          </div>
          <div>
            <div className="text-3xl font-black text-white">76<span className="text-xs text-muted-foreground">/100</span></div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '76%' }} />
            </div>
            <span className="text-[9px] text-muted-foreground block mt-1.5">Institution-wide average readiness</span>
          </div>
        </motion.div>

        {/* Placement Ready */}
        <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="glass-morphism p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Placement Ready</span>
            <span className="text-[10px] text-white/50 font-bold">{Math.round((totalReady/totalSt)*100)}%</span>
          </div>
          <div>
            <div className="text-3xl font-black text-indigo-400">{totalReady}<span className="text-xs text-muted-foreground"> / {totalSt}</span></div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(totalReady/totalSt)*100}%` }} />
            </div>
            <span className="text-[9px] text-muted-foreground block mt-1.5">Students cleared readiness threshold</span>
          </div>
        </motion.div>

        {/* At-Risk Students */}
        <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="glass-morphism p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">At-Risk Students</span>
            <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[9px] font-black rounded-full">Alert</span>
          </div>
          <div>
            <div className="text-3xl font-black text-red-400">{totalAtRisk}</div>
            <div className="flex items-center justify-between text-[9px] text-muted-foreground mt-2 border-t border-white/[0.04] pt-1">
              <span>Acad: 41</span>
              <span>Placement: 55</span>
            </div>
          </div>
        </motion.div>

        {/* Department Leader */}
        <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="glass-morphism p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Performance Leader</span>
            <Award size={14} className="text-pink-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-pink-400">CSE</div>
            <div className="text-[9px] text-muted-foreground mt-2.5">
              <span>+12% progress over past month</span>
            </div>
          </div>
        </motion.div>

        {/* Placement Forecast */}
        <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }} className="glass-morphism p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Placement Forecast</span>
            <TrendingUp size={14} className="text-cyan-400" />
          </div>
          <div>
            <div className="text-3xl font-black text-cyan-400">68%</div>
            <span className="text-[9px] text-muted-foreground block mt-3 font-semibold">Projected cohort hiring rate</span>
          </div>
        </motion.div>

        {/* Faculty Engagement */}
        <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="glass-morphism p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Faculty Activity</span>
            <span className="text-[10px] text-emerald-400 font-bold">74%</span>
          </div>
          <div>
            <div className="text-3xl font-black text-white">82<span className="text-xs text-muted-foreground">/100</span></div>
            <span className="text-[9px] text-muted-foreground block mt-3 font-semibold">Platform adoption rating</span>
          </div>
        </motion.div>

      </div>

      {/* ─── Large Panel: Institutional Health Overview ─── */}
      <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-r from-[#0C0C0C] to-[#120E22] p-6 mb-8">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Institution Health Dashboard Overview</h3>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-xs text-white/50 block mb-1">Overall Readiness Score</span>
              <span className="text-2xl font-black text-white">76%</span>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '76%' }} />
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-xs text-white/50 block mb-1">Academic Health Score</span>
              <span className="text-2xl font-black text-white">82%</span>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '82%' }} />
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-xs text-white/50 block mb-1">Placement Health Score</span>
              <span className="text-2xl font-black text-white">78%</span>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-pink-500 rounded-full" style={{ width: '78%' }} />
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-xs text-white/50 block mb-1">Student Engagement</span>
              <span className="text-2xl font-black text-white">85%</span>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
          </div>

          {/* AI Executive summary */}
          <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="text-indigo-400 animate-pulse" size={16} />
              <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">AI Executive Analysis</span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed font-semibold">
              CSE and AIML are improving in readiness, but ECE and Mechanical need intervention due to low resume completion and mock interview participation.
            </p>
            <div className="text-[9px] text-muted-foreground/60 font-bold uppercase mt-3">LevelUp Core Engine</div>
          </div>
        </div>
      </div>

      {/* ─── Grid: Benchmarking & Funnel ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Department Benchmarking Table */}
        <div className="glass-morphism p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">🏫 Department Benchmarking Matrix</h3>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Relative comparison across core branches</p>
              </div>
              <span className="text-[10px] text-muted-foreground">Active Year: {academicYear}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-white font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Students</th>
                    <th className="py-2.5 px-3">Ready</th>
                    <th className="py-2.5 px-3">At Risk</th>
                    <th className="py-2.5 px-3">Avg Resume</th>
                    <th className="py-2.5 px-3">Avg Mock</th>
                    <th className="py-2.5 px-3">Avg CGPA</th>
                    <th className="py-2.5 px-3">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-white/70">
                  {filteredDepts.map((d, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3 font-bold text-white">{d.name}</td>
                      <td className="py-3 px-3">{d.students}</td>
                      <td className="py-3 px-3 text-emerald-400 font-bold">{d.ready}</td>
                      <td className="py-3 px-3 text-red-400 font-bold">{d.atRisk}</td>
                      <td className="py-3 px-3 font-semibold">{d.resume}/100</td>
                      <td className="py-3 px-3 font-semibold">{d.interview}/100</td>
                      <td className="py-3 px-3">{d.cgpa}</td>
                      <td className={`py-3 px-3 font-bold ${d.trend.startsWith('+') ? 'text-emerald-400' : d.trend.startsWith('-') ? 'text-red-400' : 'text-white/40'}`}>
                        {d.trend}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="text-[10px] text-muted-foreground mt-4 border-t border-white/[0.04] pt-3 flex justify-between">
            <span>Overall CGPA Agg: <strong className="text-white">{avgCgpa}</strong></span>
            <span>Avg Resume ATS Score: <strong className="text-white">{avgResume}/100</strong></span>
          </div>
        </div>

        {/* Placement Readiness Funnel */}
        <div className="glass-morphism p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">🎯 Placement Readiness Funnel</h3>
            <p className="text-[10px] text-muted-foreground uppercase font-bold mb-6">Cohort progression through recruitment stages</p>

            <div className="space-y-3.5">
              {[
                { label: "Total Cohort", count: totalSt, pct: 100, color: "bg-white/10" },
                { label: "Profile Completed", count: Math.round(totalSt * 0.91), pct: 91, color: "bg-indigo-500/20" },
                { label: "Resume ATS Audited", count: Math.round(totalSt * 0.75), pct: 75, color: "bg-purple-500/20" },
                { label: "Roadmap Milestones Active", count: Math.round(totalSt * 0.70), pct: 70, color: "bg-pink-500/20" },
                { label: "Mock Interviews Cleared", count: Math.round(totalSt * 0.58), pct: 58, color: "bg-rose-500/20" },
                { label: "Placement Ready Candidates", count: totalReady, pct: Math.round((totalReady/totalSt)*100), color: "bg-emerald-500/30 text-emerald-400 font-bold" }
              ].map((stage, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-white/70">{stage.label}</span>
                    <span>{stage.count} <span className="text-[10px] text-muted-foreground">({stage.pct}%)</span></span>
                  </div>
                  <div className="w-full h-2.5 bg-white/5 rounded-lg overflow-hidden">
                    <div className={`h-full ${idx === 5 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${stage.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ─── Grid: Risk Intelligence & Recommendations ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Risk Intelligence Panel */}
        <div className="glass-morphism p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="text-red-400" size={20} />
            <div>
              <h3 className="text-lg font-bold text-white">🚨 Risk Intelligence Command Center</h3>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Priority issues requiring immediate focus</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { alert: "12 students in CSE-3B falling below 75% attendance criteria", severity: "High", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
              { alert: "18 final-year students in ECE-4A have no resume uploaded to ATS", severity: "Critical", color: "text-red-400 bg-red-500/10 border-red-500/20" },
              { alert: "ECE department records average mock interview rating under 55%", severity: "Critical", color: "text-red-400 bg-red-500/10 border-red-500/20" },
              { alert: "Mechanical department reports 8% decline in study hours log this week", severity: "Medium", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" }
            ].map((r, i) => (
              <div key={i} className={`flex items-start justify-between p-3.5 rounded-xl border ${r.color} text-xs leading-relaxed`}>
                <span className="font-semibold">{r.alert}</span>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-current shrink-0 ml-4">{r.severity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Strategic Intervention Recommendations */}
        <div className="glass-morphism p-6 flex flex-col justify-between bg-gradient-to-br from-[#0A0A0A] to-[#120C1F]">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-pink-400" size={20} />
              <div>
                <h3 className="text-lg font-bold text-white">💡 AI Strategic Recommendations</h3>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Action items optimized for institutional metrics</p>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-white/70">
              <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl flex items-start gap-2.5">
                <span className="text-primary font-bold">1.</span>
                <p>Instruct the <strong>CSE Department HOD</strong> to run an interview drive targeting the 3rd-year cohort to boost mock participation metrics.</p>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl flex items-start gap-2.5">
                <span className="text-primary font-bold">2.</span>
                <p>Organize a dedicated <strong>Resume Correction Bootcamp</strong> for the ECE department to resolve the ATS format warnings.</p>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl flex items-start gap-2.5">
                <span className="text-primary font-bold">3.</span>
                <p>Deploy a final-year <strong>Aptitude Prep Program</strong> specifically focusing on students with readiness index scores below 50.</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ─── Grid: Academic Intelligence & Placement Snapshots ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Academic Intelligence Area Chart */}
        <div className="glass-morphism p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">🎓 Academic Intelligence Progression</h3>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">SGPA progress averages across departments</p>
            </div>
            <span className="text-[10px] text-muted-foreground">Historical semesters</span>
          </div>

          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={academicTrendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCSE" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorECE" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="sem" tick={{ fontSize: 10, fill: '#71717a' }} />
                <YAxis domain={[5.0, 9.0]} tick={{ fontSize: 10, fill: '#71717a' }} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                <Area type="monotone" dataKey="CSE" stroke="#818cf8" fillOpacity={1} fill="url(#colorCSE)" strokeWidth={2} />
                <Area type="monotone" dataKey="ECE" stroke="#ec4899" fillOpacity={1} fill="url(#colorECE)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-center text-muted-foreground mt-2">Department Average SGPA Progression History</div>
        </div>

        {/* Placement Performance Snapshot */}
        <div className="glass-morphism p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">💼 Campus Drive Placement Snapshot</h3>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Live statistics on corporate recruitment drives</p>
            </div>
            <span className="text-xs font-bold text-indigo-400">Active drives: 4</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] text-white/50 block mb-0.5 font-bold uppercase">Companies Visited</span>
              <span className="text-2xl font-black text-white">12</span>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] text-white/50 block mb-0.5 font-bold uppercase">Offer Conversion</span>
              <span className="text-2xl font-black text-emerald-400">62.2%</span>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] text-white/50 block mb-0.5 font-bold uppercase">Average Package</span>
              <span className="text-2xl font-black text-white">6.8 <span className="text-[10px] text-muted-foreground">LPA</span></span>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] text-white/50 block mb-0.5 font-bold uppercase">Highest Package</span>
              <span className="text-2xl font-black text-pink-400">18.5 <span className="text-[10px] text-muted-foreground">LPA</span></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-white/70">
            <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl flex justify-between">
              <span>Internship Conversion Rate:</span>
              <strong className="text-white">34%</strong>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl flex justify-between">
              <span>Hired Candidates:</span>
              <strong className="text-white">112 Students</strong>
            </div>
          </div>
        </div>

      </div>

      {/* ─── Grid: Feed & Quick Actions ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Executive Activity Feed */}
        <div className="glass-morphism p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">📈 Executive Activity Feed</h3>
              <p className="text-[10px] text-muted-foreground uppercase font-bold font-sans">Strategic updates and platform milestones</p>
            </div>
            <Activity size={16} className="text-primary animate-pulse" />
          </div>

          <div className="space-y-3.5">
            {[
              { text: "CSE department average readiness score improved by 8% this week", type: "success" },
              { text: "43 students successfully completed technical voice mock interviews yesterday", type: "info" },
              { text: "ECE department has 21 students marked below overall placement threshold", type: "warning" },
              { text: "Dynamic resume drive improved average ATS scorecard metrics by 14 points", type: "success" },
              { text: "AIML department has achieved the highest career roadmap milestone completion (92%)", type: "info" }
            ].map((feed, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/[0.01] border border-white/[0.04] hover:bg-white/[0.02] rounded-xl transition-all gap-4">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    feed.type === 'success' ? 'bg-emerald-500' :
                    feed.type === 'warning' ? 'bg-red-500 animate-pulse' :
                    'bg-indigo-500'
                  }`} />
                  <span className="text-xs text-white/80 font-medium leading-relaxed">{feed.text}</span>
                </div>
                <ChevronRightCircle size={14} className="text-white/20 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Executive Quick Actions */}
        <div className="glass-morphism p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">🛠️ Executive Quick Actions</h3>
            <p className="text-[10px] text-muted-foreground uppercase font-bold mb-6">Manage institution operations</p>

            <div className="grid grid-cols-2 gap-3.5">
              <button onClick={() => navigate('/analytics')} className="p-3 bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-primary/20 rounded-xl transition-all text-left flex flex-col justify-between min-h-[90px]">
                <BarChart3 size={18} className="text-primary" />
                <span className="text-xs font-bold text-white leading-tight">View Analytics</span>
              </button>
              <button className="p-3 bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-accent/20 rounded-xl transition-all text-left flex flex-col justify-between min-h-[90px]">
                <Users2 size={18} className="text-accent" />
                <span className="text-xs font-bold text-white leading-tight">Manage Faculty</span>
              </button>
              <button className="p-3 bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-pink-400/20 rounded-xl transition-all text-left flex flex-col justify-between min-h-[90px]">
                <FileSpreadsheet size={18} className="text-pink-400" />
                <span className="text-xs font-bold text-white leading-tight">Accreditation Report</span>
              </button>
              <button className="p-3 bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-cyan-400/20 rounded-xl transition-all text-left flex flex-col justify-between min-h-[90px]">
                <Send size={18} className="text-cyan-400" />
                <span className="text-xs font-bold text-white leading-tight">Send HOD Alerts</span>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default PrincipalDashboard;

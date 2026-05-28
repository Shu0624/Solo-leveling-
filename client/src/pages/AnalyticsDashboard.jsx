import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, TrendingUp, GitCompare, MessageSquare, Download,
  RefreshCw, Loader2, Users, Clock, Trophy, Star, Flame, Activity,
  Brain, ChevronRight, Search, Sparkles, ArrowLeft, AlertTriangle,
  Mail, Copy, Check, Send, ShieldAlert
} from 'lucide-react';
import {
  MetricCard, TrendLineChart, ComparisonBarChart, CategoryPieChart,
  PerformanceRadarChart, DataTable, QueryResultRenderer
} from '../components/analytics/AnalyticsCharts';
import AnalyticsExport from '../components/analytics/AnalyticsExport';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'classrooms', label: 'Classrooms', icon: Users },
  { id: 'at-risk', label: 'At-Risk Alerts', icon: AlertTriangle },
  { id: 'compare', label: 'Compare', icon: GitCompare },
  { id: 'ask', label: 'Ask AI', icon: Brain },
  { id: 'export', label: 'Export', icon: Download },
];

const AnalyticsDashboard = () => {
  const { api, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data state
  const [overview, setOverview] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [classroomDetail, setClassroomDetail] = useState(null);
  const [compareData, setCompareData] = useState(null);
  const [compareCodes, setCompareCodes] = useState([]);
  const [queryInput, setQueryInput] = useState('');
  const [queryResults, setQueryResults] = useState([]);
  const [queryLoading, setQueryLoading] = useState(false);

  // At-risk state
  const [atRiskData, setAtRiskData] = useState(null);
  const [atRiskLoading, setAtRiskLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [mentorshipPlan, setMentorshipPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');

  const fetchAtRiskData = useCallback(async () => {
    setAtRiskLoading(true);
    try {
      const res = await api.get('/analytics/at-risk');
      setAtRiskData(res.data);
    } catch (err) {
      console.error('Failed to load at-risk report:', err);
    } finally {
      setAtRiskLoading(false);
    }
  }, [api]);

  const generateMentorshipPlan = async (student) => {
    setSelectedStudent(student);
    setPlanLoading(true);
    setMentorshipPlan(null);
    try {
      const res = await api.post(`/analytics/at-risk/${student._id}/mentorship-plan`);
      setMentorshipPlan(res.data);
      setEmailSubject(res.data.subject || '');
      setEmailContent(res.data.emailContent || '');
    } catch (err) {
      console.error('Failed to generate mentorship plan:', err);
    } finally {
      setPlanLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${emailSubject}\n\n${emailContent}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Load overview data on mount
  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (activeTab === 'at-risk') {
      fetchAtRiskData();
    }
  }, [activeTab, fetchAtRiskData]);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const [overviewRes, classroomsRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/analytics/classrooms'),
      ]);
      setOverview(overviewRes.data);
      setClassrooms(classroomsRes.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassroomDetail = async (code) => {
    try {
      const res = await api.get(`/analytics/classroom/${code}`);
      setClassroomDetail(res.data);
      setSelectedClassroom(code);
    } catch (err) {
      console.error('Failed to load classroom detail:', err);
    }
  };

  const fetchCompare = async () => {
    if (compareCodes.length < 2) return;
    try {
      const res = await api.get(`/analytics/compare?codes=${compareCodes.join(',')}`);
      setCompareData(res.data);
    } catch (err) {
      console.error('Failed to compare:', err);
    }
  };

  const sendQuery = async (queryText) => {
    const q = queryText || queryInput;
    if (!q.trim()) return;
    setQueryLoading(true);
    try {
      const res = await api.post('/analytics/query', { query: q });
      setQueryResults(prev => [...prev, { query: q, result: res.data }]);
      setQueryInput('');
    } catch (err) {
      console.error('Query failed:', err);
    } finally {
      setQueryLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await api.post('/analytics/refresh');
      await fetchOverview();
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleCompareCode = (code) => {
    setCompareCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  // Role title
  const getRoleTitle = () => {
    switch (user?.role) {
      case 'principal': return 'College-Wide Analytics';
      case 'placement': return 'Placement Analytics';
      case 'hod': return 'Department Analytics';
      case 'faculty': return 'Class Analytics';
      default: return 'Analytics';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground">
        <BarChart3 className="animate-pulse mb-4 text-primary" size={48} />
        <p className="animate-pulse font-medium">Loading analytics engine...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <header className="mb-8 pb-6 border-b border-border/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-3 border border-primary/20">
            <Sparkles size={14} /> {getRoleTitle()}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            AI Data Analyst
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {user?.department && `${user.department} · `}{user?.college || 'All Colleges'}
          </p>
        </div>

        {['hod', 'principal', 'placement'].includes(user?.role) && (
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-secondary/50 hover:bg-secondary text-foreground rounded-2xl font-bold text-sm transition-all flex items-center gap-2 border border-border/50"
          >
            {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Refresh Data
          </button>
        )}
      </header>

      {/* Tab Navigation */}
      <div className="mb-8 bg-secondary/30 rounded-2xl p-1 overflow-x-auto border border-border/50 scrollbar-none">
        <div className="flex gap-1 min-w-max">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* ============ OVERVIEW TAB ============ */}
        {activeTab === 'overview' && overview && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="Total Students" value={overview.stats.totalStudents} icon="users" color="#6366f1" delay={0} />
              <MetricCard label="Active This Week" value={overview.stats.activeThisWeek} icon="activity" color="#22c55e" delay={1} />
              <MetricCard label="Study Hours (30d)" value={`${overview.stats.totalStudyHours}h`} icon="clock" color="#f59e0b" delay={2} />
              <MetricCard label="Avg Quiz Score" value={`${overview.stats.avgQuizScore}%`} icon="trophy" color="#8b5cf6" delay={3} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <MetricCard label="Quiz Attempts" value={overview.stats.totalQuizAttempts} icon="chart" color="#06b6d4" delay={4} />
              <MetricCard label="Avg Resume Score" value={overview.stats.avgResumeScore} icon="file" color="#ec4899" delay={5} />
              <MetricCard label="Avg Streak" value={`${overview.stats.avgStreak} days`} icon="flame" color="#f43f5e" delay={6} />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TrendLineChart
                data={overview.dailyTrend}
                dataKeys={['hours']}
                xAxisKey="date"
                title="📈 Study Hours Trend (14 days)"
                colors={['#6366f1']}
              />
              <CategoryPieChart
                data={overview.categoryBreakdown}
                dataKey="hours"
                nameKey="name"
                title="📊 Study Category Distribution"
              />
            </div>
          </motion.div>
        )}

        {/* ============ CLASSROOMS TAB ============ */}
        {activeTab === 'classrooms' && (
          <motion.div
            key="classrooms"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {selectedClassroom && classroomDetail ? (
              // Classroom Detail View
              <div className="space-y-6">
                <button
                  onClick={() => { setSelectedClassroom(null); setClassroomDetail(null); }}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  <ArrowLeft size={16} /> Back to all classrooms
                </button>

                <div className="glass-morphism p-6">
                  <h2 className="text-2xl font-bold text-foreground mb-1">
                    Classroom {classroomDetail.classroomCode}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {classroomDetail.students?.length || 0} students
                  </p>
                </div>

                {/* Time series chart if available */}
                {classroomDetail.timeSeries?.length > 0 && (
                  <TrendLineChart
                    data={classroomDetail.timeSeries.map(ts => ({
                      date: new Date(ts.date).toISOString().split('T')[0],
                      studyHours: ts.totalStudyHours || 0,
                      quizAvg: ts.averageQuizScore || 0,
                    }))}
                    dataKeys={['studyHours', 'quizAvg']}
                    xAxisKey="date"
                    title="📈 Performance Over Time"
                    colors={['#6366f1', '#22c55e']}
                  />
                )}

                {/* Student Table */}
                {classroomDetail.students?.length > 0 && (
                  <DataTable
                    columns={['name', 'studyHours', 'quizAvg', 'quizAttempts', 'streak']}
                    data={classroomDetail.students}
                    title="👩‍🎓 Student Breakdown"
                  />
                )}
              </div>
            ) : (
              // Classroom List View
              <div className="glass-morphism p-6">
                <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <Users className="text-primary" size={20} /> All Classrooms
                </h3>

                {classrooms.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classrooms.map((cls, i) => (
                      <motion.div
                        key={cls.classroomCode}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => fetchClassroomDetail(cls.classroomCode)}
                        className="p-5 rounded-2xl bg-secondary/30 hover:bg-secondary/60 border border-border/50 cursor-pointer transition-all hover:scale-[1.01] group"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-lg font-black text-foreground">{cls.classroomCode}</span>
                          <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-xs text-muted-foreground font-medium mb-3">{cls.department || ''}</p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-lg font-black text-primary">{cls.metrics?.totalStudents || 0}</p>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">Students</p>
                          </div>
                          <div>
                            <p className="text-lg font-black text-amber-500">{cls.metrics?.totalStudyHours || 0}h</p>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">Study</p>
                          </div>
                          <div>
                            <p className="text-lg font-black text-green-500">{cls.metrics?.averageQuizScore || 0}%</p>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">Quiz</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-medium">No classroom data available yet.</p>
                    <p className="text-sm mt-1">Analytics will appear once students start using the platform.</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ============ COMPARE TAB ============ */}
        {activeTab === 'compare' && (
          <motion.div
            key="compare"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="glass-morphism p-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <GitCompare className="text-primary" size={20} /> Select Classrooms to Compare
              </h3>

              <div className="flex flex-wrap gap-2 mb-6">
                {classrooms.map(cls => (
                  <button
                    key={cls.classroomCode}
                    onClick={() => toggleCompareCode(cls.classroomCode)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      compareCodes.includes(cls.classroomCode)
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'bg-secondary/40 text-foreground hover:bg-secondary/60 border border-border/50'
                    }`}
                  >
                    {cls.classroomCode}
                  </button>
                ))}
              </div>

              {compareCodes.length >= 2 && (
                <button
                  onClick={fetchCompare}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                >
                  Compare {compareCodes.length} Classrooms
                </button>
              )}
              {compareCodes.length === 1 && (
                <p className="text-sm text-muted-foreground">Select at least one more classroom to compare.</p>
              )}
            </div>

            {compareData && (
              <>
                <ComparisonBarChart
                  data={compareData}
                  dataKeys={['studyHours', 'avgQuizScore', 'students']}
                  xAxisKey="classroomCode"
                  title="📊 Classroom Comparison"
                  colors={['#6366f1', '#22c55e', '#f59e0b']}
                />

                {/* Radar overlay */}
                {compareData.length <= 5 && (() => {
                  const metrics = ['studyHours', 'avgQuizScore', 'quizAttempts', 'avgResumeScore', 'avgStreak'];
                  const radarData = metrics.map(m => {
                    const point = { metric: m.replace(/([A-Z])/g, ' $1').trim() };
                    const maxVal = Math.max(...compareData.map(d => d[m] || 0), 1);
                    compareData.forEach(d => {
                      point[d.classroomCode] = Math.round(((d[m] || 0) / maxVal) * 100);
                    });
                    return point;
                  });
                  const radarKeys = compareData.map(d => d.classroomCode);
                  return (
                    <PerformanceRadarChart
                      data={radarData}
                      dataKeys={radarKeys}
                      title="🕸️ Normalized Comparison"
                      colors={['#6366f1', '#f43f5e', '#22c55e', '#f59e0b', '#8b5cf6']}
                    />
                  );
                })()}

                <DataTable
                  columns={['classroomCode', 'students', 'studyHours', 'avgQuizScore', 'quizAttempts', 'avgResumeScore', 'avgStreak']}
                  data={compareData}
                  title="📋 Detailed Comparison"
                />
              </>
            )}
          </motion.div>
        )}

        {/* ============ ASK AI TAB ============ */}
        {activeTab === 'ask' && (
          <motion.div
            key="ask"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Query Input */}
            <div className="glass-morphism p-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Brain className="text-primary" size={20} /> Ask About Your Students
              </h3>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={queryInput}
                  onChange={e => setQueryInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendQuery()}
                  placeholder="e.g., Who are the top performers in CSE-3A?"
                  className="flex-1 px-5 py-3 bg-secondary/30 border border-border/50 rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 text-sm"
                />
                <button
                  onClick={() => sendQuery()}
                  disabled={queryLoading || !queryInput.trim()}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {queryLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  Ask
                </button>
              </div>

              {/* Suggestions */}
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  'Show me study time trends',
                  'Who are the top performers?',
                  'Which students are at risk?',
                  'Show average quiz scores',
                  'Category breakdown',
                  'Give me an overview',
                  'Show attendance overview',
                  'Compare departments',
                ].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => { setQueryInput(suggestion); sendQuery(suggestion); }}
                    className="px-3 py-1.5 bg-secondary/40 hover:bg-secondary/60 text-muted-foreground hover:text-foreground rounded-xl text-xs font-medium transition-all border border-border/30"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Query Results */}
            <div className="space-y-6">
              {queryResults.map((qr, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MessageSquare size={14} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">{qr.query}</p>
                      <p className="text-xs text-muted-foreground mt-1">{qr.result?.summary}</p>
                    </div>
                  </div>
                  <QueryResultRenderer result={qr.result} />
                </div>
              ))}
            </div>

            {queryResults.length === 0 && (
              <div className="text-center py-12 text-muted-foreground glass-morphism rounded-3xl">
                <Brain size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-medium">Ask me anything about your students.</p>
                <p className="text-sm mt-1">Try clicking one of the suggestions above.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ============ AT-RISK TAB ============ */}
        {activeTab === 'at-risk' && (
          <motion.div
            key="at-risk"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {atRiskLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[30vh] text-muted-foreground">
                <Loader2 size={36} className="animate-spin text-primary mb-3" />
                <p className="font-semibold">Analyzing student risk metrics...</p>
              </div>
            ) : atRiskData ? (
              <>
                {/* Stats row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass-morphism p-6 flex items-center justify-between">
                    <div>
                      <span className="text-3xl font-black text-foreground">{atRiskData.atRiskCount}</span>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Students Flagged</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                      <AlertTriangle size={24} />
                    </div>
                  </div>
                  <div className="glass-morphism p-6 flex items-center justify-between">
                    <div>
                      <span className="text-3xl font-black text-red-400">{atRiskData.highRiskCount}</span>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Critical Warnings</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center animate-pulse">
                      <ShieldAlert size={24} />
                    </div>
                  </div>
                  <div className="glass-morphism p-6 flex items-center justify-between">
                    <div>
                      <span className="text-3xl font-black text-amber-400">{atRiskData.mediumRiskCount}</span>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Interventions Needed</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      <Activity size={24} />
                    </div>
                  </div>
                </div>

                {/* List of at-risk students */}
                <div className="glass-morphism p-6">
                  <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                    <ShieldAlert className="text-red-500" size={20} /> Faculty Early Warning Roster
                  </h3>

                  {atRiskData.students.length > 0 ? (
                    <div className="space-y-6">
                      {atRiskData.students.map((student) => (
                        <div
                          key={student._id}
                          className={`p-6 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${
                            student.riskLevel === 'high'
                              ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/8'
                              : 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/8'
                          }`}
                        >
                          {/* Student identity & reasons */}
                          <div className="space-y-3 max-w-xl">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-foreground text-lg">{student.name}</h4>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-background border border-border/50 text-muted-foreground font-semibold uppercase">
                                {student.classroomCode} · {student.department}
                              </span>
                              <span
                                className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  student.riskLevel === 'high'
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                }`}
                              >
                                {student.riskLevel === 'high' ? 'Critical Warning' : 'Needs Intervention'}
                              </span>
                            </div>

                            {/* Trigger list */}
                            <ul className="space-y-1">
                              {student.reasons.map((reason, idx) => (
                                <li key={idx} className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                                  <span className={`w-1.5 h-1.5 rounded-full ${student.riskLevel === 'high' ? 'bg-red-400' : 'bg-amber-400'}`} />
                                  {reason}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Student metrics grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center lg:text-left">
                            <div className="px-4 py-2 bg-background/30 rounded-xl border border-border/30">
                              <span className="text-lg font-black text-foreground">{student.readinessScore}%</span>
                              <span className="text-[10px] text-muted-foreground font-bold uppercase block mt-0.5">Readiness</span>
                            </div>
                            <div className="px-4 py-2 bg-background/30 rounded-xl border border-border/30">
                              <span className={`text-lg font-black ${student.attendance < 75 ? 'text-red-400' : 'text-foreground'}`}>
                                {student.attendance}%
                              </span>
                              <span className="text-[10px] text-muted-foreground font-bold uppercase block mt-0.5">Attendance</span>
                            </div>
                            <div className="px-4 py-2 bg-background/30 rounded-xl border border-border/30">
                              <span className={`text-lg font-black ${student.assignmentCompletion < 60 ? 'text-red-400' : 'text-foreground'}`}>
                                {student.assignmentCompletion}%
                              </span>
                              <span className="text-[10px] text-muted-foreground font-bold uppercase block mt-0.5">Assignments</span>
                            </div>
                            <div className="px-4 py-2 bg-background/30 rounded-xl border border-border/30">
                              <span className="text-lg font-black text-foreground">{student.dsaSolved}</span>
                              <span className="text-[10px] text-muted-foreground font-bold uppercase block mt-0.5">DSA Solved</span>
                            </div>
                          </div>

                          {/* CTA Actions */}
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => generateMentorshipPlan(student)}
                              className={`px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg ${
                                student.riskLevel === 'high'
                                  ? 'bg-red-500 text-white shadow-red-500/10 hover:bg-red-600'
                                  : 'bg-amber-500 text-white shadow-amber-500/10 hover:bg-amber-600'
                              }`}
                            >
                              <Mail size={16} /> Mentorship Plan
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <ShieldAlert size={48} className="mx-auto mb-4 text-emerald-400/30" />
                      <p className="font-semibold text-emerald-400">All students are on track!</p>
                      <p className="text-sm mt-1">No students currently fall below performance or attendance warning criteria.</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground glass-morphism rounded-3xl">
                <AlertTriangle size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-medium">Failed to load at-risk dashboard analytics data.</p>
              </div>
            )}

            {/* Mentorship Program Builder Modal */}
            <AnimatePresence>
              {selectedStudent && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                >
                  <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    className="glass-morphism w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 md:p-8 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-6">
                        <div>
                          <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider mb-2 inline-block">
                            AI Intervention Planner
                          </span>
                          <h3 className="text-xl font-bold text-foreground">
                            Mentorship Action Plan: {selectedStudent.name}
                          </h3>
                        </div>
                        <button
                          onClick={() => setSelectedStudent(null)}
                          className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                          ✕
                        </button>
                      </div>

                      {planLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <Loader2 size={36} className="animate-spin text-primary mb-3" />
                          <p className="font-bold text-sm">Groq AI is designing personalized support template...</p>
                          <p className="text-xs text-muted-foreground mt-1">Evaluating DSA progress, academic scores, and attendance rates</p>
                        </div>
                      ) : mentorshipPlan ? (
                        <div className="space-y-6">
                          {/* Subject */}
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Email Subject Line</label>
                            <input
                              type="text"
                              value={emailSubject}
                              onChange={(e) => setEmailSubject(e.target.value)}
                              className="w-full bg-secondary/30 border border-border/50 text-foreground px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-bold text-sm transition-all"
                            />
                          </div>

                          {/* Email Content Body */}
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Personalized Letter / Intervention Draft</label>
                            <textarea
                              rows={10}
                              value={emailContent}
                              onChange={(e) => setEmailContent(e.target.value)}
                              className="w-full bg-secondary/30 border border-border/50 text-foreground p-4 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all resize-none font-medium leading-relaxed"
                            />
                          </div>

                          {/* Suggested Steps */}
                          {mentorshipPlan.mentorshipActionSteps?.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Recommended Action Steps</span>
                              <div className="space-y-1.5">
                                {mentorshipPlan.mentorshipActionSteps.map((step, idx) => (
                                  <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-foreground bg-background/25 border border-border/30 rounded-xl p-3">
                                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold">
                                      {idx + 1}
                                    </span>
                                    <p className="leading-5">{step}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-destructive text-center py-6">Could not generate AI action plan templates.</p>
                      )}
                    </div>

                    {!planLoading && (
                      <div className="flex items-center justify-end gap-3 border-t border-border/50 pt-6 mt-6">
                        <button
                          onClick={() => setSelectedStudent(null)}
                          className="px-5 py-3 rounded-xl bg-secondary/50 hover:bg-secondary text-foreground text-sm font-bold transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCopy}
                          className="px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary/25"
                        >
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                          {copied ? 'Copied Draft!' : 'Copy Draft & Steps'}
                        </button>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ============ EXPORT TAB ============ */}
        {activeTab === 'export' && (
          <motion.div
            key="export"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <AnalyticsExport />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnalyticsDashboard;

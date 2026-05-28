import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  ClipboardList, CalendarCheck, Megaphone, Plus, Send, Check,
  Clock, AlertTriangle, ChevronDown, ChevronUp, FileText,
  Users, Loader2, Pin, Star, CheckCircle2, XCircle, X,
  ListChecks, ExternalLink, BarChart3, Power, BookOpen, FlaskConical, Calendar, Download,
  Trophy, Code2, TrendingUp, Medal, Eye, EyeOff, ArrowUp, ArrowDown, Minus, Brain, Sparkles
} from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import FormBuilder from '../components/assessment/FormBuilder';
import FormResponse from '../components/assessment/FormResponse';
import FormResults from '../components/assessment/FormResults';

const TABS = [
  { id: 'assignments', label: 'Assignments', icon: ClipboardList },
  { id: 'forms', label: 'Forms', icon: ListChecks },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'scores', label: 'My Scores', icon: BarChart3 },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'dsa', label: 'DSA Tracker', icon: Code2 },
];

const EXAM_TYPES = ['CT-1', 'CT-2', 'CT-3', 'midsem', 'endsem', 'practical', 'assignment'];
const DSA_PLATFORMS = [
  { value: 'leetcode', label: 'LeetCode' },
  { value: 'codechef', label: 'CodeChef' },
  { value: 'hackerrank', label: 'HackerRank' },
  { value: 'gfg', label: 'GeeksForGeeks' },
  { value: 'codeforces', label: 'Codeforces' },
  { value: 'other', label: 'Other' },
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const Assessment = () => {
  const { api, user } = useAuth();
  const [activeTab, setActiveTab] = useState('assignments');
  const isFaculty = ['faculty', 'hod', 'principal'].includes(user?.role);
  const classroomCode = user?.classroomCode || '';

  // ---- ASSIGNMENTS STATE ----
  const [assignments, setAssignments] = useState([]);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({ classroomCode: '', subject: '', title: '', description: '', deadline: '', maxMarks: 100 });
  const [expandedAssignment, setExpandedAssignment] = useState(null);
  const [submitText, setSubmitText] = useState('');
  const [gradingData, setGradingData] = useState({ studentId: '', grade: '', feedback: '' });
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [loadingAIGrade, setLoadingAIGrade] = useState({});
  const [aiInterventionPlan, setAiInterventionPlan] = useState('');
  const [loadingIntervention, setLoadingIntervention] = useState(false);
  const [showInterventionModal, setShowInterventionModal] = useState(false);

  // ---- ATTENDANCE STATE ----
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [markingMode, setMarkingMode] = useState(false);
  const [attendanceMarks, setAttendanceMarks] = useState({});
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  // Subject-wise fields (DBATU/CSMSS style)
  const [attendanceSubject, setAttendanceSubject] = useState('');
  const [attendanceLectureType, setAttendanceLectureType] = useState('theory');
  const [attendanceLectureSlot, setAttendanceLectureSlot] = useState(1);
  // Monthly summary
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [summaryMonth, setSummaryMonth] = useState(new Date().getMonth() + 1);
  const [summaryYear, setSummaryYear] = useState(new Date().getFullYear());
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [attendanceView, setAttendanceView] = useState('daily'); // 'daily' | 'monthly'

  // ---- ANNOUNCEMENTS STATE ----
  const [announcements, setAnnouncements] = useState([]);
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ classroomCodes: '', title: '', content: '', isPinned: false });
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

  // ---- FORMS STATE ----
  const [forms, setForms] = useState([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [activeFormId, setActiveFormId] = useState(null);
  const [formViewMode, setFormViewMode] = useState(null);

  // ---- MARKS / SCORES STATE ----
  const [myScores, setMyScores] = useState(null);
  const [classMarks, setClassMarks] = useState(null);
  const [loadingScores, setLoadingScores] = useState(false);
  const [markEntryForm, setMarkEntryForm] = useState({ subject: '', examType: 'CT-1', maxMarks: 20 });
  const [markEntries, setMarkEntries] = useState([]); // [{studentId, marksObtained}]

  // ---- LEADERBOARD STATE ----
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [lbSubjectFilter, setLbSubjectFilter] = useState('');

  // ---- DSA STATE ----
  const [dsaForm, setDsaForm] = useState({ easySolved: 0, mediumSolved: 0, hardSolved: 0, platform: 'leetcode', profileUrl: '' });
  const [dsaLeaderboard, setDsaLeaderboard] = useState(null);
  const [myDSA, setMyDSA] = useState(null);
  const [loadingDSA, setLoadingDSA] = useState(false);

  // ---- NEW AI UTILITY STATE ----
  const [showAIQuizModal, setShowAIQuizModal] = useState(false);
  const [aiQuizTopic, setAiQuizTopic] = useState('');
  const [aiQuizDifficulty, setAiQuizDifficulty] = useState('medium');
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [aiQuizQuestions, setAiQuizQuestions] = useState([]);
  const [aiQuizCurrentIndex, setAiQuizCurrentIndex] = useState(0);
  const [aiQuizSelectedAnswers, setAiQuizSelectedAnswers] = useState({});
  const [showAIQuizResults, setShowAIQuizResults] = useState(false);

  const [draftedNotice, setDraftedNotice] = useState('');
  const [loadingNoticeDraft, setLoadingNoticeDraft] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);

  const [dsaMilestones, setDsaMilestones] = useState('');
  const [loadingDSAMilestones, setLoadingDSAMilestones] = useState(false);
  const [showDSAMilestonesModal, setShowDSAMilestonesModal] = useState(false);

  const targetCode = isFaculty ? (assignmentForm.classroomCode || (user?.assignedClassrooms?.[0] || '')) : classroomCode;

  // ---- DATA FETCHING ----
  useEffect(() => {
    if (targetCode || classroomCode) {
      fetchAssignments();
      fetchAttendance();
      fetchAnnouncements();
      fetchForms();
      fetchScores();
      fetchLeaderboard();
      fetchDSA();
    }
  }, [targetCode, classroomCode]);

  const fetchAssignments = async () => {
    const code = isFaculty ? targetCode : classroomCode;
    if (!code) return;
    setLoadingAssignments(true);
    try {
      const res = await api.get(`/assessment/assignment/${code}`);
      setAssignments(res.data);
    } catch (e) { console.error(e); }
    finally { setLoadingAssignments(false); }
  };

  const fetchAttendance = async () => {
    const code = isFaculty ? targetCode : classroomCode;
    if (!code) return;
    setLoadingAttendance(true);
    try {
      const res = await api.get(`/assessment/attendance/${code}`);
      setAttendanceRecords(res.data);
    } catch (e) { console.error(e); }
    finally { setLoadingAttendance(false); }
  };

  const fetchAnnouncements = async () => {
    const code = isFaculty ? targetCode : classroomCode;
    if (!code) return;
    setLoadingAnnouncements(true);
    try {
      const res = await api.get(`/assessment/announcement/${code}`);
      setAnnouncements(res.data);
    } catch (e) { console.error(e); }
    finally { setLoadingAnnouncements(false); }
  };

  const fetchForms = async () => {
    const code = isFaculty ? targetCode : classroomCode;
    if (!code) return;
    setLoadingForms(true);
    try {
      const res = await api.get(`/assessment/form/${code}`);
      setForms(res.data);
    } catch (e) { console.error(e); }
    finally { setLoadingForms(false); }
  };

  // ---- FETCH SCORES ----
  const fetchScores = async () => {
    setLoadingScores(true);
    try {
      if (isFaculty) {
        const code = targetCode || classroomCode;
        if (code) {
          const res = await api.get(`/assessment/marks/class/${code}`);
          setClassMarks(res.data);
        }
      } else {
        const res = await api.get('/assessment/marks/my');
        setMyScores(res.data);
      }
    } catch (e) { console.error(e); }
    finally { setLoadingScores(false); }
  };

  // ---- FETCH LEADERBOARD ----
  const fetchLeaderboard = async (subject) => {
    const code = isFaculty ? targetCode : classroomCode;
    if (!code) return;
    setLoadingLeaderboard(true);
    try {
      const params = subject ? `?subject=${subject}` : '';
      const res = await api.get(`/assessment/leaderboard/${code}${params}`);
      setLeaderboardData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoadingLeaderboard(false); }
  };

  // ---- FETCH DSA ----
  const fetchDSA = async () => {
    const code = isFaculty ? targetCode : classroomCode;
    if (!code) return;
    setLoadingDSA(true);
    try {
      const res = await api.get(`/assessment/dsa/leaderboard/${code}`);
      setDsaLeaderboard(res.data.leaderboard);
      if (res.data.myProgress) {
        setMyDSA(res.data.myProgress);
        setDsaForm({
          easySolved: res.data.myProgress.easySolved || 0,
          mediumSolved: res.data.myProgress.mediumSolved || 0,
          hardSolved: res.data.myProgress.hardSolved || 0,
          platform: res.data.myProgress.platform || 'leetcode',
          profileUrl: res.data.myProgress.profileUrl || '',
        });
      }
    } catch (e) { console.error(e); }
    finally { setLoadingDSA(false); }
  };

  // ---- MARKS HANDLERS ----
  const handleSubmitMarks = async () => {
    const code = targetCode || classroomCode;
    if (!markEntryForm.subject || markEntries.length === 0) return;
    try {
      const entries = markEntries.filter(e => e.marksObtained !== '' && e.marksObtained != null).map(e => ({
        studentId: e.studentId,
        classroomCode: code,
        subject: markEntryForm.subject,
        examType: markEntryForm.examType,
        marksObtained: Number(e.marksObtained),
        maxMarks: Number(markEntryForm.maxMarks),
      }));
      await api.post('/assessment/marks', { entries });
      setMarkEntries([]);
      fetchScores();
      fetchLeaderboard();
      alert('Marks saved successfully!');
    } catch (e) { console.error(e); alert('Error saving marks'); }
  };

  // ---- DSA HANDLER ----
  const handleUpdateDSA = async () => {
    try {
      await api.put('/assessment/dsa', dsaForm);
      fetchDSA();
      alert('DSA progress updated!');
    } catch (e) { console.error(e); alert('Error updating DSA'); }
  };

  // ---- FETCH STUDENTS FOR ATTENDANCE ----
  const fetchStudents = async (code) => {
    try {
      const res = await api.get(`/analytics/students/${code}`);
      setStudents(res.data);
      const marks = {};
      res.data.forEach(s => { marks[s.id] = 'present'; });
      setAttendanceMarks(marks);
    } catch (e) {
      console.error(e);
    }
  };

  // ---- HANDLERS ----
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/assessment/assignment', assignmentForm);
      setShowCreateAssignment(false);
      setAssignmentForm({ classroomCode: '', subject: '', title: '', description: '', deadline: '', maxMarks: 100 });
      fetchAssignments();
    } catch (e) { console.error(e); }
  };

  const handleSubmitAssignment = async (assignmentId) => {
    try {
      await api.post(`/assessment/assignment/${assignmentId}/submit`, { text: submitText });
      setSubmitText('');
      setExpandedAssignment(null);
      fetchAssignments();
    } catch (e) { console.error(e); }
  };

  const handleGrade = async (assignmentId) => {
    try {
      await api.put(`/assessment/assignment/${assignmentId}/grade`, gradingData);
      setGradingData({ studentId: '', grade: '', feedback: '' });
      fetchAssignments();
    } catch (e) { console.error(e); }
  };

  const handleAIGrade = async (assignmentId, studentId) => {
    setLoadingAIGrade(prev => ({ ...prev, [studentId]: true }));
    try {
      const res = await api.post(`/assessment/assignment/${assignmentId}/ai-grade`, { studentId });
      setGradingData({
        studentId,
        grade: res.data.suggestedGrade,
        feedback: res.data.feedback
      });
      alert(`AI Suggestion loaded! Suggested Grade: ${res.data.suggestedGrade}.`);
    } catch (e) {
      console.error(e);
      alert('AI grading failed or timed out.');
    } finally {
      setLoadingAIGrade(prev => ({ ...prev, [studentId]: false }));
    }
  };

  const handleAIIntervention = async (studentId = null) => {
    setLoadingIntervention(true);
    const code = isFaculty ? (targetCode || user?.assignedClassrooms?.[0]) : classroomCode;
    try {
      const payload = studentId ? { studentId, classroomCode: code } : { studentId: user?._id, classroomCode: code };
      const res = await api.post('/assessment/intervention', payload);
      setAiInterventionPlan(res.data.intervention);
      setShowInterventionModal(true);
    } catch (e) {
      console.error(e);
      alert('Failed to generate study recovery plan');
    } finally {
      setLoadingIntervention(false);
    }
  };

  const handleGenerateAIQuiz = async (e) => {
    if (e) e.preventDefault();
    if (!aiQuizTopic.trim()) return;
    setGeneratingQuiz(true);
    setAiQuizQuestions([]);
    setAiQuizCurrentIndex(0);
    setAiQuizSelectedAnswers({});
    setShowAIQuizResults(false);
    try {
      const res = await api.post('/ai/generate-quiz', { topic: aiQuizTopic.trim(), difficulty: aiQuizDifficulty });
      if (res.data && res.data.questions) {
        setAiQuizQuestions(res.data.questions);
      } else {
        alert('Invalid response from AI Quiz Generator.');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to generate AI Quiz. Please try again.');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleDraftNotice = async (studentName, attendancePercentage, subject = 'all subjects') => {
    setLoadingNoticeDraft(true);
    setDraftedNotice('');
    setShowNoticeModal(true);
    try {
      const res = await api.post('/ai/draft-attendance-notice', { studentName, attendancePercentage, subject });
      setDraftedNotice(res.data.draft);
    } catch (e) {
      console.error(e);
      setDraftedNotice('⚠️ *Failed to draft notification template. Please retry.*');
    } finally {
      setLoadingNoticeDraft(false);
    }
  };

  const handleGetDSAMilestones = async () => {
    setLoadingDSAMilestones(true);
    setDsaMilestones('');
    setShowDSAMilestonesModal(true);
    try {
      const res = await api.post('/ai/dsa-milestones', {
        easy: dsaForm.easySolved || 0,
        medium: dsaForm.mediumSolved || 0,
        hard: dsaForm.hardSolved || 0,
        platform: dsaForm.platform || 'leetcode'
      });
      setDsaMilestones(res.data.plan);
    } catch (e) {
      console.error(e);
      setDsaMilestones('⚠️ *Failed to generate coaching milestones. Please try again.*');
    } finally {
      setLoadingDSAMilestones(false);
    }
  };

  const handleMarkAttendance = async () => {
    const code = isFaculty ? targetCode : classroomCode;
    const records = Object.entries(attendanceMarks).map(([studentId, status]) => ({ studentId, status }));
    try {
      await api.post('/assessment/attendance', {
        classroomCode: code,
        date: attendanceDate,
        records,
        subject: attendanceSubject || 'General',
        lectureType: attendanceLectureType,
        lectureSlot: attendanceLectureSlot,
      });
      setMarkingMode(false);
      fetchAttendance();
    } catch (e) { console.error(e); }
  };

  const fetchMonthlySummary = async () => {
    const code = isFaculty ? targetCode : classroomCode;
    if (!code) return;
    setLoadingSummary(true);
    try {
      const params = { month: summaryMonth, year: summaryYear };
      if (!isFaculty) params.studentId = user?._id;
      const res = await api.get(`/assessment/attendance/${code}/monthly-summary`, { params });
      setMonthlySummary(res.data);
    } catch (e) { console.error(e); }
    finally { setLoadingSummary(false); }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const codes = announcementForm.classroomCodes.split(',').map(c => c.trim()).filter(Boolean);
      await api.post('/assessment/announcement', { ...announcementForm, classroomCodes: codes });
      setShowCreateAnnouncement(false);
      setAnnouncementForm({ classroomCodes: '', title: '', content: '', isPinned: false });
      fetchAnnouncements();
    } catch (e) { console.error(e); }
  };

  const handleCreateForm = async (formData) => {
    try {
      await api.post('/assessment/form', formData);
      setShowFormBuilder(false);
      fetchForms();
    } catch (e) { console.error(e); }
  };

  const handleToggleForm = async (formId) => {
    try {
      await api.put(`/assessment/form/${formId}/toggle`);
      fetchForms();
    } catch (e) { console.error(e); }
  };

  const toggleAttendanceMark = (studentId) => {
    setAttendanceMarks(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : prev[studentId] === 'absent' ? 'late' : 'present',
    }));
  };

  const markAllPresent = () => {
    const marks = {};
    students.forEach(s => { marks[s.id] = 'present'; });
    setAttendanceMarks(marks);
  };

  // Calculate student's attendance percentage
  const getMyAttendance = () => {
    let present = 0, total = 0;
    attendanceRecords.forEach(rec => {
      const myRecord = rec.records?.find(r => r.studentId?.toString() === user?._id?.toString());
      if (myRecord) {
        total++;
        if (myRecord.status === 'present') present++;
      }
    });
    return total > 0 ? Math.round((present / total) * 100) : 0;
  };

  // ---- Faculty classroom selector ----
  const renderClassroomSelector = () => {
    if (!isFaculty || !user?.assignedClassrooms?.length) return null;
    return (
      <div className="mb-6 glass-morphism p-4 flex items-center gap-4 flex-wrap">
        <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Class:</span>
        {user.assignedClassrooms.map(code => (
          <button
            key={code}
            onClick={() => {
              setAssignmentForm(prev => ({ ...prev, classroomCode: code }));
              fetchStudents(code);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              (assignmentForm.classroomCode || user.assignedClassrooms[0]) === code
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'bg-secondary/40 text-muted-foreground hover:text-foreground border border-border/50'
            }`}
          >
            {code}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative">
      <div className="absolute top-20 right-1/3 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {/* Header */}
      <header className="mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4 border border-primary/20">
          <ClipboardList size={14} /> {isFaculty ? 'Faculty Assessment Panel' : 'My Classroom'}
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-2">
          College Assessment
        </h1>
        <p className="text-muted-foreground text-sm">
          {isFaculty
            ? 'Create assignments, forms, mark attendance, and post announcements for your classes.'
            : `Classroom: ${classroomCode || 'N/A'} · View your assignments, forms, attendance, and notices.`}
        </p>
      </header>

      {/* Faculty classroom selector */}
      {renderClassroomSelector()}

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-secondary/30 rounded-2xl p-1 overflow-x-auto border border-border/50">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setActiveFormId(null); setFormViewMode(null); setShowFormBuilder(false); }}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">

        {/* =============== ASSIGNMENTS TAB =============== */}
        {activeTab === 'assignments' && (
          <motion.div key="assignments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

            {/* Create Assignment (Faculty) */}
            {isFaculty && (
              <div className="mb-6">
                <button
                  onClick={() => setShowCreateAssignment(!showCreateAssignment)}
                  className="px-5 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                  <Plus size={16} /> New Assignment
                </button>

                <AnimatePresence>
                  {showCreateAssignment && (
                    <motion.form
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      onSubmit={handleCreateAssignment}
                      className="mt-4 glass-morphism p-6 space-y-4 overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input value={assignmentForm.classroomCode} onChange={e => setAssignmentForm(p => ({ ...p, classroomCode: e.target.value }))} placeholder="Enter classroom code" required className="input-field" />
                        <input value={assignmentForm.subject} onChange={e => setAssignmentForm(p => ({ ...p, subject: e.target.value }))} placeholder="Enter subject" required className="input-field" />
                        <input value={assignmentForm.title} onChange={e => setAssignmentForm(p => ({ ...p, title: e.target.value }))} placeholder="Enter assignment title" required className="input-field" />
                        <input type="datetime-local" value={assignmentForm.deadline} onChange={e => setAssignmentForm(p => ({ ...p, deadline: e.target.value }))} required className="input-field" />
                      </div>
                      <textarea value={assignmentForm.description} onChange={e => setAssignmentForm(p => ({ ...p, description: e.target.value }))} placeholder="Enter assignment description / instructions" rows={3} className="input-field w-full" />
                      <div className="flex gap-3">
                        <input type="number" value={assignmentForm.maxMarks} onChange={e => setAssignmentForm(p => ({ ...p, maxMarks: Number(e.target.value) }))} placeholder="Enter max marks" className="input-field w-32" />
                        <button type="submit" className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 flex items-center gap-2">
                          <Send size={14} /> Create
                        </button>
                        <button type="button" onClick={() => setShowCreateAssignment(false)} className="px-4 py-3 bg-secondary/50 rounded-2xl font-bold text-sm text-muted-foreground">Cancel</button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Assignment List */}
            {loadingAssignments ? (
              <div className="text-center py-12 text-muted-foreground"><Loader2 className="animate-spin mx-auto mb-2" /> Loading...</div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground glass-morphism rounded-3xl">
                <ClipboardList size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-medium">No assignments yet.</p>
              </div>
            ) : (
              assignments.map((a, i) => {
                const isPastDue = new Date(a.deadline) < new Date();
                const mySubmission = a.submissions?.find(s => s.studentId?.toString() === user?._id?.toString());

                return (
                  <motion.div key={a._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-morphism overflow-hidden">
                    <button
                      onClick={() => setExpandedAssignment(expandedAssignment === a._id ? null : a._id)}
                      className="w-full p-5 flex items-center justify-between text-left hover:bg-secondary/20 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${isPastDue ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                          <FileText size={22} />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground text-sm">{a.title}</h3>
                          <p className="text-xs text-muted-foreground">{a.subject} · {a.classroomCode} · Max: {a.maxMarks} marks</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${isPastDue ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-success/10 text-success border border-success/20'}`}>
                          {isPastDue ? 'Past Due' : 'Active'}
                        </span>
                        {mySubmission && <CheckCircle2 size={18} className="text-success" />}
                        {expandedAssignment === a._id ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {expandedAssignment === a._id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-5 pb-5 pt-2 border-t border-border/30 space-y-4">
                            <p className="text-sm text-muted-foreground">{a.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Clock size={12} /> Due: {new Date(a.deadline).toLocaleString()}</span>
                              <span className="flex items-center gap-1"><Users size={12} /> {a.submissions?.length || 0} submissions</span>
                            </div>

                            {/* Student: Submit */}
                            {!isFaculty && !mySubmission && (
                              <div className="space-y-3 pt-2">
                                <textarea value={submitText} onChange={e => setSubmitText(e.target.value)} placeholder="Enter your submission (paste answer or notes)..." rows={3} className="input-field w-full" />
                                <button onClick={() => handleSubmitAssignment(a._id)} disabled={!submitText.trim()} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2">
                                  <Send size={14} /> Submit
                                </button>
                              </div>
                            )}

                            {/* Student: View grade */}
                            {!isFaculty && mySubmission && (
                              <div className="p-4 rounded-2xl bg-success/5 border border-success/20">
                                <p className="text-sm font-bold text-success mb-1">✅ Submitted {mySubmission.isLate ? '(Late)' : ''}</p>
                                {mySubmission.grade != null && (
                                  <p className="text-sm text-foreground">Grade: <strong>{mySubmission.grade}/{a.maxMarks}</strong> · {mySubmission.feedback || ''}</p>
                                )}
                              </div>
                            )}

                            {/* Faculty: View submissions & grade */}
                            {isFaculty && a.submissions?.length > 0 && (
                              <div className="space-y-2 pt-2">
                                <p className="text-xs font-bold text-muted-foreground uppercase">Submissions</p>
                                {a.submissions.map((sub, j) => (
                                  <div key={j} className="p-3 rounded-xl bg-secondary/30 border border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-bold text-foreground">Student ID: {sub.studentId?.toString().slice(-6)}</p>
                                      <p className="text-xs text-muted-foreground">{sub.text?.slice(0, 100)}{sub.text?.length > 100 ? '...' : ''} {sub.isLate && <span className="text-warning">(Late)</span>}</p>
                                      {sub.grade != null && <p className="text-xs text-success font-bold mt-1">Graded: {sub.grade}/{a.maxMarks}</p>}
                                    </div>
                                    {sub.grade == null && (
                                      <div className="flex flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                        <div className="flex gap-2 items-center justify-end">
                                          <input
                                            type="number"
                                            placeholder="Grade"
                                            value={gradingData.studentId === sub.studentId ? gradingData.grade : ''}
                                            className="input-field w-20 text-sm"
                                            onChange={e => setGradingData(p => ({ ...p, studentId: sub.studentId, grade: Number(e.target.value) }))}
                                          />
                                          <button
                                            type="button"
                                            disabled={loadingAIGrade[sub.studentId]}
                                            onClick={() => handleAIGrade(a._id, sub.studentId)}
                                            className="px-3 py-2 bg-accent text-white rounded-lg font-bold text-xs flex items-center gap-1 disabled:opacity-50"
                                          >
                                            {loadingAIGrade[sub.studentId] ? <Loader2 size={12} className="animate-spin" /> : null}
                                            🤖 AI Grade
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (gradingData.studentId !== sub.studentId) {
                                                setGradingData(p => ({ ...p, studentId: sub.studentId }));
                                              }
                                              handleGrade(a._id);
                                            }}
                                            className="px-3 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-xs"
                                          >
                                            Submit
                                          </button>
                                        </div>
                                        <textarea
                                          placeholder="Add academic feedback or advice..."
                                          value={gradingData.studentId === sub.studentId ? gradingData.feedback : ''}
                                          onChange={e => setGradingData(p => ({ ...p, studentId: sub.studentId, feedback: e.target.value }))}
                                          className="input-field w-full text-xs mt-1"
                                          rows={2}
                                        />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {/* =============== FORMS TAB =============== */}
        {activeTab === 'forms' && (
          <motion.div key="forms" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

            {/* Form Builder View */}
            {showFormBuilder ? (
              <FormBuilder
                classroomCode={isFaculty ? targetCode : classroomCode}
                onSubmit={handleCreateForm}
                onCancel={() => setShowFormBuilder(false)}
              />
            ) : formViewMode === 'respond' && activeFormId ? (
              <FormResponse formId={activeFormId} onBack={() => { setActiveFormId(null); setFormViewMode(null); }} />
            ) : formViewMode === 'results' && activeFormId ? (
              <FormResults formId={activeFormId} onBack={() => { setActiveFormId(null); setFormViewMode(null); }} />
            ) : (
              <>
                {/* Faculty: Create Form */}
                {isFaculty && (
                  <button
                    onClick={() => setShowFormBuilder(true)}
                    className="px-5 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 flex items-center gap-2 mb-4"
                  >
                    <Plus size={16} /> Create New Form
                  </button>
                )}

                {/* AI Practice Quiz Card */}
                {!isFaculty && (
                  <div className="glass-morphism p-6 rounded-3xl border border-accent/20 mb-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                        <Sparkles size={24} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-foreground text-sm">🤖 AI Instant Practice Quiz</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Need to prep for exam? Generate an interactive 5-question mock quiz on any topic (e.g. OOP, OS, SQL) instantly!
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowAIQuizModal(true)} 
                      className="w-full md:w-auto px-5 py-3 bg-accent text-white rounded-2xl font-bold text-xs shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={14} /> Start AI Practice
                    </button>
                  </div>
                )}

                {/* Form List */}
                {loadingForms ? (
                  <div className="text-center py-12 text-muted-foreground"><Loader2 className="animate-spin mx-auto mb-2" /> Loading...</div>
                ) : forms.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground glass-morphism rounded-3xl">
                    <ListChecks size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-medium">No forms yet.</p>
                  </div>
                ) : (
                  forms.map((form, i) => (
                    <motion.div
                      key={form._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass-morphism rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${form.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          <ListChecks size={22} />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground text-sm">{form.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {form.questions?.length || 0} questions · {form.classroomCode}
                            {form.deadline && ` · Due: ${new Date(form.deadline).toLocaleDateString()}`}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${form.isActive ? 'bg-success/10 text-success border-success/20' : 'bg-muted text-muted-foreground border-border/50'}`}>
                              {form.isActive ? 'Active' : 'Closed'}
                            </span>
                            {form.googleFormUrl && (
                              <a href={form.googleFormUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-primary font-bold hover:underline">
                                <ExternalLink size={10} /> Google Form
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-16 sm:ml-0">
                        {isFaculty ? (
                          <>
                            <button
                              onClick={() => { setActiveFormId(form._id); setFormViewMode('results'); }}
                              className="px-3 py-2 rounded-lg bg-secondary text-foreground text-xs font-bold hover:bg-secondary/70 transition-colors flex items-center gap-1"
                            >
                              <BarChart3 size={14} /> Results
                            </button>
                            <button
                              onClick={() => handleToggleForm(form._id)}
                              className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${form.isActive ? 'bg-warning/10 text-warning hover:bg-warning/20' : 'bg-success/10 text-success hover:bg-success/20'}`}
                            >
                              <Power size={14} /> {form.isActive ? 'Close' : 'Reopen'}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => { setActiveFormId(form._id); setFormViewMode('respond'); }}
                            disabled={!form.isActive}
                            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-1"
                          >
                            <Send size={14} /> {form.isActive ? 'Fill Form' : 'Closed'}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </>
            )}
          </motion.div>
        )}

        {/* =============== ATTENDANCE TAB =============== */}
        {activeTab === 'attendance' && (
          <motion.div key="attendance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

            {/* Daily / Monthly Toggle */}
            <div className="flex gap-1 bg-secondary/30 rounded-xl p-1 w-fit border border-border/50">
              {[
                { id: 'daily', label: 'Daily Attendance', icon: CalendarCheck },
                { id: 'monthly', label: 'Monthly Report (DBATU)', icon: Calendar },
              ].map(v => {
                const Icon = v.icon;
                return (
                  <button
                    key={v.id}
                    onClick={() => { setAttendanceView(v.id); if (v.id === 'monthly') fetchMonthlySummary(); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      attendanceView === v.id ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon size={14} /> {v.label}
                  </button>
                );
              })}
            </div>

            {/* ===== DAILY VIEW ===== */}
            {attendanceView === 'daily' && (
              <>
                {/* Student: My Attendance Overview */}
                {!isFaculty && (
                  <div className="glass-morphism p-6">
                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2"><CalendarCheck className="text-primary" size={20} /> My Attendance</h3>
                    <div className="flex items-center gap-6 flex-wrap">
                      <div className="text-center">
                        <p className="text-4xl font-black text-primary">{getMyAttendance()}%</p>
                        <p className="text-xs text-muted-foreground font-bold uppercase mt-1">Overall</p>
                      </div>
                      <div className="text-center">
                        <p className="text-4xl font-black text-foreground">{attendanceRecords.length}</p>
                        <p className="text-xs text-muted-foreground font-bold uppercase mt-1">Total Lectures</p>
                      </div>
                      {getMyAttendance() < 75 && (
                        <div className="flex items-center gap-2 text-destructive text-sm font-bold bg-destructive/10 px-4 py-2 rounded-xl border border-destructive/20">
                          <AlertTriangle size={16} /> Below 75% — DBATU Defaulter Threshold
                        </div>
                      )}
                      <button
                        onClick={() => handleAIIntervention()}
                        disabled={loadingIntervention}
                        className="px-4 py-2.5 rounded-xl bg-accent text-white font-bold text-xs shadow-lg shadow-accent/20 hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                      >
                        {loadingIntervention ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        Generate AI Study recovery Plan
                      </button>
                    </div>
                  </div>
                )}

                {/* Faculty: Mark Attendance */}
                {isFaculty && (
                  <div className="glass-morphism p-6">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2"><CalendarCheck className="text-primary" size={20} /> Mark Attendance</h3>
                      {!markingMode ? (
                        <button
                          onClick={() => {
                            setMarkingMode(true);
                            const code = assignmentForm.classroomCode || user?.assignedClassrooms?.[0];
                            if (code) fetchStudents(code);
                          }}
                          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-lg shadow-primary/20 flex items-center gap-2"
                        >
                          <Plus size={14} /> Mark Lecture
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={markAllPresent} className="px-3 py-2 bg-success/10 text-success rounded-lg text-xs font-bold border border-success/20">All Present</button>
                          <button onClick={handleMarkAttendance} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold text-sm flex items-center gap-1"><Check size={14} /> Save</button>
                          <button onClick={() => setMarkingMode(false)} className="px-3 py-2 bg-secondary/50 rounded-lg text-xs font-bold text-muted-foreground"><X size={14} /></button>
                        </div>
                      )}
                    </div>

                    {/* Subject-wise Fields */}
                    {markingMode && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-4 bg-secondary/20 rounded-xl border border-border/30">
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Date</label>
                          <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="input-field text-sm w-full" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Subject</label>
                          <input
                            value={attendanceSubject}
                            onChange={e => setAttendanceSubject(e.target.value)}
                            placeholder="Enter subject"
                            className="input-field text-sm w-full"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Type</label>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setAttendanceLectureType('theory')}
                              className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors ${
                                attendanceLectureType === 'theory' ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground border border-border/50'
                              }`}
                            >
                              <BookOpen size={12} /> Theory
                            </button>
                            <button
                              onClick={() => setAttendanceLectureType('practical')}
                              className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors ${
                                attendanceLectureType === 'practical' ? 'bg-accent text-white' : 'bg-secondary/50 text-muted-foreground border border-border/50'
                              }`}
                            >
                              <FlaskConical size={12} /> Practical
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Lecture Slot</label>
                          <div className="flex gap-1">
                            {[1,2,3,4,5,6].map(s => (
                              <button
                                key={s}
                                onClick={() => setAttendanceLectureSlot(s)}
                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                                  attendanceLectureSlot === s ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground border border-border/50'
                                }`}
                              >
                                L{s}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Marking Grid */}
                    {markingMode && students.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                        {students.map(s => {
                          const status = attendanceMarks[s.id] || 'present';
                          return (
                            <button
                              key={s.id}
                              onClick={() => toggleAttendanceMark(s.id)}
                              className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                                status === 'present' ? 'bg-success/10 border-success/30 text-success' :
                                status === 'late' ? 'bg-warning/10 border-warning/30 text-warning' :
                                'bg-destructive/10 border-destructive/30 text-destructive'
                              }`}
                            >
                              <span className="font-bold text-sm truncate">{s.name}</span>
                              <span className="text-xs font-bold uppercase">{status}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {markingMode && students.length === 0 && (
                      <p className="text-sm text-muted-foreground mt-4">No students found. Select a classroom first.</p>
                    )}
                  </div>
                )}

                {/* Daily Attendance History */}
                <div className="glass-morphism p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4">📅 Daily Lecture Log</h3>
                  {loadingAttendance ? (
                    <div className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></div>
                  ) : attendanceRecords.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No attendance records yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                      {attendanceRecords.slice(0, 50).map((rec, i) => {
                        const present = rec.records?.filter(r => r.status === 'present').length || 0;
                        const total = rec.records?.length || 0;
                        const pct = total > 0 ? Math.round((present / total) * 100) : 0;
                        return (
                          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/30 gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-sm font-bold text-foreground whitespace-nowrap">{new Date(rec.date).toLocaleDateString()}</span>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${rec.lectureType === 'practical' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
                                {rec.lectureType === 'practical' ? 'PRAC' : 'TH'} L{rec.lectureSlot || 1}
                              </span>
                              <span className="text-xs font-medium text-muted-foreground truncate">{rec.subject || 'General'}</span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs text-muted-foreground">{present}/{total}</span>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${pct >= 75 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>{pct}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ===== MONTHLY REPORT VIEW (DBATU Formula) ===== */}
            {attendanceView === 'monthly' && (
              <>
                {/* Month/Year Selector */}
                <div className="glass-morphism p-4 flex items-center gap-4 flex-wrap">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Report Period:</span>
                  <div className="flex gap-1">
                    {MONTHS.map((m, i) => (
                      <button
                        key={i}
                        onClick={() => { setSummaryMonth(i + 1); }}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                          summaryMonth === i + 1 ? 'bg-primary text-primary-foreground' : 'bg-secondary/40 text-muted-foreground hover:text-foreground border border-border/30'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={summaryYear}
                    onChange={e => setSummaryYear(Number(e.target.value))}
                    className="input-field w-20 text-sm text-center"
                    min="2020" max="2030"
                  />
                  <button
                    onClick={fetchMonthlySummary}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold text-xs shadow-lg shadow-primary/20 flex items-center gap-1"
                  >
                    <BarChart3 size={14} /> Generate Report
                  </button>
                </div>

                {loadingSummary ? (
                  <div className="text-center py-12"><Loader2 className="animate-spin mx-auto text-primary" size={32} /></div>
                ) : !monthlySummary ? (
                  <div className="text-center py-16 glass-morphism rounded-3xl">
                    <Calendar size={48} className="mx-auto mb-4 text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground font-medium">Select a month and click "Generate Report"</p>
                  </div>
                ) : (
                  <>
                    {/* Summary Header */}
                    <div className="glass-morphism p-5 rounded-2xl border-l-4 border-primary">
                      <h3 className="font-extrabold text-foreground text-lg">
                        {MONTHS[monthlySummary.month - 1]} {monthlySummary.year} — {monthlySummary.classroomCode}
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium mt-1">
                        DBATU Attendance Formula: (Present Lectures ÷ Conducted Lectures) × 100 · Threshold: 75%
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Total lecture entries: {monthlySummary.totalRecords} · Subjects: {monthlySummary.subjects?.join(', ') || 'None'}
                      </p>
                    </div>

                    {/* STUDENT VIEW: My Subject-wise Breakdown */}
                    {!isFaculty && monthlySummary.student && (
                      <div className="space-y-4">
                        {/* Overall Card */}
                        <div className={`glass-morphism p-6 rounded-2xl border-l-4 ${monthlySummary.student.overall.isDefaulter ? 'border-destructive' : 'border-success'}`}>
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Overall Attendance</h4>
                              <p className={`text-5xl font-black mt-1 ${monthlySummary.student.overall.percentage >= 75 ? 'text-success' : 'text-destructive'}`}>
                                {monthlySummary.student.overall.percentage}%
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {monthlySummary.student.overall.present} / {monthlySummary.student.overall.conducted} lectures attended
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {monthlySummary.student.overall.isDefaulter && (
                                <div className="px-4 py-2 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2 text-destructive text-sm font-bold">
                                  <AlertTriangle size={18} /> DEFAULTER — Below 75%
                                </div>
                              )}
                              <button
                                onClick={() => handleAIIntervention()}
                                disabled={loadingIntervention}
                                className="px-4 py-2 rounded-xl bg-accent text-white font-bold text-xs shadow-lg shadow-accent/20 hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                              >
                                {loadingIntervention ? <Loader2 size={12} className="animate-spin" /> : <Brain size={12} />}
                                Generate Recovery Study Plan
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Subject-wise Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(monthlySummary.student.subjects || {}).map(([subj, stats]) => (
                            <motion.div
                              key={subj}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`glass-morphism p-5 rounded-2xl border-l-4 ${stats.isDefaulter ? 'border-destructive' : 'border-success'}`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-bold text-foreground text-sm">{subj}</h4>
                                <span className={`text-2xl font-black ${stats.percentage >= 75 ? 'text-success' : 'text-destructive'}`}>
                                  {stats.percentage}%
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                <span>{stats.present}/{stats.conducted} lectures</span>
                                {stats.isDefaulter && <span className="text-destructive font-bold">(Defaulter)</span>}
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="p-2 rounded-lg bg-primary/5 border border-primary/10">
                                  <div className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase"><BookOpen size={10} /> Theory</div>
                                  <p className="font-bold text-foreground text-sm">{stats.theory.present}/{stats.theory.conducted} ({stats.theory.percentage}%)</p>
                                </div>
                                <div className="p-2 rounded-lg bg-accent/5 border border-accent/10">
                                  <div className="flex items-center gap-1 text-[10px] font-bold text-accent uppercase"><FlaskConical size={10} /> Practical</div>
                                  <p className="font-bold text-foreground text-sm">{stats.practical.present}/{stats.practical.conducted} ({stats.practical.percentage}%)</p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* FACULTY VIEW: All Students Summary Table */}
                    {isFaculty && monthlySummary.students && (
                      <div className="glass-morphism rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="bg-muted/95 border-b border-border/50 sticky top-0 z-10">
                              <tr className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                <th className="px-4 py-3">#</th>
                                <th className="px-4 py-3">Student</th>
                                <th className="px-4 py-3">Enrollment ID</th>
                                {(monthlySummary.subjects || []).map(s => (
                                  <th key={s} className="px-4 py-3 text-center">{s}</th>
                                ))}
                                <th className="px-4 py-3 text-center">Overall</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                              {monthlySummary.students.map((stu, i) => (
                                <tr key={i} className="hover:bg-muted/20 transition-colors">
                                  <td className="px-4 py-3 font-bold text-xs text-foreground">{i + 1}</td>
                                  <td className="px-4 py-3 font-bold text-xs text-foreground">{stu.name}</td>
                                  <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{stu.enrollmentId}</td>
                                  {(monthlySummary.subjects || []).map(s => {
                                    const stat = stu.subjects?.[s];
                                    if (!stat) return <td key={s} className="px-4 py-3 text-center text-xs text-muted-foreground">—</td>;
                                    return (
                                      <td key={s} className="px-4 py-3 text-center">
                                        <span className={`font-bold text-xs ${stat.percentage >= 75 ? 'text-success' : 'text-destructive'}`}>
                                          {stat.percentage}%
                                        </span>
                                        <br />
                                        <span className="text-[10px] text-muted-foreground">{stat.present}/{stat.conducted}</span>
                                      </td>
                                    );
                                  })}
                                  <td className="px-4 py-3 text-center">
                                    <span className={`font-black text-sm ${stu.overall.percentage >= 75 ? 'text-success' : 'text-destructive'}`}>
                                      {stu.overall.percentage}%
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {stu.overall.isDefaulter ? (
                                      <span className="px-2 py-1 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold border border-destructive/20">DEFAULTER</span>
                                    ) : (
                                      <span className="px-2 py-1 rounded-full bg-success/10 text-success text-[10px] font-bold border border-success/20">REGULAR</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => handleAIIntervention(stu.studentId)}
                                        disabled={loadingIntervention}
                                        className="px-2 py-1 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                                        title="Draft Intervention Plan"
                                      >
                                        <Brain size={12} />
                                        <span className="text-[10px] font-bold">Intervene</span>
                                      </button>
                                      <button
                                        onClick={() => handleDraftNotice(stu.name, stu.overall.percentage)}
                                        disabled={loadingNoticeDraft}
                                        className="px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                                        title="Draft Defaulter Warning Letter"
                                      >
                                        <FileText size={12} />
                                        <span className="text-[10px] font-bold">Warning</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* =============== ANNOUNCEMENTS TAB =============== */}
        {activeTab === 'announcements' && (
          <motion.div key="announcements" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

            {/* Create Announcement (Faculty) */}
            {isFaculty && (
              <div className="mb-6">
                <button
                  onClick={() => setShowCreateAnnouncement(!showCreateAnnouncement)}
                  className="px-5 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                  <Plus size={16} /> New Announcement
                </button>

                <AnimatePresence>
                  {showCreateAnnouncement && (
                    <motion.form
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      onSubmit={handleCreateAnnouncement}
                      className="mt-4 glass-morphism p-6 space-y-4 overflow-hidden"
                    >
                      <input value={announcementForm.classroomCodes} onChange={e => setAnnouncementForm(p => ({ ...p, classroomCodes: e.target.value }))} placeholder="Enter classroom codes (comma separated)" required className="input-field w-full" />
                      <input value={announcementForm.title} onChange={e => setAnnouncementForm(p => ({ ...p, title: e.target.value }))} placeholder="Enter announcement title" required className="input-field w-full" />
                      <textarea value={announcementForm.content} onChange={e => setAnnouncementForm(p => ({ ...p, content: e.target.value }))} placeholder="Enter announcement content..." rows={4} required className="input-field w-full" />
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                          <input type="checkbox" checked={announcementForm.isPinned} onChange={e => setAnnouncementForm(p => ({ ...p, isPinned: e.target.checked }))} className="w-4 h-4 rounded accent-primary" />
                          <Pin size={14} /> Pin this announcement
                        </label>
                        <div className="flex-1" />
                        <button type="submit" className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 flex items-center gap-2">
                          <Megaphone size={14} /> Post
                        </button>
                        <button type="button" onClick={() => setShowCreateAnnouncement(false)} className="px-4 py-3 bg-secondary/50 rounded-2xl font-bold text-sm text-muted-foreground">Cancel</button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Announcement List */}
            {loadingAnnouncements ? (
              <div className="text-center py-12 text-muted-foreground"><Loader2 className="animate-spin mx-auto mb-2" /> Loading...</div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground glass-morphism rounded-3xl">
                <Megaphone size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-medium">No announcements yet.</p>
              </div>
            ) : (
              announcements.map((ann, i) => (
                <motion.div key={ann._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-morphism p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ann.isPinned ? 'bg-warning/10 text-warning' : 'bg-accent/10 text-accent'}`}>
                      {ann.isPinned ? <Pin size={18} /> : <Megaphone size={18} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-foreground text-sm">{ann.title}</h3>
                        {ann.isPinned && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning/10 text-warning border border-warning/20">PINNED</span>}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                        <span>To: {ann.classroomCodes?.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* =============== MY SCORES TAB =============== */}
        {activeTab === 'scores' && (
          <motion.div key="scores" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

            {loadingScores ? (
              <div className="text-center py-12 text-muted-foreground"><Loader2 className="animate-spin mx-auto mb-2" /> Loading scores...</div>
            ) : isFaculty ? (
              /* ---- FACULTY: Enter Marks ---- */
              <div className="space-y-6">
                <div className="glass-morphism p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2"><BarChart3 className="text-primary" size={20} /> Enter Student Marks</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                    <input value={markEntryForm.subject} onChange={e => setMarkEntryForm(p => ({ ...p, subject: e.target.value }))} placeholder="Enter subject" className="input-field" />
                    <select value={markEntryForm.examType} onChange={e => setMarkEntryForm(p => ({ ...p, examType: e.target.value }))} className="input-field">
                      {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input type="number" value={markEntryForm.maxMarks} onChange={e => setMarkEntryForm(p => ({ ...p, maxMarks: e.target.value }))} placeholder="Max Marks" className="input-field" />
                    <button onClick={async () => { const code = targetCode || classroomCode; if (code) { try { const res = await api.get(`/analytics/students/${code}`); setMarkEntries(res.data.map(s => ({ studentId: s.id, name: s.name, marksObtained: '' }))); } catch(e) { console.error(e); } } }} className="px-4 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm">Load Students</button>
                  </div>

                  {markEntries.length > 0 && (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                      {markEntries.map((entry, i) => (
                        <div key={entry.studentId} className="flex items-center gap-4 p-3 rounded-xl bg-secondary/20 border border-border/30">
                          <span className="text-sm font-bold text-foreground flex-1 truncate">{entry.name}</span>
                          <input type="number" min="0" max={markEntryForm.maxMarks} value={entry.marksObtained} onChange={e => { const updated = [...markEntries]; updated[i].marksObtained = e.target.value; setMarkEntries(updated); }} placeholder={`/ ${markEntryForm.maxMarks}`} className="input-field w-24 text-center" />
                          <span className="text-xs text-muted-foreground">/ {markEntryForm.maxMarks}</span>
                        </div>
                      ))}
                      <button onClick={handleSubmitMarks} className="mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 flex items-center gap-2"><Send size={14} /> Save All Marks</button>
                    </div>
                  )}
                </div>

                {/* Faculty: View entered marks */}
                {classMarks && classMarks.marks?.length > 0 && (
                  <div className="glass-morphism p-6">
                    <h3 className="text-lg font-bold text-foreground mb-4">📋 Entered Marks ({classMarks.marks.length} records)</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="text-left text-muted-foreground border-b border-border/30">
                          <th className="pb-3 font-bold">Student</th><th className="pb-3 font-bold">Subject</th><th className="pb-3 font-bold">Exam</th><th className="pb-3 font-bold text-right">Marks</th>
                        </tr></thead>
                        <tbody>
                          {classMarks.marks.slice(0, 50).map((m, i) => (
                            <tr key={i} className="border-b border-border/10 hover:bg-secondary/10">
                              <td className="py-2 font-medium text-foreground">{m.studentId?.name || 'Unknown'}</td>
                              <td className="py-2 text-muted-foreground">{m.subject}</td>
                              <td className="py-2"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">{m.examType}</span></td>
                              <td className="py-2 text-right font-bold text-foreground">{m.marksObtained}/{m.maxMarks}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ---- STUDENT: View My Scores ---- */
              <div className="space-y-6">
                {myScores && Object.keys(myScores.subjects).length > 0 ? (
                  <>
                    {/* Overall Score Card */}
                    <div className="glass-morphism p-6 border-l-4 border-primary">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Overall Performance</p>
                          <p className="text-4xl font-black text-foreground">{myScores.overall.percentage}<span className="text-lg text-muted-foreground font-medium">%</span></p>
                          <p className="text-sm text-muted-foreground mt-1">{myScores.overall.totalObtained} / {myScores.overall.totalMax} marks</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {myScores.overall.percentage >= 90 && <span className="px-4 py-2 rounded-full bg-amber-500/10 text-amber-500 font-bold text-sm border border-amber-500/20">🌟 Scholar</span>}
                          {myScores.overall.percentage >= 75 && myScores.overall.percentage < 90 && <span className="px-4 py-2 rounded-full bg-blue-500/10 text-blue-500 font-bold text-sm border border-blue-500/20">⭐ Achiever</span>}
                          {myScores.overall.percentage >= 60 && myScores.overall.percentage < 75 && <span className="px-4 py-2 rounded-full bg-purple-500/10 text-purple-500 font-bold text-sm border border-purple-500/20">💫 Rising Star</span>}
                          {myScores.overall.percentage < 60 && <span className="px-4 py-2 rounded-full bg-secondary text-muted-foreground font-bold text-sm border border-border/50">📚 Learner</span>}
                        </div>
                      </div>
                    </div>

                    {/* Subject Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(myScores.subjects).map(([subject, exams]) => {
                        const subTotal = Object.values(exams).reduce((a, e) => a + e.obtained, 0);
                        const subMax = Object.values(exams).reduce((a, e) => a + e.max, 0);
                        const subPct = subMax > 0 ? Math.round((subTotal / subMax) * 100) : 0;
                        return (
                          <div key={subject} className="glass-morphism p-5">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-bold text-foreground">{subject}</h4>
                              <span className={`text-2xl font-black ${subPct >= 75 ? 'text-green-500' : subPct >= 60 ? 'text-amber-500' : 'text-red-400'}`}>{subPct}%</span>
                            </div>
                            <div className="w-full h-2 bg-secondary/50 rounded-full mb-4 overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${subPct >= 75 ? 'bg-green-500' : subPct >= 60 ? 'bg-amber-500' : 'bg-red-400'}`} style={{ width: `${subPct}%` }} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(exams).map(([examType, data]) => (
                                <div key={examType} className="p-2 rounded-lg bg-secondary/20 border border-border/30">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase">{examType}</p>
                                  <p className="text-sm font-bold text-foreground">{data.obtained}<span className="text-muted-foreground font-normal">/{data.max}</span></p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Radar Chart */}
                    {Object.keys(myScores.subjects).length >= 3 && (
                      <div className="glass-morphism p-6">
                        <h3 className="text-lg font-bold text-foreground mb-4">📊 Subject Radar</h3>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={Object.entries(myScores.subjects).map(([subj, exams]) => {
                              const t = Object.values(exams).reduce((a, e) => a + e.obtained, 0);
                              const m = Object.values(exams).reduce((a, e) => a + e.max, 0);
                              return { subject: subj, score: m > 0 ? Math.round((t / m) * 100) : 0 };
                            })}>
                              <PolarGrid stroke="hsl(var(--border) / 0.3)" />
                              <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                              <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} strokeWidth={2} />
                              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px', fontSize: '12px' }} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-16 text-muted-foreground glass-morphism rounded-3xl">
                    <BarChart3 size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-medium">No scores available yet.</p>
                    <p className="text-xs mt-2">Your marks will appear here once your faculty enters them.</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* =============== LEADERBOARD TAB =============== */}
        {activeTab === 'leaderboard' && (
          <motion.div key="leaderboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

            {loadingLeaderboard ? (
              <div className="text-center py-12 text-muted-foreground"><Loader2 className="animate-spin mx-auto mb-2" /> Loading leaderboard...</div>
            ) : !leaderboardData || leaderboardData.totalStudents === 0 ? (
              <div className="text-center py-16 text-muted-foreground glass-morphism rounded-3xl">
                <Trophy size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-medium">No leaderboard data yet.</p>
                <p className="text-xs mt-2">The leaderboard will populate once marks are entered.</p>
              </div>
            ) : (
              <>
                {/* Subject Filter */}
                {leaderboardData.subjects?.length > 0 && (
                  <div className="flex gap-2 flex-wrap items-center">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Filter:</span>
                    <button onClick={() => { setLbSubjectFilter(''); fetchLeaderboard(); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${!lbSubjectFilter ? 'bg-primary text-primary-foreground' : 'bg-secondary/40 text-muted-foreground border border-border/50'}`}>All</button>
                    {leaderboardData.subjects.map(s => (
                      <button key={s} onClick={() => { setLbSubjectFilter(s); fetchLeaderboard(s); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${lbSubjectFilter === s ? 'bg-primary text-primary-foreground' : 'bg-secondary/40 text-muted-foreground border border-border/50'}`}>{s}</button>
                    ))}
                  </div>
                )}

                {/* My Rank Card */}
                {leaderboardData.myRank && (
                  <div className="glass-morphism p-6 border-l-4 border-amber-500">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl font-black border border-amber-500/20">#{leaderboardData.myRank.rank}</div>
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Your Rank</p>
                          <p className="text-2xl font-black text-foreground">{leaderboardData.myRank.percentage}%</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">out of <strong className="text-foreground">{leaderboardData.totalStudents}</strong> students</p>
                    </div>
                  </div>
                )}

                {/* Top 3 Podium */}
                {leaderboardData.top3?.length > 0 && (
                  <div className="glass-morphism p-6">
                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2"><Medal className="text-amber-500" size={20} /> Top Performers</h3>
                    <div className="flex items-end justify-center gap-4 py-4">
                      {[1, 0, 2].map(idx => {
                        const s = leaderboardData.top3[idx];
                        if (!s) return null;
                        const heights = ['h-28', 'h-20', 'h-16'];
                        const medals = ['🥇', '🥈', '🥉'];
                        return (
                          <div key={idx} className="flex flex-col items-center gap-2">
                            <span className="text-2xl">{medals[idx]}</span>
                            <p className="text-xs font-bold text-foreground text-center truncate max-w-[100px]">{s.name}</p>
                            <p className="text-lg font-black text-foreground">{s.percentage}%</p>
                            <div className={`w-20 ${heights[idx]} rounded-t-xl`} style={{ background: `linear-gradient(to top, ${s.color}33, ${s.color}11)`, border: `1px solid ${s.color}44` }} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Neighborhood Leaderboard */}
                <div className="glass-morphism p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2"><Users className="text-primary" size={20} /> Your Neighborhood</h3>
                  <div className="space-y-2">
                    {leaderboardData.leaderboard?.map((entry, i) => (
                      <div key={i} className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${entry.isMe ? 'bg-primary/10 border-2 border-primary/30 shadow-lg shadow-primary/10' : 'bg-secondary/20 border border-border/30 hover:bg-secondary/30'}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${entry.isMe ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>#{entry.rank}</div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm truncate ${entry.isMe ? 'text-primary' : 'text-foreground'}`}>{entry.isMe ? `${entry.name} (You)` : entry.name}</p>
                          <p className="text-xs text-muted-foreground">{entry.emoji} {entry.tier}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-foreground">{entry.percentage}%</p>
                          <p className="text-[10px] text-muted-foreground">{entry.obtained}/{entry.max}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Most Improved */}
                {leaderboardData.mostImproved?.length > 0 && (
                  <div className="glass-morphism p-6">
                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2"><TrendingUp className="text-green-500" size={20} /> Most Improved (CT-1 → CT-2)</h3>
                    <div className="space-y-2">
                      {leaderboardData.mostImproved.map((s, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                          <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center font-black">🚀</div>
                          <div className="flex-1"><p className="font-bold text-sm text-foreground">{s.name}</p></div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-muted-foreground">{s.ct1Pct}%</span>
                            <ArrowUp size={14} className="text-green-500" />
                            <span className="font-bold text-green-500">{s.ct2Pct}%</span>
                            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20">+{s.improvement}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* =============== DSA TRACKER TAB =============== */}
        {activeTab === 'dsa' && (
          <motion.div key="dsa" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

            {/* DSA Progress Form (Student) */}
            {!isFaculty && (
              <div className="glass-morphism p-6">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2"><Code2 className="text-green-500" size={20} /> Update Your Progress</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20 text-center">
                    <p className="text-[10px] font-bold text-green-500 uppercase mb-2">Easy</p>
                    <input type="number" min="0" value={dsaForm.easySolved} onChange={e => setDsaForm(p => ({ ...p, easySolved: parseInt(e.target.value) || 0 }))} className="input-field w-full text-center text-lg font-bold" />
                    <p className="text-[10px] text-muted-foreground mt-1">×1 pt each</p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center">
                    <p className="text-[10px] font-bold text-amber-500 uppercase mb-2">Medium</p>
                    <input type="number" min="0" value={dsaForm.mediumSolved} onChange={e => setDsaForm(p => ({ ...p, mediumSolved: parseInt(e.target.value) || 0 }))} className="input-field w-full text-center text-lg font-bold" />
                    <p className="text-[10px] text-muted-foreground mt-1">×3 pts each</p>
                  </div>
                  <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-center">
                    <p className="text-[10px] font-bold text-red-500 uppercase mb-2">Hard</p>
                    <input type="number" min="0" value={dsaForm.hardSolved} onChange={e => setDsaForm(p => ({ ...p, hardSolved: parseInt(e.target.value) || 0 }))} className="input-field w-full text-center text-lg font-bold" />
                    <p className="text-[10px] text-muted-foreground mt-1">×5 pts each</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <select value={dsaForm.platform} onChange={e => setDsaForm(p => ({ ...p, platform: e.target.value }))} className="input-field">
                    {DSA_PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                  <input value={dsaForm.profileUrl} onChange={e => setDsaForm(p => ({ ...p, profileUrl: e.target.value }))} placeholder="Enter profile URL (optional)" className="input-field" />
                </div>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="text-sm text-muted-foreground">
                    Total Score: <strong className="text-foreground text-lg">{(dsaForm.easySolved * 1) + (dsaForm.mediumSolved * 3) + (dsaForm.hardSolved * 5)}</strong> pts
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleGetDSAMilestones}
                      disabled={loadingDSAMilestones}
                      className="px-4 py-3 bg-accent text-white rounded-2xl font-bold text-sm shadow-lg shadow-accent/20 hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {loadingDSAMilestones ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      AI Coding Milestones
                    </button>
                    <button onClick={handleUpdateDSA} className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 flex items-center gap-2"><Send size={14} /> Save Progress</button>
                  </div>
                </div>
              </div>
            )}

            {/* DSA Leaderboard */}
            {loadingDSA ? (
              <div className="text-center py-12 text-muted-foreground"><Loader2 className="animate-spin mx-auto mb-2" /> Loading...</div>
            ) : !dsaLeaderboard || dsaLeaderboard.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground glass-morphism rounded-3xl">
                <Code2 size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-medium">No DSA data yet.</p>
                <p className="text-xs mt-2">Start tracking your coding progress above!</p>
              </div>
            ) : (
              <div className="glass-morphism p-6">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2"><Trophy className="text-amber-500" size={20} /> DSA Leaderboard</h3>
                <div className="space-y-2">
                  {dsaLeaderboard.map((entry, i) => (
                    <div key={i} className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${entry.isMe ? 'bg-primary/10 border-2 border-primary/30 shadow-lg shadow-primary/10' : 'bg-secondary/20 border border-border/30 hover:bg-secondary/30'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${i < 3 ? 'bg-amber-500/10 text-amber-500' : entry.isMe ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${entry.rank}`}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm truncate ${entry.isMe ? 'text-primary' : 'text-foreground'}`}>{entry.isMe ? `${entry.name} (You)` : entry.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-500 font-bold">E:{entry.easy}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold">M:{entry.medium}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 font-bold">H:{entry.hard}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-foreground">{entry.totalScore}</p>
                        <p className="text-[10px] text-muted-foreground">pts</p>
                      </div>
                      {entry.profileUrl && (
                        <a href={entry.profileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80"><ExternalLink size={14} /></a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>

      {/* AI Study Recovery & Intervention Plan Modal */}
      {showInterventionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl max-h-[85vh] bg-background/95 border border-border rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col gap-6"
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Brain className="text-accent animate-pulse" size={24} />
                <div>
                  <h3 className="font-extrabold text-foreground text-lg">🤖 Personal AI Study Recovery & Intervention Plan</h3>
                  <p className="text-xs text-muted-foreground">Generated by LevelUp Cognitive Insights Engine</p>
                </div>
              </div>
              <button
                onClick={() => { setShowInterventionModal(false); setAiInterventionPlan(''); }}
                className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="prose prose-invert max-w-none text-sm text-muted-foreground leading-relaxed space-y-4 custom-markdown-styles overflow-y-auto pr-2" style={{ maxHeight: '55vh' }}>
              <ReactMarkdown>{aiInterventionPlan || "Analyzing record and drafting customized curriculum pathway..."}</ReactMarkdown>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4 mt-auto">
              <button
                onClick={() => {
                  const blob = new Blob([aiInterventionPlan], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `academic_recovery_plan.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-secondary/70 transition-colors flex items-center gap-1"
              >
                <Download size={14} /> Download Markdown
              </button>
              <button
                onClick={() => { setShowInterventionModal(false); setAiInterventionPlan(''); }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
              >
                Close Plan
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* AI Practice Quiz Modal */}
      {showAIQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl max-h-[85vh] bg-background/95 border border-border rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col gap-6"
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="text-accent animate-pulse" size={24} />
                <div>
                  <h3 className="font-extrabold text-foreground text-lg">🤖 AI MCQ Practice Quiz</h3>
                  <p className="text-xs text-muted-foreground">LevelUp Dynamic Assessment Engine</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAIQuizModal(false);
                  setAiQuizQuestions([]);
                  setAiQuizTopic('');
                  setShowAIQuizResults(false);
                }}
                className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto pr-1 flex-1 flex flex-col gap-4" style={{ maxHeight: '60vh' }}>
              {generatingQuiz ? (
                <div className="text-center py-12 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="animate-spin text-accent" size={36} />
                  <p className="text-sm text-muted-foreground font-medium">Analyzing CS curriculum & drafting MCQ questions...</p>
                </div>
              ) : aiQuizQuestions.length === 0 ? (
                /* Setup form */
                <form onSubmit={handleGenerateAIQuiz} className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Enter a specific programming language, framework, or CS topic (e.g. "React Hooks", "B-Trees", "Database Normalization") to generate a fresh quiz.
                  </p>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Topic</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SQL Joins, Binary Search, CSS Flexbox"
                      value={aiQuizTopic}
                      onChange={(e) => setAiQuizTopic(e.target.value)}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Difficulty</label>
                    <div className="flex gap-2">
                      {['easy', 'medium', 'hard'].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setAiQuizDifficulty(d)}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold capitalize border transition-all ${
                            aiQuizDifficulty === d
                              ? 'bg-accent text-white border-accent shadow-md shadow-accent/25'
                              : 'bg-secondary/40 text-muted-foreground border-border hover:text-foreground'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-accent text-white rounded-2xl font-bold text-sm shadow-lg shadow-accent/20 hover:scale-[1.01] transition-transform flex items-center justify-center gap-2"
                  >
                    <Sparkles size={16} /> Generate Dynamic Quiz
                  </button>
                </form>
              ) : !showAIQuizResults ? (
                /* Interactive quiz gameplay */
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold text-muted-foreground">
                    <span>Question {aiQuizCurrentIndex + 1} of {aiQuizQuestions.length}</span>
                    <span className="uppercase text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">{aiQuizDifficulty}</span>
                  </div>

                  <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-300"
                      style={{ width: `${((aiQuizCurrentIndex + 1) / aiQuizQuestions.length) * 100}%` }}
                    />
                  </div>

                  <p className="font-bold text-foreground text-base mt-2">
                    {aiQuizQuestions[aiQuizCurrentIndex]?.text}
                  </p>

                  <div className="space-y-2 mt-4">
                    {aiQuizQuestions[aiQuizCurrentIndex]?.options?.map((opt, i) => {
                      const isSelected = aiQuizSelectedAnswers[aiQuizCurrentIndex] === i;
                      return (
                        <button
                          key={i}
                          onClick={() => setAiQuizSelectedAnswers(prev => ({ ...prev, [aiQuizCurrentIndex]: i }))}
                          className={`w-full p-4 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-accent/10 border-accent text-accent shadow-md shadow-accent/5 font-bold'
                              : 'bg-secondary/20 border-border/50 hover:bg-secondary/30 hover:border-border text-foreground'
                          }`}
                        >
                          <span>{opt}</span>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-accent bg-accent font-bold' : 'border-muted-foreground'}`}>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <button
                      disabled={aiQuizCurrentIndex === 0}
                      onClick={() => setAiQuizCurrentIndex(p => p - 1)}
                      className="px-4 py-2 bg-secondary text-foreground rounded-xl text-xs font-bold hover:bg-secondary/70 disabled:opacity-40"
                    >
                      Previous
                    </button>
                    {aiQuizCurrentIndex === aiQuizQuestions.length - 1 ? (
                      <button
                        onClick={() => setShowAIQuizResults(true)}
                        disabled={aiQuizSelectedAnswers[aiQuizCurrentIndex] === undefined}
                        className="px-6 py-2.5 bg-accent text-white rounded-xl text-xs font-bold shadow-md shadow-accent/10 hover:opacity-90 disabled:opacity-50"
                      >
                        Finish & Grade
                      </button>
                    ) : (
                      <button
                        onClick={() => setAiQuizCurrentIndex(p => p + 1)}
                        disabled={aiQuizSelectedAnswers[aiQuizCurrentIndex] === undefined}
                        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50"
                      >
                        Next Question
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Results summary */
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-secondary/30 border border-border/60 text-center">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Your Score</p>
                    <p className="text-5xl font-black text-foreground mt-1">
                      {
                        aiQuizQuestions.reduce((score, q, idx) => {
                          return score + (aiQuizSelectedAnswers[idx] === q.correctAnswer ? 1 : 0);
                        }, 0)
                      }
                      <span className="text-xl text-muted-foreground font-normal"> / {aiQuizQuestions.length}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {
                        aiQuizQuestions.reduce((score, q, idx) => {
                          return score + (aiQuizSelectedAnswers[idx] === q.correctAnswer ? 1 : 0);
                        }, 0) === aiQuizQuestions.length ? '🥇 Perfect score! Excellent work!' : 'Keep practicing to master this concept!'
                      }
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-foreground">Detailed Question Review:</h4>
                    {aiQuizQuestions.map((q, idx) => {
                      const selected = aiQuizSelectedAnswers[idx];
                      const isCorrect = selected === q.correctAnswer;
                      return (
                        <div key={idx} className={`p-4 rounded-xl border ${isCorrect ? 'bg-success/5 border-success/30' : 'bg-destructive/5 border-destructive/30'}`}>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <p className="font-bold text-sm text-foreground">{idx + 1}. {q.text}</p>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isCorrect ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>
                              {isCorrect ? 'Correct' : 'Incorrect'}
                            </span>
                          </div>
                          <div className="text-xs space-y-1 text-muted-foreground mb-3">
                            <p><strong className="text-foreground">Your Answer:</strong> {q.options[selected] || 'Not answered'}</p>
                            {!isCorrect && <p><strong className="text-success">Correct Answer:</strong> {q.options[q.correctAnswer]}</p>}
                          </div>
                          <div className="p-3 rounded-lg bg-secondary/40 text-xs text-muted-foreground border border-border/40">
                            <strong className="text-foreground block mb-0.5">Explanation:</strong>
                            {q.explanation}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4 mt-auto">
              {showAIQuizResults && (
                <button
                  onClick={() => {
                    setAiQuizQuestions([]);
                    setAiQuizTopic('');
                    setShowAIQuizResults(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-secondary/70 transition-colors"
                >
                  Try Another Quiz
                </button>
              )}
              <button
                onClick={() => {
                  setShowAIQuizModal(false);
                  setAiQuizQuestions([]);
                  setAiQuizTopic('');
                  setShowAIQuizResults(false);
                }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* AI Attendance Warning Notice Modal */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-3xl max-h-[85vh] bg-background/95 border border-border rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col gap-6"
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <FileText className="text-primary animate-pulse" size={24} />
                <div>
                  <h3 className="font-extrabold text-foreground text-lg">📧 AI Parent Notice / Defaulter Warning Letter</h3>
                  <p className="text-xs text-muted-foreground">Drafted by LevelUp Academic Coordinator Assistant</p>
                </div>
              </div>
              <button
                onClick={() => { setShowNoticeModal(false); setDraftedNotice(''); }}
                className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="prose prose-invert max-w-none text-sm text-muted-foreground leading-relaxed space-y-4 custom-markdown-styles overflow-y-auto pr-2" style={{ maxHeight: '55vh' }}>
              {loadingNoticeDraft ? (
                <div className="text-center py-12 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="animate-spin text-primary" size={32} />
                  <p className="text-xs text-muted-foreground font-medium">Reviewing student details and composing official warnings...</p>
                </div>
              ) : (
                <ReactMarkdown>{draftedNotice || "Failed to generate draft."}</ReactMarkdown>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4 mt-auto">
              {!loadingNoticeDraft && draftedNotice && (
                <>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(draftedNotice);
                      alert('Copied to clipboard!');
                    }}
                    className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-secondary/70 transition-colors"
                  >
                    Copy Notice
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([draftedNotice], { type: 'text/markdown' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `defaulter_warning_letter.md`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1"
                  >
                    <Download size={14} /> Download Notice
                  </button>
                </>
              )}
              <button
                onClick={() => { setShowNoticeModal(false); setDraftedNotice(''); }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* AI DSA Milestones Modal */}
      {showDSAMilestonesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-3xl max-h-[85vh] bg-background/95 border border-border rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col gap-6"
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="text-accent animate-pulse" size={24} />
                <div>
                  <h3 className="font-extrabold text-foreground text-lg">🎯 AI DSA Milestones & Coaching Plan</h3>
                  <p className="text-xs text-muted-foreground">Generated by LevelUp DSA Assessment Engine</p>
                </div>
              </div>
              <button
                onClick={() => { setShowDSAMilestonesModal(false); setDsaMilestones(''); }}
                className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="prose prose-invert max-w-none text-sm text-muted-foreground leading-relaxed space-y-4 custom-markdown-styles overflow-y-auto pr-2" style={{ maxHeight: '55vh' }}>
              {loadingDSAMilestones ? (
                <div className="text-center py-12 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="animate-spin text-accent" size={32} />
                  <p className="text-xs text-muted-foreground font-medium">Evaluating profile stats & creating specialized coding targets...</p>
                </div>
              ) : (
                <ReactMarkdown>{dsaMilestones || "Failed to generate coaching milestones."}</ReactMarkdown>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4 mt-auto">
              {!loadingDSAMilestones && dsaMilestones && (
                <>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(dsaMilestones);
                      alert('Copied to clipboard!');
                    }}
                    className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-secondary/70 transition-colors"
                  >
                    Copy Plan
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([dsaMilestones], { type: 'text/markdown' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `dsa_milestones_plan.md`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1"
                  >
                    <Download size={14} /> Download Plan
                  </button>
                </>
              )}
              <button
                onClick={() => { setShowDSAMilestonesModal(false); setDsaMilestones(''); }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* CSS for input fields */}
      <style>{`
        .input-field {
          padding: 0.75rem 1rem;
          background: hsl(var(--secondary) / 0.3);
          border: 1px solid hsl(var(--border) / 0.5);
          border-radius: 0.75rem;
          color: hsl(var(--foreground));
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
        }
        .input-field:focus {
          border-color: hsl(var(--primary) / 0.5);
          box-shadow: 0 0 0 3px hsl(var(--primary) / 0.1);
        }
        .input-field::placeholder {
          color: hsl(var(--muted-foreground));
        }
        .custom-markdown-styles h1 { font-size: 1.25rem; font-weight: 800; color: hsl(var(--foreground)); margin-top: 1.5rem; margin-bottom: 0.5rem; }
        .custom-markdown-styles h2 { font-size: 1.1rem; font-weight: 700; color: hsl(var(--foreground)); margin-top: 1.25rem; margin-bottom: 0.5rem; }
        .custom-markdown-styles h3 { font-size: 1rem; font-weight: 600; color: hsl(var(--foreground)); margin-top: 1rem; margin-bottom: 0.25rem; }
        .custom-markdown-styles p { margin-bottom: 0.75rem; line-height: 1.6; }
        .custom-markdown-styles ul { list-style-type: disc; padding-left: 1.25rem; margin-bottom: 0.75rem; }
        .custom-markdown-styles li { margin-bottom: 0.25rem; }
        .custom-markdown-styles strong { color: hsl(var(--foreground)); font-weight: 700; }
        .custom-markdown-styles code { background: hsl(var(--secondary) / 0.5); padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-family: monospace; }
      `}</style>
    </div>
  );
};

export default Assessment;

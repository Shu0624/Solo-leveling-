import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, CalendarDays, TrendingUp, CheckCircle2, AlertTriangle, ChevronRight, Loader2, RotateCcw, Zap, Target, BookOpen, FileText, Square, CheckSquare, Code, Book, MessageCircle, Play } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Roadmap = () => {
  const { api } = useAuth();
  const [targetRole, setTargetRole] = useState('');
  const [targetMonths, setTargetMonths] = useState(3);
  const [experienceLevel, setExperienceLevel] = useState('Beginner');
  const [companyType, setCompanyType] = useState('indian-product');
  const [specificGoals, setSpecificGoals] = useState('');
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resumeSkills, setResumeSkills] = useState([]);
  const [resumeScore, setResumeScore] = useState(null);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [completedWeeklyTasks, setCompletedWeeklyTasks] = useState([]);
  const navigate = useNavigate();

  // Auto-fetch resume skills & existing roadmap on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resumeRes = await api.get('/resume/history');
        if (resumeRes.data.current) {
          setResumeSkills(resumeRes.data.current.skills || []);
          setResumeScore(resumeRes.data.current.score || null);
        }
      } catch (e) {}

      try {
        const roadmapRes = await api.get('/ai/roadmap/current');
        if (roadmapRes.data.roadmap) {
          setRoadmap(roadmapRes.data.roadmap);
          setTargetRole(roadmapRes.data.roadmap.targetRole);
          setCompanyType(roadmapRes.data.roadmap.companyType || 'indian-product');
          setCompletedTasks(roadmapRes.data.roadmap.completedTasks || []);
          setCompletedWeeklyTasks(roadmapRes.data.roadmap.completedWeeklyTasks || []);
        }
      } catch (e) {}
    };
    fetchData();
  }, [api]);

  const generatePlan = async () => {
    if (!targetRole.trim()) {
      return alert('Please type a Target Role (e.g. Frontend Developer, DevOps Engineer) to continue.');
    }
    setLoading(true);
    try {
      const res = await api.post('/ai/roadmap', { targetRole, targetMonths, experienceLevel, specificGoals, companyType });
      setRoadmap(res.data.roadmap);
      setCompletedTasks([]);
      setCompletedWeeklyTasks([]);
    } catch (err) {
      alert('Failed to generate roadmap. Make sure you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId, isWeekly = false) => {
    try {
      // Optimistic UI update
      if (isWeekly) {
        setCompletedWeeklyTasks(prev => prev.includes(taskId) ? prev.filter(t => t !== taskId) : [...prev, taskId]);
      } else {
        setCompletedTasks(prev => prev.includes(taskId) ? prev.filter(t => t !== taskId) : [...prev, taskId]);
      }
      
      // Async save
      await api.put('/ai/roadmap/task', { taskId, isWeekly });
    } catch (e) {
      console.error('Failed to toggle task');
    }
  };

  const priorityConfig = {
    HIGH: { color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30', icon: <Zap size={16} /> },
    MEDIUM: { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30', icon: <Target size={16} /> },
    CRITICAL: { color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30', icon: <AlertTriangle size={16} /> }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative">
      {/* Background */}
      <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <header className="mb-10 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4 text-primary">
          <Rocket size={32} />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-foreground">Career Roadmap</h1>
        <p className="text-muted-foreground">
          Get a personalized study plan based on your resume, goals, and target role.
        </p>
      </header>

      <AnimatePresence mode="wait">
        {!roadmap ? (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto"
          >
            <div className="glass-morphism rounded-3xl p-8 md:p-10">
              <h2 className="text-2xl font-bold mb-8 text-center text-foreground">Configure Your Plan</h2>

              {/* Role & Company Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-3 block uppercase tracking-wider">What is your Target Role?</label>
                  <input 
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="Enter your target role"
                    className="w-full bg-background/50 glass-morphism border border-border/80 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-3 block uppercase tracking-wider">Target Company Tier</label>
                  <select
                    value={companyType}
                    onChange={(e) => setCompanyType(e.target.value)}
                    className="w-full bg-background/50 border border-border/80 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium appearance-none"
                  >
                    <option value="indian-services">IT Services (TCS, Infosys, Wipro, etc.)</option>
                    <option value="indian-product">Product-Based & Startups</option>
                    <option value="faang">Top Tier Tech / FAANG</option>
                    <option value="remote-mnc">Remote / Global MNCs</option>
                  </select>
                </div>
              </div>

              {/* Experience & Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-3 block uppercase tracking-wider">Experience Level</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full bg-background/50 border border-border/80 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium appearance-none"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Professional">Professional</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-3 block uppercase tracking-wider">Timeline</label>
                  <div className="flex gap-2">
                    {[3, 6, 12].map(m => (
                      <button
                        key={m}
                        onClick={() => setTargetMonths(m)}
                        className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 border-2 ${
                          targetMonths === m
                            ? 'border-primary bg-primary/10 text-primary shadow-sm'
                            : 'border-border/50 bg-background/50 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                        }`}
                      >
                        {m} Mo
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Specific Goals */}
              <div className="mb-8">
                <label className="text-sm font-medium text-muted-foreground mb-3 block uppercase tracking-wider">Specific Goals or Focus Areas (Optional)</label>
                <textarea 
                  value={specificGoals}
                  onChange={(e) => setSpecificGoals(e.target.value)}
                  placeholder="Enter your background, current skills, and specific goals..."
                  className="w-full h-24 resize-none bg-background/50 glass-morphism border border-border/80 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
                />
              </div>

              {/* Resume Skills (auto-detected) */}
              {resumeSkills.length > 0 && (
                <div className="mb-8">
                  <label className="text-sm font-medium text-muted-foreground mb-3 block uppercase tracking-wider">
                    Skills from Your Resume
                    {resumeScore && <span className="ml-2 text-primary">(ATS Score: {resumeScore}/100)</span>}
                  </label>
                  <div className="flex flex-wrap gap-2 p-4 bg-success/5 border border-success/20 rounded-2xl">
                    {resumeSkills.map((skill, i) => (
                      <span key={i} className="px-2.5 py-1 bg-success/10 text-success border border-success/20 rounded-lg text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <FileText size={12} /> These skills were detected from your uploaded resume and will feed into your roadmap.
                  </p>
                </div>
              )}
              {resumeSkills.length === 0 && (
                <div className="mb-8 p-4 bg-secondary/50 border border-border/50 rounded-2xl">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <FileText size={16} className="text-primary" />
                    Upload a resume on the <a href="/resume" className="text-primary font-medium hover:underline">Resume Analyzer</a> page to auto-detect your skills for a more accurate roadmap.
                  </p>
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={generatePlan}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
              >
                {loading ? (
                  <><Loader2 className="animate-spin" size={22} /> Generating...</>
                ) : (
                  <><Rocket size={22} /> Generate My Roadmap</>
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Gap Analysis */}
            <div className="glass-morphism rounded-3xl p-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-foreground">
                <TrendingUp className="text-primary" size={22} /> Gap Analysis
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Strengths */}
                <div className="bg-success/5 border border-success/20 rounded-2xl p-5">
                  <h4 className="font-bold text-success flex items-center gap-2 mb-3 text-sm">
                    <CheckCircle2 size={16} /> Your Strengths
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {roadmap.gapAnalysis.currentStrengths.length > 0
                      ? roadmap.gapAnalysis.currentStrengths.map((s, i) => (
                          <span key={i} className="px-2.5 py-1 bg-success/10 text-success border border-success/20 rounded-lg text-xs font-medium">
                            {s}
                          </span>
                        ))
                      : <span className="text-muted-foreground text-sm">Upload a resume to detect skills</span>
                    }
                  </div>
                </div>

                {/* Skills to Learn */}
                <div className="bg-warning/5 border border-warning/20 rounded-2xl p-5">
                  <h4 className="font-bold text-warning flex items-center gap-2 mb-3 text-sm">
                    <AlertTriangle size={16} /> Skills to Learn
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {roadmap.gapAnalysis.skillsToLearn.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 bg-warning/10 text-warning border border-warning/20 rounded-lg text-xs font-medium">
                        + {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Readiness */}
                <div className="flex items-center justify-center bg-background/50 border border-border/50 rounded-2xl p-5">
                  <div className="text-center">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Readiness</div>
                    <div className={`text-xl font-extrabold ${
                      roadmap.gapAnalysis.estimatedReadiness === 'On Track' ? 'text-success' : 'text-warning'
                    }`}>
                      {roadmap.gapAnalysis.estimatedReadiness}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phases */}
            <div className="space-y-4">
              {roadmap.phases.map((phase, i) => {
                const config = priorityConfig[phase.priority] || priorityConfig.MEDIUM;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className={`glass-morphism rounded-2xl p-6 md:p-8 border-l-4 ${config.border}`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <BookOpen size={18} className="text-primary" />
                        Phase {i + 1}: {phase.name}
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${config.bg} ${config.color} flex items-center gap-1.5`}>
                          {config.icon} {phase.priority}
                        </span>
                        <span className="text-sm font-medium text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg">
                          {phase.months}
                        </span>
                      </div>
                    </div>
                    <ul className="space-y-3">
                      {phase.tasks.map((task, j) => (
                        <li key={j} className="flex items-start gap-3 text-sm text-foreground">
                          <button 
                            onClick={() => toggleTask(`${i}-${j}`)}
                            className="text-primary mt-0.5 flex-shrink-0 hover:scale-110 transition-transform"
                          >
                            {completedTasks.includes(`${i}-${j}`) ? <CheckSquare size={18} /> : <Square size={18} className="opacity-50" />}
                          </button>
                          <span className={`leading-relaxed ${completedTasks.includes(`${i}-${j}`) ? 'line-through opacity-50' : ''}`}>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })}
            </div>

            {/* Weekly Plan */}
            <div className="glass-morphism rounded-3xl p-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-foreground">
                <CalendarDays className="text-accent" size={22} /> Suggested Weekly Plan
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                {roadmap.weeklyPlan && Object.entries(roadmap.weeklyPlan).map(([day, activity]) => (
                  <div 
                    key={day} 
                    onClick={() => toggleTask(day, true)}
                    className={`bg-background/50 border rounded-xl p-4 transition-all cursor-pointer ${
                      completedWeeklyTasks.includes(day) ? 'border-success/50 opacity-60' : 'border-border/50 hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                       <span className="font-bold text-primary text-sm capitalize">{day}</span>
                       {completedWeeklyTasks.includes(day) && <CheckCircle2 size={14} className="text-success" />}
                    </div>
                    <div className={`text-xs leading-relaxed ${completedWeeklyTasks.includes(day) ? 'text-muted-foreground' : 'text-foreground'}`}>{activity}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* NEW: Portfolio Projects */}
            {roadmap.portfolioProjects && roadmap.portfolioProjects.length > 0 && (
              <div className="glass-morphism rounded-3xl p-8">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-foreground">
                  <Code className="text-primary" size={22} /> Recommended Portfolio Projects
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {roadmap.portfolioProjects.map((p, i) => (
                    <div key={i} className="bg-background/50 border border-border/50 rounded-2xl p-5 hover:border-primary/30 transition-all flex flex-col">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-base">{p.name}</h4>
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-secondary rounded-md">{p.difficulty}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-4 flex-1">{p.description}</p>
                      <div className="pt-4 border-t border-border/50">
                        <span className="text-[11px] font-mono text-primary bg-primary/10 px-2 py-1 rounded inline-block">
                          {p.techStack}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NEW: Learning Resources */}
            {roadmap.recommendedResources && roadmap.recommendedResources.length > 0 && (
              <div className="glass-morphism rounded-3xl p-8">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-foreground">
                  <Book className="text-accent" size={22} /> Recommended Resources
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roadmap.recommendedResources.map((res, i) => (
                    <div key={i} className="flex gap-4 items-start p-4 bg-background/50 border border-border/30 rounded-xl hover:bg-secondary/20 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
                        <BookOpen size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm mb-1">{res.name}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{res.description}</p>
                        <span className="text-[10px] bg-secondary px-2 py-0.5 rounded text-secondary-foreground uppercase">{res.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NEW: Interview Focus */}
            {roadmap.interviewFocus && roadmap.interviewFocus.length > 0 && (
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                  <MessageCircle size={150} />
                </div>
                <div className="relative z-10 w-full md:w-2/3">
                  <h2 className="text-2xl font-bold mb-3 flex items-center gap-2 text-foreground">
                    Interview Focus Topics
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Based on your targeted company type, these are the core topics you will almost certainly be tested on. Add these to your active flashcards and mock interviews.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {roadmap.interviewFocus.map((topic, i) => (
                      <span key={i} className="px-3 py-1.5 bg-background shadow-sm border border-border/50 rounded-lg text-sm font-medium">
                        {topic}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => navigate('/interview', { state: { autoStartTopic: roadmap.interviewFocus[0] } })}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                  >
                    <Play size={18} fill="currentColor" /> Let's practice now
                  </button>
                </div>
              </div>
            )}

            {/* Reset Button */}
            <button
              onClick={() => setRoadmap(null)}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors mx-auto"
            >
              <RotateCcw size={16} /> Generate New Roadmap
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Roadmap;

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Plus, Trash2, Download, Save, Sparkles, Send, Bot, User, Loader2, ArrowLeft, Briefcase, GraduationCap, Award, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { jsPDF } from 'jspdf';

const EMPTY_RESUME = {
  fullName: '', phone: '', email: '', location: '', linkedin: '', github: '', summary: '',
  skills: { languages: [], frontend: [], backend: [], ai: [], databases: [], tools: [], concepts: [] },
  experience: [], projects: [], education: [], certifications: [], achievements: []
};

const ResumeBuilder = () => {
  const { api, user } = useAuth();
  const [resume, setResume] = useState(EMPTY_RESUME);
  const [tab, setTab] = useState('form');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiChat, setAiChat] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [expandedSections, setExpandedSections] = useState({ personal: true, skills: true, experience: true, projects: true, education: true, extra: true });

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const res = await api.get('/resume/draft');
        if (res.data) {
          setResume(prev => ({ ...prev, ...res.data }));
        } else if (user) {
          setResume(prev => ({ ...prev, fullName: user.name || '', email: user.email || '' }));
        }
      } catch { if (user) setResume(prev => ({ ...prev, fullName: user.name || '', email: user.email || '' })); }
    };
    loadDraft();
  }, [api, user]);

  const update = (field, value) => setResume(prev => ({ ...prev, [field]: value }));
  const updateSkill = (cat, value) => setResume(prev => ({ ...prev, skills: { ...prev.skills, [cat]: value.split(',').map(s => s.trim()).filter(Boolean) } }));

  const addItem = (field) => {
    const templates = { experience: { title: '', company: '', dateRange: '', bullets: [''] }, projects: { name: '', techStack: '', description: '', bullets: [''] }, education: { degree: '', institution: '', cgpa: '', year: '' } };
    setResume(prev => ({ ...prev, [field]: [...prev[field], templates[field]] }));
  };

  const updateItem = (field, idx, key, val) => {
    setResume(prev => { const arr = [...prev[field]]; arr[idx] = { ...arr[idx], [key]: val }; return { ...prev, [field]: arr }; });
  };

  const removeItem = (field, idx) => {
    setResume(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== idx) }));
  };

  const updateBullet = (field, idx, bIdx, val) => {
    setResume(prev => { const arr = [...prev[field]]; const bullets = [...arr[idx].bullets]; bullets[bIdx] = val; arr[idx] = { ...arr[idx], bullets }; return { ...prev, [field]: arr }; });
  };

  const addBullet = (field, idx) => {
    setResume(prev => { const arr = [...prev[field]]; arr[idx] = { ...arr[idx], bullets: [...arr[idx].bullets, ''] }; return { ...prev, [field]: arr }; });
  };

  const saveDraft = async () => {
    setSaving(true);
    try { await api.post('/resume/save-draft', resume); setSaved(true); setTimeout(() => setSaved(false), 2000); } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const sendAiMessage = async () => {
    if (!aiInput.trim() || aiLoading) return;
    const userMsg = { role: 'user', content: aiInput.trim() };
    const newChat = [...aiChat, userMsg];
    setAiChat(newChat); setAiInput(''); setAiLoading(true);
    try {
      const botReply = getBotReply(newChat);
      setAiChat(prev => [...prev, { role: 'assistant', content: botReply }]);
    } catch { setAiChat(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }]); }
    finally { setAiLoading(false); }
  };

  const getBotReply = (chat) => {
    const len = chat.filter(m => m.role === 'user').length;
    const questions = [
      "Great! What's your full name, email, phone number, and location?",
      "What are your key technical skills? (e.g., JavaScript, React, Python, MongoDB, etc.)",
      "Tell me about your work experience or internships. Include company name, role, duration, and what you did.",
      "Describe your top 2-3 projects. Include name, tech stack, and key achievements.",
      "What's your educational background? (degree, college, CGPA, year)",
      "Any certifications or achievements? (e.g., Google Cloud, AWS, hackathon wins)",
      "I have all the info I need! Click the **'Generate with AI'** button below to build your resume."
    ];
    return len <= questions.length ? questions[len - 1] : questions[questions.length - 1];
  };

  const generateWithAI = async () => {
    if (aiChat.length < 2) return;
    setGenerating(true);
    try {
      const res = await api.post('/resume/ai-build', { messages: aiChat });
      if (res.data.resume) { setResume(prev => ({ ...prev, ...res.data.resume })); setTab('form'); }
    } catch (e) { console.error(e); setAiChat(prev => [...prev, { role: 'assistant', content: 'AI generation failed. Please fill the form manually.' }]); }
    finally { setGenerating(false); }
  };

  const downloadPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const W = 210, M = 15; let y = 15;
    const addLine = () => { doc.setDrawColor(40, 100, 200); doc.setLineWidth(0.5); doc.line(M, y, W - M, y); y += 4; };
    const section = (title) => { y += 3; doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(30, 70, 160); doc.text(title.toUpperCase(), M, y); y += 1; addLine(); doc.setTextColor(30, 30, 30); };
    const checkPage = (needed = 12) => { if (y + needed > 280) { doc.addPage(); y = 15; } };

    // Header
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(20, 20, 20);
    doc.text(resume.fullName || 'Your Name', W / 2, y, { align: 'center' }); y += 7;
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
    const contactParts = [resume.phone, resume.email, resume.location, resume.linkedin, resume.github].filter(Boolean);
    doc.text(contactParts.join('  |  '), W / 2, y, { align: 'center' }); y += 5;
    addLine();

    // Summary
    if (resume.summary) { section('Summary'); doc.setFontSize(9); doc.setFont('helvetica', 'normal'); const lines = doc.splitTextToSize(resume.summary, W - 2 * M); doc.text(lines, M, y); y += lines.length * 4 + 2; }

    // Skills
    const skillEntries = Object.entries(resume.skills).filter(([, v]) => v.length > 0);
    if (skillEntries.length > 0) { section('Skills'); doc.setFontSize(9); skillEntries.forEach(([cat, vals]) => { checkPage(); doc.setFont('helvetica', 'bold'); doc.text(`${cat.charAt(0).toUpperCase() + cat.slice(1)}: `, M, y); doc.setFont('helvetica', 'normal'); doc.text(vals.join(', '), M + doc.getTextWidth(`${cat}: `) + 1, y); y += 5; }); }

    // Experience
    if (resume.experience.length > 0) { section('Experience'); resume.experience.forEach(exp => { checkPage(20); doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.text(exp.title || '', M, y); doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.text(exp.dateRange || '', W - M, y, { align: 'right' }); y += 4.5; doc.setFont('helvetica', 'italic'); doc.text(exp.company || '', M, y); y += 4.5; doc.setFont('helvetica', 'normal'); (exp.bullets || []).filter(Boolean).forEach(b => { checkPage(); const lines = doc.splitTextToSize(`• ${b}`, W - 2 * M - 3); doc.text(lines, M + 3, y); y += lines.length * 4; }); y += 2; }); }

    // Projects
    if (resume.projects.length > 0) { section('Projects'); resume.projects.forEach(p => { checkPage(20); doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.text(`• ${p.name || ''}`, M, y); y += 4.5; doc.setFontSize(9); doc.setFont('helvetica', 'normal'); if (p.techStack) { doc.setFont('helvetica', 'bold'); doc.text(`Tech Stack: ${p.techStack}`, M + 3, y); y += 4; doc.setFont('helvetica', 'normal'); } if (p.description) { const lines = doc.splitTextToSize(p.description, W - 2 * M - 3); doc.text(lines, M + 3, y); y += lines.length * 4; } (p.bullets || []).filter(Boolean).forEach(b => { checkPage(); const lines = doc.splitTextToSize(`• ${b}`, W - 2 * M - 3); doc.text(lines, M + 3, y); y += lines.length * 4; }); y += 2; }); }

    // Education
    if (resume.education.length > 0) { section('Education'); resume.education.forEach(e => { checkPage(); doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.text(e.degree || '', M, y); doc.setFont('helvetica', 'normal'); doc.text(e.year || '', W - M, y, { align: 'right' }); y += 4.5; doc.text(`${e.institution || ''}${e.cgpa ? ' — CGPA: ' + e.cgpa : ''}`, M, y); y += 5; }); }

    // Certifications
    if (resume.certifications.length > 0) { section('Certifications'); doc.setFontSize(9); doc.setFont('helvetica', 'normal'); resume.certifications.filter(Boolean).forEach(c => { checkPage(); doc.text(`• ${c}`, M, y); y += 4.5; }); }

    // Achievements
    if (resume.achievements.length > 0) { section('Achievements'); doc.setFontSize(9); doc.setFont('helvetica', 'normal'); resume.achievements.filter(Boolean).forEach(a => { checkPage(); doc.text(`• ${a}`, M, y); y += 4.5; }); }

    doc.save(`${(resume.fullName || 'resume').replace(/\s+/g, '_')}_Resume.pdf`);
  };

  const toggleSection = (s) => setExpandedSections(prev => ({ ...prev, [s]: !prev[s] }));

  const SectionHeader = ({ id, icon: Icon, title, count }) => (
    <button onClick={() => toggleSection(id)} className="w-full flex items-center justify-between py-3 px-1 group">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-primary" />
        <h3 className="font-bold text-sm text-foreground">{title}</h3>
        {count !== undefined && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{count}</span>}
      </div>
      {expandedSections[id] ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
    </button>
  );

  const inputCls = "w-full bg-secondary/30 border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-foreground placeholder:text-muted-foreground";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <header className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link to="/resume" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mb-2"><ArrowLeft size={12} /> Back to Analyzer</Link>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">Resume Builder</h1>
          <p className="text-sm text-muted-foreground mt-1">Build a professional ATS-optimized resume with AI assistance</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={saveDraft} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 transition-all border border-border/50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {saved ? 'Saved!' : 'Save Draft'}
          </button>
          <button onClick={downloadPDF} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 shadow-lg shadow-primary/20 transition-all">
            <Download size={14} /> Download PDF
          </button>
        </div>
      </header>

      {/* Tab Toggle */}
      <div className="flex gap-1 p-1 bg-secondary/30 rounded-xl mb-6 w-fit border border-border/40">
        {[['form', 'Manual Editor', FileText], ['ai', 'AI Assistant', Bot]].map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${tab === key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === 'ai' ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-morphism rounded-2xl overflow-hidden max-w-2xl mx-auto border border-border/50">
          <div className="bg-background/80 px-5 py-4 border-b border-border/50 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary"><Bot size={18} /></div>
            <div><h3 className="font-bold text-sm">AI Resume Agent</h3><p className="text-[10px] text-muted-foreground">Answer questions to auto-generate your resume</p></div>
          </div>
          <div className="h-[400px] overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {aiChat.length === 0 && (
              <div className="text-center py-8">
                <Bot size={32} className="mx-auto mb-3 text-primary/40" />
                <p className="text-sm text-muted-foreground">Hi! I'll help you build your resume. Tell me about yourself to get started!</p>
              </div>
            )}
            {aiChat.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-2.5 text-sm rounded-2xl ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-secondary/80 border border-border/50 rounded-tl-sm'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {aiLoading && <div className="flex justify-start"><div className="bg-secondary/80 border border-border/50 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-muted-foreground animate-pulse">Thinking...</div></div>}
          </div>
          <div className="p-3 bg-background/80 border-t border-border/50 space-y-2">
            <div className="flex gap-2">
              <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendAiMessage(); }} placeholder="Type your answer..." className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <button onClick={sendAiMessage} disabled={!aiInput.trim()} className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-40"><Send size={16} /></button>
            </div>
            {aiChat.length >= 4 && (
              <button onClick={generateWithAI} disabled={generating} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} {generating ? 'Generating...' : 'Generate Resume with AI'}
              </button>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Personal Info */}
          <div className="glass-morphism rounded-2xl p-5 border border-border/50">
            <SectionHeader id="personal" icon={User} title="Personal Information" />
            {expandedSections.personal && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <input value={resume.fullName} onChange={e => update('fullName', e.target.value)} placeholder="Full Name" className={inputCls} />
                <input value={resume.email} onChange={e => update('email', e.target.value)} placeholder="Email" className={inputCls} />
                <input value={resume.phone} onChange={e => update('phone', e.target.value)} placeholder="Phone" className={inputCls} />
                <input value={resume.location} onChange={e => update('location', e.target.value)} placeholder="Location" className={inputCls} />
                <input value={resume.linkedin} onChange={e => update('linkedin', e.target.value)} placeholder="LinkedIn URL" className={inputCls} />
                <input value={resume.github} onChange={e => update('github', e.target.value)} placeholder="GitHub URL" className={inputCls} />
                <textarea value={resume.summary} onChange={e => update('summary', e.target.value)} placeholder="Professional Summary (2-3 sentences)" className={`${inputCls} md:col-span-2 h-20 resize-none`} />
              </div>
            )}
          </div>

          {/* Skills */}
          <div className="glass-morphism rounded-2xl p-5 border border-border/50">
            <SectionHeader id="skills" icon={Award} title="Skills" />
            {expandedSections.skills && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {Object.keys(resume.skills).map(cat => (
                  <div key={cat}>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">{cat}</label>
                    <input value={(resume.skills[cat] || []).join(', ')} onChange={e => updateSkill(cat, e.target.value)} placeholder={`e.g. React, Node.js`} className={inputCls} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Experience */}
          <div className="glass-morphism rounded-2xl p-5 border border-border/50">
            <SectionHeader id="experience" icon={Briefcase} title="Experience" count={resume.experience.length} />
            {expandedSections.experience && (
              <div className="space-y-4 mt-3">
                {resume.experience.map((exp, i) => (
                  <div key={i} className="bg-secondary/20 rounded-xl p-4 border border-border/30 relative">
                    <button onClick={() => removeItem('experience', i)} className="absolute top-3 right-3 text-destructive/60 hover:text-destructive"><Trash2 size={14} /></button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                      <input value={exp.title} onChange={e => updateItem('experience', i, 'title', e.target.value)} placeholder="Job Title" className={inputCls} />
                      <input value={exp.company} onChange={e => updateItem('experience', i, 'company', e.target.value)} placeholder="Company" className={inputCls} />
                      <input value={exp.dateRange} onChange={e => updateItem('experience', i, 'dateRange', e.target.value)} placeholder="Date Range" className={`${inputCls} md:col-span-2`} />
                    </div>
                    {(exp.bullets || []).map((b, bi) => (
                      <input key={bi} value={b} onChange={e => updateBullet('experience', i, bi, e.target.value)} placeholder={`Bullet point ${bi + 1}`} className={`${inputCls} mb-1`} />
                    ))}
                    <button onClick={() => addBullet('experience', i)} className="text-xs text-primary font-bold mt-1">+ Add bullet</button>
                  </div>
                ))}
                <button onClick={() => addItem('experience')} className="w-full py-2.5 rounded-xl border-2 border-dashed border-border/50 text-muted-foreground hover:text-primary hover:border-primary/50 text-xs font-bold flex items-center justify-center gap-2 transition-all"><Plus size={14} /> Add Experience</button>
              </div>
            )}
          </div>

          {/* Projects */}
          <div className="glass-morphism rounded-2xl p-5 border border-border/50">
            <SectionHeader id="projects" icon={FileText} title="Projects" count={resume.projects.length} />
            {expandedSections.projects && (
              <div className="space-y-4 mt-3">
                {resume.projects.map((p, i) => (
                  <div key={i} className="bg-secondary/20 rounded-xl p-4 border border-border/30 relative">
                    <button onClick={() => removeItem('projects', i)} className="absolute top-3 right-3 text-destructive/60 hover:text-destructive"><Trash2 size={14} /></button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                      <input value={p.name} onChange={e => updateItem('projects', i, 'name', e.target.value)} placeholder="Project Name" className={inputCls} />
                      <input value={p.techStack} onChange={e => updateItem('projects', i, 'techStack', e.target.value)} placeholder="Tech Stack" className={inputCls} />
                      <textarea value={p.description} onChange={e => updateItem('projects', i, 'description', e.target.value)} placeholder="Description" className={`${inputCls} md:col-span-2 h-16 resize-none`} />
                    </div>
                    {(p.bullets || []).map((b, bi) => (
                      <input key={bi} value={b} onChange={e => updateBullet('projects', i, bi, e.target.value)} placeholder={`Bullet ${bi + 1}`} className={`${inputCls} mb-1`} />
                    ))}
                    <button onClick={() => addBullet('projects', i)} className="text-xs text-primary font-bold mt-1">+ Add bullet</button>
                  </div>
                ))}
                <button onClick={() => addItem('projects')} className="w-full py-2.5 rounded-xl border-2 border-dashed border-border/50 text-muted-foreground hover:text-primary hover:border-primary/50 text-xs font-bold flex items-center justify-center gap-2 transition-all"><Plus size={14} /> Add Project</button>
              </div>
            )}
          </div>

          {/* Education */}
          <div className="glass-morphism rounded-2xl p-5 border border-border/50">
            <SectionHeader id="education" icon={GraduationCap} title="Education" count={resume.education.length} />
            {expandedSections.education && (
              <div className="space-y-4 mt-3">
                {resume.education.map((e, i) => (
                  <div key={i} className="bg-secondary/20 rounded-xl p-4 border border-border/30 relative">
                    <button onClick={() => removeItem('education', i)} className="absolute top-3 right-3 text-destructive/60 hover:text-destructive"><Trash2 size={14} /></button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input value={e.degree} onChange={ev => updateItem('education', i, 'degree', ev.target.value)} placeholder="Degree" className={inputCls} />
                      <input value={e.institution} onChange={ev => updateItem('education', i, 'institution', ev.target.value)} placeholder="Institution" className={inputCls} />
                      <input value={e.cgpa} onChange={ev => updateItem('education', i, 'cgpa', ev.target.value)} placeholder="CGPA / Percentage" className={inputCls} />
                      <input value={e.year} onChange={ev => updateItem('education', i, 'year', ev.target.value)} placeholder="Year" className={inputCls} />
                    </div>
                  </div>
                ))}
                <button onClick={() => addItem('education')} className="w-full py-2.5 rounded-xl border-2 border-dashed border-border/50 text-muted-foreground hover:text-primary hover:border-primary/50 text-xs font-bold flex items-center justify-center gap-2 transition-all"><Plus size={14} /> Add Education</button>
              </div>
            )}
          </div>

          {/* Certifications & Achievements */}
          <div className="glass-morphism rounded-2xl p-5 border border-border/50">
            <SectionHeader id="extra" icon={Trophy} title="Certifications & Achievements" />
            {expandedSections.extra && (
              <div className="space-y-3 mt-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Certifications (one per line)</label>
                  <textarea value={(resume.certifications || []).join('\n')} onChange={e => update('certifications', e.target.value.split('\n').filter(Boolean))} placeholder="Google Cloud Associate\nAWS Certified" className={`${inputCls} h-20 resize-none`} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Achievements (one per line)</label>
                  <textarea value={(resume.achievements || []).join('\n')} onChange={e => update('achievements', e.target.value.split('\n').filter(Boolean))} placeholder="3X Google Student Ambassador\nHackathon Winner" className={`${inputCls} h-20 resize-none`} />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ResumeBuilder;

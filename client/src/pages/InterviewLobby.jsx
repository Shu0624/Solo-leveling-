import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bot, Users, Send, Video, ArrowRight, RefreshCw, Briefcase, Coffee, Code2, Calculator, Mic, MicOff, Volume2, VolumeX, History, Database, Globe, Server, Layout, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageLearning from '../components/learning/LanguageLearning';
import LanguageHubEmbed from '../components/learning/LanguageHubEmbed';
import InterviewHistory from './InterviewHistory';

const InterviewLobby = () => {
  const navigate = useNavigate();
  const { api } = useAuth();
  const [mode, setMode] = useState('ai'); // 'ai', 'peer', or 'history'
  const [roomId, setRoomId] = useState('');

  // AI Chat state
  const [topic, setTopic] = useState('hr');
  const [projectDescription, setProjectDescription] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Voice mode state
  const [voiceMode, setVoiceMode] = useState(false);
  const [listening, setListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [accent, setAccent] = useState('en-IN');
  const recognitionRef = useRef(null);

  // Session tracking
  const sessionStartRef = useRef(null);
  const [scores, setScores] = useState([]); // Score per answer (1-10)

  const topics = [
    { value: 'hr', label: 'Behavioral', icon: <Briefcase size={20}/>, desc: 'Focus on STAR method & leadership' },
    { value: 'java', label: 'Java Core', icon: <Coffee size={20}/>, desc: 'OOP, Collections, Multithreading' },
    { value: 'python', label: 'Python', icon: <Code2 size={20}/>, desc: 'Data structures & pythonic idioms' },
    { value: 'dsa', label: 'DSA', icon: <Calculator size={20}/>, desc: 'Algorithms & Big-O complexity' },
    { value: 'fullstack', label: 'MERN Stack', icon: <Globe size={20}/>, desc: 'React, Node, DBs & Architecture' },
    { value: 'os', label: 'Operating Systems', icon: <Server size={20}/>, desc: 'Memory, Processes, Threads' },
    { value: 'dbms', label: 'DBMS', icon: <Database size={20}/>, desc: 'ACID, Normalization, Transactions' },
    { value: 'cn', label: 'Computer Networks', icon: <Globe size={20}/>, desc: 'OSI Model, TCP/IP, Protocols' },
    { value: 'project', label: 'Project Demo', icon: <Layout size={20}/>, desc: 'Submit project summary, get grilled on architecture & design decisions' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, chatLoading]);

  // Auto-grow input textarea height dynamically as the user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 250)}px`;
    }
  }, [input]);

  // Pre-load speech synthesis voices (Chrome loads them async)
  useEffect(() => {
    const loadVoices = () => window.speechSynthesis?.getVoices();
    loadVoices();
    window.speechSynthesis?.addEventListener?.('voiceschanged', loadVoices);
    return () => window.speechSynthesis?.removeEventListener?.('voiceschanged', loadVoices);
  }, []);

  // Auto-speak new AI messages when TTS is enabled
  useEffect(() => {
    if (messages.length > 0 && ttsEnabled) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'ai') {
        window.speechSynthesis.cancel();
        const cleanText = lastMsg.text.replace(/\*\*/g, '').replace(/---/g, '').replace(/💡|🎉|🤔|🔥/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        const selectedVoice = pickVoiceForAccent(accent);
        if (selectedVoice) utterance.voice = selectedVoice;
        else utterance.lang = accent;
        // Accent-specific speech params for natural differentiation
        const params = { 'en-IN': { rate: 1.0, pitch: 1.02 }, 'en-GB': { rate: 0.92, pitch: 0.95 }, 'en-US': { rate: 0.95, pitch: 1.05 } };
        const p = params[accent] || params['en-US'];
        utterance.rate = p.rate;
        utterance.pitch = p.pitch;
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [messages, ttsEnabled, accent]);

  const startPeerRoom = () => {
    const id = roomId.trim() || `room-${Date.now().toString(36)}`;
    navigate(`/interview/${id}`);
  };

  const sendMessage = async () => {
    if (!input.trim() || chatLoading) return;
    const userMsg = input.trim();
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);

    try {
      const res = await api.post('/chat', { topic, message: userMsg, questionIndex, projectDescription, history: messages });
      const aiScore = res.data.score || 0;
      setMessages(prev => [...prev, { role: 'ai', text: res.data.message, score: aiScore }]);
      if (aiScore > 0) setScores(prev => [...prev, aiScore]);
      setQuestionIndex(res.data.nextQuestionIndex);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Connection interrupted. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // --- Shared voice picker ---
  const pickVoiceForAccent = (targetAccent) => {
    const voices = window.speechSynthesis.getVoices();
    // Broad regex patterns covering Google, Microsoft, Apple voices
    const regionVoices = {
      'en-IN': { names: /heera|neerja|ravi|veena|priya|indian|hindi|Google हिन्दी|Microsoft Heera|Microsoft Neerja/i, female: /heera|neerja|veena|priya/i },
      'en-GB': { names: /hazel|susan|george|fiona|libby|maisie|british|UK|Google UK|Microsoft Hazel|Microsoft Susan|Microsoft Libby/i, female: /hazel|susan|fiona|libby|maisie/i },
      'en-US': { names: /zira|jenny|aria|david|mark|samantha|Google US|Microsoft Zira|Microsoft Jenny|Microsoft Aria/i, female: /zira|jenny|aria|samantha/i }
    };
    const region = regionVoices[targetAccent] || regionVoices['en-US'];

    // Step 1: Exact locale match (e.g. lang === 'en-IN')
    let langVoices = voices.filter(v => v.lang === targetAccent);
    // Step 2: Also match en-IN variants like 'en_IN'
    if (langVoices.length === 0) langVoices = voices.filter(v => v.lang.replace('_', '-') === targetAccent);
    // Step 3: Name-based match
    if (langVoices.length === 0) langVoices = voices.filter(v => region.names.test(v.name));
    // Step 4: Broadest fallback — but ONLY if nothing else worked
    if (langVoices.length === 0) langVoices = voices.filter(v => v.lang.startsWith('en'));

    // Prefer female voice
    const femaleVoice = langVoices.find(v => region.female.test(v.name)) || langVoices.find(v => /female/i.test(v.name));
    const match = femaleVoice || langVoices[0];
    console.log(`[TTS] Accent: ${targetAccent}, Selected: ${match?.name} (${match?.lang}), Available for locale: ${voices.filter(v => v.lang === targetAccent).map(v => v.name).join(', ') || 'none'}`);
    return match || null;
  };

  // --- Voice: Text-to-Speech ---
  const speakText = (text) => {
    if (!ttsEnabled) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/\*\*/g, '').replace(/---/g, '').replace(/💡|🎉|🤔|🔥/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const selectedVoice = pickVoiceForAccent(accent);
    if (selectedVoice) utterance.voice = selectedVoice;
    else utterance.lang = accent;
    const params = { 'en-IN': { rate: 1.0, pitch: 1.02 }, 'en-GB': { rate: 0.92, pitch: 0.95 }, 'en-US': { rate: 0.95, pitch: 1.05 } };
    const p = params[accent] || params['en-US'];
    utterance.rate = p.rate;
    utterance.pitch = p.pitch;
    window.speechSynthesis.speak(utterance);
  };

  // --- Voice: Speech-to-Text ---
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please use Chrome.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = accent;

    recognition.onresult = (event) => {
      let currentTranscript = '';
      // Accumulate all transcript pieces (works better across Chrome/Edge edge-cases)
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setInput(currentTranscript);
      
      // Stop listening automatically if the browser dictates this is the final result
      if (event.results[0] && event.results[0].isFinal) {
        setListening(false);
      }
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const startChat = () => {
    setChatStarted(true);
    setMessages([]);
    setQuestionIndex(0);
    sessionStartRef.current = Date.now();
    // Auto-send greeting
    setTimeout(async () => {
      setChatLoading(true);
      try {
        const res = await api.post('/chat', { topic, message: 'Start', questionIndex: 0, projectDescription });
        setMessages([{ role: 'ai', text: res.data.message }]);
        setQuestionIndex(res.data.nextQuestionIndex);
      } catch (err) {
        setMessages([{ role: 'ai', text: 'Welcome to your mock interview. Tell me when you are ready.' }]);
      } finally {
        setChatLoading(false);
      }
    }, 500);
  };

  const resetChat = async () => {
    // Save session before resetting
    if (chatStarted && messages.length > 1 && sessionStartRef.current) {
      const durationSeconds = Math.round((Date.now() - sessionStartRef.current) / 1000);
      const userMsgCount = messages.filter(m => m.role === 'user').length;
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) : 0; // Convert 1-10 to percentage
      try {
        await api.post('/interview/session', {
          topic,
          messagesCount: userMsgCount,
          durationSeconds,
          score: avgScore
        });
      } catch (e) {
        // silent fail — don't block UX
      }
    }
    setChatStarted(false);
    setMessages([]);
    setQuestionIndex(0);
    setScores([]);
    sessionStartRef.current = null;
  };

  return (
    <div className={`animate-fade-in relative ${mode === 'ai' && chatStarted ? 'h-[calc(100vh-64px)] flex flex-col px-2 sm:px-4 py-2' : 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
      {/* Dynamic Background Blurs */}
      <div className="absolute top-20 left-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      
      {!(mode === 'ai' && chatStarted) && (
        <header className="mb-10 text-center max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Interview Studio</h1>
          <p className="text-muted-foreground mb-4">Practice your communication skills with mock interviews or peer-to-peer video sessions.</p>
        </header>
      )}

      {!(mode === 'ai' && chatStarted) && (
        <div className="flex justify-center mb-10">
          <div className="flex bg-background/50 p-1.5 rounded-2xl border border-border/50 shadow-sm backdrop-blur-md">
            {[
              { key: 'ai', label: 'Mock Interview', icon: <Bot size={18} /> },
              { key: 'peer', label: 'Peer Video Room', icon: <Users size={18} /> },
              { key: 'history', label: 'Practice History', icon: <History size={18} /> }
            ].map(m => (
              <button 
                key={m.key} 
                onClick={() => setMode(m.key)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  mode === m.key 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                {m.icon} <span className="hidden sm:inline">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== AI INTERVIEW MODE ===== */}
      {mode === 'ai' && !chatStarted && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto w-full"
        >
          <div className="glass-morphism rounded-3xl p-8 md:p-12 text-center">
            <h2 className="text-2xl font-bold mb-3">Select Your Domain</h2>
            <p className="text-muted-foreground mb-8">Choose a topic to begin a simulated technical or behavioral screening.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {topics.map(t => (
                <button 
                  key={t.value} 
                  onClick={() => setTopic(t.value)}
                  className={`text-left p-5 flex items-start gap-4 rounded-2xl border-2 transition-all duration-300 ${
                    t.value === 'project' ? 'md:col-span-2 lg:col-span-4' : ''
                  } ${
                    topic === t.value 
                      ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 scale-[1.02]' 
                      : 'border-border/50 bg-background/50 hover:border-primary/50 hover:-translate-y-0.5'
                  }`}
                >
                  <div className={`p-3 rounded-xl shrink-0 transition-colors ${
                    topic === t.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                  }`}>
                    {t.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold mb-0.5 text-foreground">{t.label}</h3>
                    <p className="text-xs text-muted-foreground leading-snug">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            
            {topic === 'project' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-8 text-left"
              >
                <label className="block text-sm font-semibold mb-2 ml-1 text-foreground">Project Summary & Tech Stack</label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Enter details about your background and experience..."
                  className="w-full bg-background/80 backdrop-blur-sm border border-border rounded-xl px-4 py-3 min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm shadow-inner transition-shadow"
                />
              </motion.div>
            )}

            <button 
              onClick={startChat} 
              disabled={topic === 'project' && projectDescription.trim().length < 20}
              className={`w-full sm:w-auto px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:opacity-90 transition-all flex items-center justify-center gap-2 mx-auto text-lg ${topic === 'project' && projectDescription.trim().length < 20 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Bot size={22} /> Initiate Session
            </button>
          </div>
        </motion.div>
      )}

      {mode === 'ai' && chatStarted && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-6xl mx-auto flex-1 flex flex-col glass-morphism rounded-2xl overflow-hidden shadow-2xl border border-border/50 relative"
        >
          {/* Chat Header */}
          <div className="bg-background/80 backdrop-blur-md px-6 py-4 flex justify-between items-center z-10 border-b border-border/50">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-primary-foreground shadow-lg">
                  <Bot size={24} />
                </div>
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-success border-2 border-background rounded-full"></div>
              </div>
              <div>
                <h2 className="font-bold text-foreground">Interview Mentor</h2>
                <p className="text-xs text-primary font-medium tracking-wide uppercase">
                  {topics.find(t => t.value === topic)?.label} Module
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {scores.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                  <Award size={14} className="text-primary" />
                  <span className="text-sm font-bold text-primary">
                    {(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)}/10
                  </span>
                  <span className="text-[10px] text-muted-foreground">avg</span>
                </div>
              )}
              <button 
                onClick={resetChat} 
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                title="End Session"
              >
                <RefreshCw size={20} />
              </button>
            </div>
          </div>

          {/* Voice Controls Bar */}
          <div className="bg-background/60 backdrop-blur-md px-6 py-2.5 flex items-center gap-3 border-b border-border/30">
            <button
              onClick={() => setVoiceMode(!voiceMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                voiceMode ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {voiceMode ? <Mic size={14} /> : <MicOff size={14} />}
              {voiceMode ? 'Voice On' : 'Voice Off'}
            </button>
            {voiceMode && (
              <>
                <button
                  onClick={() => setTtsEnabled(!ttsEnabled)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    ttsEnabled ? 'bg-success/10 text-success border border-success/30' : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                  {ttsEnabled ? 'Speaker On' : 'Speaker Off'}
                </button>
                <select
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs font-medium focus:outline-none"
                >
                  <option value="en-IN">🇮🇳 Indian English</option>
                  <option value="en-GB">🇬🇧 British English</option>
                  <option value="en-US">🇺🇸 American English</option>
                </select>
              </>
            )}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-background/30">
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] md:max-w-[70%] px-4 py-3 text-[14px] leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm' 
                      : 'bg-secondary/80 border border-border/50 text-foreground rounded-2xl rounded-tl-sm'
                  }`}>
                    {msg.text.split('\n').map((line, j) => {
                      const trimmed = line.trim();
                      
                      // Section headers: **ANSWER EVALUATION**, **CORRECT ANSWER**, **NEXT QUESTIONS**
                      const sectionHeaders = ['ANSWER EVALUATION', 'CORRECT ANSWER', 'NEXT QUESTIONS'];
                      const isSectionHeader = sectionHeaders.some(h => trimmed === `**${h}**`);
                      if (isSectionHeader) {
                        const headerText = trimmed.replace(/\*\*/g, '');
                        const headerColor = headerText === 'CORRECT ANSWER' ? 'text-amber-400' : headerText === 'NEXT QUESTIONS' ? 'text-blue-400' : 'text-emerald-400';
                        return <p key={j} className={`font-bold text-sm tracking-widest uppercase mt-4 mb-2 ${headerColor}`}>{headerText}</p>;
                      }
                      
                      // Status line with color coding
                      if (trimmed.startsWith('**Status:**')) {
                        const statusValue = trimmed.replace('**Status:**', '').trim();
                        let statusColor = 'text-emerald-400';
                        let statusBg = 'bg-emerald-500/10 border-emerald-500/20';
                        if (statusValue === 'INCORRECT') { statusColor = 'text-red-400'; statusBg = 'bg-red-500/10 border-red-500/20'; }
                        else if (statusValue === 'PARTIALLY CORRECT') { statusColor = 'text-amber-400'; statusBg = 'bg-amber-500/10 border-amber-500/20'; }
                        return <div key={j} className={`inline-block px-3 py-1.5 rounded-lg border ${statusBg} mb-2`}><span className={`font-bold text-sm ${statusColor}`}>{statusValue}</span></div>;
                      }
                      
                      // Feedback line
                      if (trimmed.startsWith('**Feedback:**')) {
                        const feedbackText = trimmed.replace('**Feedback:**', '').trim();
                        return <p key={j} className="text-[14px] opacity-90 mb-1"><span className="font-semibold text-foreground/70">Feedback: </span>{feedbackText}</p>;
                      }
                      
                      // Q1/Q2 question lines
                      if (trimmed.startsWith('**Q1:**') || trimmed.startsWith('**Q2:**')) {
                        const label = trimmed.substring(0, 6);
                        const qText = trimmed.substring(6).trim();
                        return <p key={j} className="text-[14px] my-1.5 pl-1"><span className="font-bold text-blue-400">{label.replace(/\*\*/g, '')}</span> {qText}</p>;
                      }
                      
                      // Horizontal rules
                      if (trimmed === '---') return <hr key={j} className={`my-4 border-t ${msg.role==='user'?'border-white/20':'border-border/60'}`} />;
                      
                      // Blank lines = spacing
                      if (trimmed === '') return <div key={j} className="h-3" />;
                      
                      // Bold text lines (generic)
                      if (trimmed.startsWith('**') && trimmed.endsWith('**')) return <p key={j} className="font-bold my-2">{trimmed.replace(/\*\*/g, '')}</p>;
                      
                      // Regular lines with inline bold
                      const parts = line.split(/(\*\*[^*]+\*\*)/g);
                      return <p key={j}>{parts.map((part, k) => 
                        part.startsWith('**') && part.endsWith('**') 
                          ? <span key={k} className="font-bold">{part.replace(/\*\*/g, '')}</span> 
                          : part
                      )}</p>;
                    })}
                    {msg.role === 'ai' && msg.score > 0 && (
                      <div className={`mt-3 pt-3 border-t flex items-center gap-2 ${msg.score >= 7 ? 'border-emerald-500/20' : msg.score >= 5 ? 'border-amber-500/20' : 'border-red-500/20'}`}>
                        <div className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                          msg.score >= 7 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                          msg.score >= 5 ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                          'bg-red-500/15 text-red-400 border border-red-500/30'
                        }`}>
                          {msg.score}/10
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {msg.score >= 9 ? 'Excellent!' : msg.score >= 7 ? 'Good answer' : msg.score >= 5 ? 'Needs depth' : 'Review this topic'}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {chatLoading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-secondary/50 border border-border/50 px-5 py-4 rounded-2xl rounded-tl-sm flex items-center gap-2">
                    <span className="flex gap-1">
                      <motion.span animate={{ y: [0,-5,0] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-2 h-2 rounded-full bg-muted-foreground"></motion.span>
                      <motion.span animate={{ y: [0,-5,0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 rounded-full bg-muted-foreground"></motion.span>
                      <motion.span animate={{ y: [0,-5,0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 rounded-full bg-muted-foreground"></motion.span>
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-background/80 backdrop-blur-md border-t border-border/50">
            <div className="relative flex items-end overflow-hidden glass-morphism rounded-2xl p-1 shadow-inner focus-within:ring-2 focus-within:ring-primary/50 transition-all">
              {voiceMode && (
                <button
                  onClick={listening ? stopListening : startListening}
                  disabled={chatLoading}
                  className={`flex-shrink-0 m-1.5 w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                    listening
                      ? 'bg-destructive text-destructive-foreground animate-pulse shadow-md'
                      : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                  }`}
                  title={listening ? 'Stop listening' : 'Start speaking'}
                >
                  {listening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
              )}
              <textarea 
                ref={textareaRef}
                value={input} 
                onChange={e => setInput(e.target.value)} 
                placeholder={voiceMode && listening ? '🎤 Listening...' : 'Type your response...'}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                className="w-full max-h-[250px] min-h-[56px] resize-none bg-transparent border-none py-4 px-5 pr-14 text-[15px] focus:outline-none focus:ring-0 text-foreground overflow-y-auto" 
                rows="1"
                spellCheck="true"
              />
              <button 
                onClick={sendMessage} 
                disabled={chatLoading || !input.trim()}
                className={`flex-shrink-0 m-1.5 w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                  input.trim() 
                    ? 'bg-primary text-primary-foreground shadow-md hover:scale-105' 
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                <Send size={18} className={input.trim() ? "translate-x-[1px] translate-y-[-1px]" : ""} />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ===== PEER VIDEO MODE ===== */}
      {mode === 'peer' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl mx-auto mb-16"
        >
          <div className="glass-morphism rounded-3xl p-10 md:p-14 text-center">
            <div className="w-24 h-24 mx-auto bg-primary/10 text-primary rounded-full flex items-center justify-center mb-8 relative">
               <Video size={40} />
               <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" style={{ animationDuration: '3s' }}></div>
            </div>
            <h2 className="text-2xl font-bold mb-4">Peer WebRTC Room</h2>
            <p className="text-muted-foreground mb-8">
              Enter an existing invitation code or instantly generate a new room to start practicing.
            </p>
            <div className="space-y-4">
              <input 
                value={roomId} 
                onChange={e => setRoomId(e.target.value)} 
                placeholder="Enter Room Code"
                className="w-full bg-background/50 border border-border rounded-xl px-5 py-4 text-center text-lg tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono" 
              />
              <button 
                onClick={startPeerRoom} 
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                {roomId.trim() ? 'Join Existing Room' : 'Generate New Room'} <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ===== INTERVIEW HISTORY MODE ===== */}
      {mode === 'history' && (
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           className="mb-16"
        >
           <InterviewHistory embedded={true} />
        </motion.div>
      )}

      {/* ===== FOREIGN LANGUAGE LEARNING SECTION ===== */}
      {!(mode === 'ai' && chatStarted) && <LanguageLearning />}

      {/* ===== FOREIGN LANGUAGE HUB (FULL FEATURES) ===== */}
      {!(mode === 'ai' && chatStarted) && <LanguageHubEmbed />}
    </div>
  );
};

export default InterviewLobby;

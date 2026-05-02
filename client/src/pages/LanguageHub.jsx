import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, Mic, MicOff, Send, MessageSquare, Play, 
  Pause, Star, BrainCircuit, CheckCircle2, AlertCircle, X,
  GraduationCap, Volume2, VolumeX, Square
} from 'lucide-react';
import { languagePhrases, LAUNGUAGE_SCENARIOS } from '../data/languagePhrases';
import { PHASE1_DATA, PHASE1_LESSONS_META } from '../data/phase1Data';

// Phase 1 Lesson Components
import LessonPathway from '../components/language/LessonPathway';
import AlphabetLesson from '../components/language/AlphabetLesson';
import FlashcardDrill from '../components/language/FlashcardDrill';
import MatchPairsGame from '../components/language/MatchPairsGame';
import FillBlankExercise from '../components/language/FillBlankExercise';
import ListeningQuiz from '../components/language/ListeningQuiz';

const LANGUAGES = ['German', 'Japanese', 'French', 'Spanish', 'Mandarin'];

const LanguageHub = () => {
  const { api } = useAuth();
  
  // Profile State
  const [profile, setProfile] = useState({ currentLanguage: 'German', totalXP: 0, eloRating: 800, phase1Progress: {} });
  const [loading, setLoading] = useState(true);

  // Phase 1 Lesson Modal
  const [activeLesson, setActiveLesson] = useState(null); // null | 'alphabet' | 'vocabulary' | ...

  // Gamification (Focus Timer)
  const [focusTimeLeft, setFocusTimeLeft] = useState(25 * 60);
  const [isFocusing, setIsFocusing] = useState(false);
  const timerRef = useRef(null);

  // Chat/Roleplay State
  const [scenario, setScenario] = useState('Tech Interview in Berlin');
  const [chatMessages, setChatMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  
  // Web Speech API State — Speech-to-Text (STT)
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Web Speech API State — Text-to-Speech (TTS)
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [speakingMsgIndex, setSpeakingMsgIndex] = useState(null);
  const spokenCharRef = useRef({ charIndex: -1, charLength: 0 });
  const [speakTick, setSpeakTick] = useState(0); // incremented to force re-render on boundary
  const utteranceRef = useRef(null);

  // Load Profile on Mount
  useEffect(() => {
    fetchProfile();
    initSpeechRecognition();
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
      window.speechSynthesis?.cancel();
      utteranceRef.current = null;
    };
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/language/profile');
      const data = res.data;
      // Normalize phase1Progress from Mongoose Map to plain object
      const p1 = data.phase1Progress || {};
      const normalized = {};
      if (p1 instanceof Map || typeof p1?.entries === 'function') {
        for (const [k, v] of p1.entries()) normalized[k] = v;
      } else if (typeof p1 === 'object') {
        Object.assign(normalized, p1);
      }
      setProfile({ ...data, phase1Progress: normalized });
      if (data.currentLanguage) {
        setScenario(LAUNGUAGE_SCENARIOS[data.currentLanguage][0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateLanguage = async (newLang) => {
    setProfile(prev => ({ ...prev, currentLanguage: newLang }));
    setScenario(LAUNGUAGE_SCENARIOS[newLang][0]);
    setChatMessages([]);
    try {
      await api.put('/language/profile', { currentLanguage: newLang });
    } catch (e) {
      console.error(e);
    }
  };

  const awardXP = async (points) => {
    // 2x Multiplier if focus timer is active
    const finalPoints = isFocusing ? points * 2 : points;
    setProfile(prev => ({ ...prev, totalXP: prev.totalXP + finalPoints }));
    try {
      await api.put('/language/profile', { addXP: finalPoints });
    } catch (e) {
      console.error(e);
    }
  };

  // --- Phase 1 Lesson Completion ---
  const handleLessonComplete = async (lessonKey) => {
    const lang = profile.currentLanguage;
    // Update local state
    setProfile(prev => {
      const p1 = { ...prev.phase1Progress };
      const arr = [...(p1[lang] || [])];
      if (!arr.includes(lessonKey)) arr.push(lessonKey);
      p1[lang] = arr;
      return { ...prev, phase1Progress: p1, totalXP: prev.totalXP + (isFocusing ? 50 : 25) };
    });

    // Check if all 5 done — bonus XP
    const currentProgress = profile.phase1Progress[lang] || [];
    const willBeComplete = [...currentProgress, lessonKey];
    const isPhaseComplete = new Set(willBeComplete).size >= PHASE1_LESSONS_META.length;

    // Persist to backend
    try {
      await api.put('/language/profile', { 
        completeLesson: { language: lang, lessonKey },
        addXP: (isFocusing ? 50 : 25) + (isPhaseComplete ? 50 : 0)
      });
      if (isPhaseComplete) {
        setProfile(prev => ({ ...prev, totalXP: prev.totalXP + 50 }));
      }
    } catch (e) {
      console.error(e);
    }

    setActiveLesson(null);
  };

  // --- Focus Timer Logic ---
  const toggleFocus = () => {
    if (isFocusing) {
      clearInterval(timerRef.current);
      setIsFocusing(false);
    } else {
      setIsFocusing(true);
      timerRef.current = setInterval(() => {
        setFocusTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsFocusing(false);
            awardXP(50); // Big bonus for finishing a pomodoro
            return 25 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };
  const formatTime = (secs) => `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`;

  // --- Web Speech API (Voice Input) ---
  const initSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.onresult = (event) => {
        let text = '';
        for (let i = 0; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        setInputText(text);
      };
      recognition.onend = () => {
        setIsListening(false);
      };
      recognitionRef.current = recognition;
    }
  };

  const toggleListen = () => {
    if (!recognitionRef.current) return alert("Your browser doesn't support Voice Input. Try Chrome.");
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Map language codes correctly for recognition target
      const langCodes = { 'German': 'de-DE', 'Japanese': 'ja-JP', 'French': 'fr-FR', 'Spanish': 'es-ES', 'Mandarin': 'zh-CN' };
      recognitionRef.current.lang = langCodes[profile.currentLanguage] || 'en-US';
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // --- Web Speech API (Text-to-Speech / Voice Output) ---
  const LANG_CODES_TTS = { 'German': 'de-DE', 'Japanese': 'ja-JP', 'French': 'fr-FR', 'Spanish': 'es-ES', 'Mandarin': 'zh-CN' };
  const speekingQueueIdRef = useRef(0); // To track and cancel queues

  const speakText = (text, msgIndex = null) => {
    if (!window.speechSynthesis) return alert("Your browser doesn't support Text-to-Speech.");

    const currentQueueId = ++speekingQueueIdRef.current;
    
    // Stop any existing speech natively
    window.speechSynthesis.cancel();

    if (isSpeaking && speakingMsgIndex === msgIndex) {
      setIsSpeaking(false);
      setSpeakingMsgIndex(null);
      spokenCharRef.current = { charIndex: -1, charLength: 0 };
      setSpeakTick(t => t + 1);
      return;
    }

    const langCode = LANG_CODES_TTS[profile.currentLanguage] || 'en';
    
    // Use Intl.Segmenter to intelligently break text into words across all languages (including Japanese/Mandarin)
    const segmenter = new Intl.Segmenter(langCode, { granularity: 'word' });
    const segments = Array.from(segmenter.segment(text));
    
    // Group words with their trailing punctuation and spaces so speaking is slightly more natural
    const queue = [];
    let currentText = "";
    let startIndex = 0;

    for (const seg of segments) {
      if (seg.isWordLike) {
        if (currentText) queue.push({ text: currentText, index: startIndex, length: currentText.length });
        currentText = seg.segment;
        startIndex = seg.index;
      } else {
        currentText += seg.segment;
      }
    }
    if (currentText) queue.push({ text: currentText, index: startIndex, length: currentText.length });

    setIsSpeaking(true);
    setSpeakingMsgIndex(msgIndex);

    // Try to find a matching voice once
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.startsWith(langCode.split('-')[0]));

    // Recursive function to speak item by item sequentially
    const playNext = (qIndex) => {
      // If we cancelled or started a new queue, stop this recursive chain
      if (currentQueueId !== speekingQueueIdRef.current) return;

      if (qIndex >= queue.length) {
        setIsSpeaking(false);
        setSpeakingMsgIndex(null);
        spokenCharRef.current = { charIndex: -1, charLength: 0 };
        setSpeakTick(t => t + 1);
        return;
      }
      
      const item = queue[qIndex];
      
      // Update our highlight ref instantly
      spokenCharRef.current = { charIndex: item.index, charLength: item.length };
      setSpeakTick(t => t + 1); // Force highlight render

      // If the item is just spaces/punctuation, just delay briefly and skip Native TTS
      if (!item.text.trim()) {
        setTimeout(() => playNext(qIndex + 1), 100);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(item.text);
      window._activeUtterance = utterance; // Prevent GC
      utterance.lang = langCode;
      utterance.rate = 0.85; // slightly slower for language learners
      utterance.pitch = 1;
      if (matchingVoice) utterance.voice = matchingVoice;

      utterance.onend = () => {
        playNext(qIndex + 1);
      };
      utterance.onerror = (e) => {
        console.warn("TTS Error on word chunk:", e);
        // Continue to the next word even if this one errors out
        playNext(qIndex + 1);
      };

      window.speechSynthesis.speak(utterance);
    };

    // Kick off the word-by-word queue
    playNext(0);
  };

  const stopSpeaking = () => {
    speekingQueueIdRef.current++; // Invalidates ongoing queues
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setSpeakingMsgIndex(null);
    spokenCharRef.current = { charIndex: -1, charLength: 0 };
    setSpeakTick(t => t + 1);
  };

  // --- Karaoke-style highlighted text (inline render function, NOT a component) ---
  const renderKaraokeText = (text, isActive) => {
    const { charIndex, charLength } = spokenCharRef.current;
    
    if (!isActive || charIndex < 0) {
      return text;
    }

    // Find the full word boundary around the charIndex
    let wordEnd = charIndex + Math.max(charLength, 1);
    while (wordEnd < text.length && text[wordEnd] !== ' ' && text[wordEnd] !== '。' && text[wordEnd] !== '、' && text[wordEnd] !== '？' && text[wordEnd] !== '！' && text[wordEnd] !== '.' && text[wordEnd] !== ',' && text[wordEnd] !== '!' && text[wordEnd] !== '?') {
      wordEnd++;
    }

    const before = text.slice(0, charIndex);
    const current = text.slice(charIndex, wordEnd);
    const after = text.slice(wordEnd);

    return (
      <>
        <span className="opacity-50">{before}</span>
        <span className="text-primary font-bold bg-primary/15 px-0.5 rounded">{current}</span>
        <span>{after}</span>
      </>
    );
  };

  // --- AI Roleplay Chat Logic ---
  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setInputText('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsAiTyping(true);

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    try {
      const payload = {
        language: profile.currentLanguage,
        scenario: scenario,
        messages: chatMessages,
        userMessage: userMsg
      };

      const res = await api.post('/language/roleplay', payload);
      
      const aiReply = res.data.reply;
      setChatMessages(prev => {
        const newMessages = [...prev, { 
          role: 'assistant', 
          content: aiReply,
          feedback: res.data.feedback 
        }];
        // Auto-speak the AI reply if enabled
        if (autoSpeak && aiReply) {
          setTimeout(() => speakText(aiReply, newMessages.length - 1), 300);
        }
        return newMessages;
      });
      
      // Reward user for participating
      awardXP(10);
      
    } catch (e) {
      console.error(e);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Connection error... Please try again later.' }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Scroll chat to bottom
  const chatEndRef = useRef(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiTyping]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Globe className="text-primary animate-pulse" size={48} />
      </div>
    );
  }

  const phrasesForLang = languagePhrases[profile.currentLanguage] || [];
  const scenariosForLang = LAUNGUAGE_SCENARIOS[profile.currentLanguage] || [];
  const completedLessons = profile.phase1Progress?.[profile.currentLanguage] || [];
  const phase1LangData = PHASE1_DATA[profile.currentLanguage] || {};

  // --- Render Lesson Component in Modal ---
  const renderLessonComponent = () => {
    const props = {
      language: profile.currentLanguage,
      onComplete: () => handleLessonComplete(activeLesson),
      onClose: () => setActiveLesson(null),
    };

    switch (activeLesson) {
      case 'alphabet':
        return <AlphabetLesson data={phase1LangData.alphabet} {...props} />;
      case 'vocabulary':
        return <FlashcardDrill data={phase1LangData.vocabulary} {...props} />;
      case 'matchPairs':
        return <MatchPairsGame data={phase1LangData.matchPairs} {...props} />;
      case 'fillBlanks':
        return <FillBlankExercise data={phase1LangData.fillBlanks} {...props} />;
      case 'listeningQuiz':
        return <ListeningQuiz data={phase1LangData.listeningQuiz} {...props} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 fadeIn">
      
      {/* 1. Header & Language Selector */}
      <div className="glass-morphism p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-xl shadow-primary/20">
            <Globe size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">Global Language Hub</h1>
            <p className="text-sm text-muted-foreground font-medium">Binge-learn phrases and converse with AI native speakers</p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="px-4 py-2 bg-secondary/50 rounded-xl border border-border/50 text-center shadow-sm">
            <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Elo Rating</p>
            <p className="text-xl font-black text-foreground">{profile.eloRating}</p>
          </div>
          <div className="px-4 py-2 bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-xl text-center shadow-sm">
            <p className="text-[10px] font-bold text-primary tracking-widest uppercase">Total XP</p>
            <p className="text-xl font-black text-primary flex items-center justify-center gap-1">
              <Star size={16} className="fill-primary" /> {profile.totalXP}
            </p>
          </div>
          
          <select 
            value={profile.currentLanguage}
            onChange={(e) => updateLanguage(e.target.value)}
            className="input-field py-3 min-w-[140px] font-bold shadow-sm cursor-pointer"
          >
            {LANGUAGES.map(l => <option key={l} value={l} className="bg-background text-foreground font-semibold py-1">{l}</option>)}
          </select>
        </div>
      </div>

      {/* 2. PHASE 1: FOUNDATION — Lesson Pathway */}
      <div className="glass-morphism p-6 md:p-8 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2"></div>
        <LessonPathway
          completedLessons={completedLessons}
          onStartLesson={(key) => setActiveLesson(key)}
          language={profile.currentLanguage}
        />
      </div>

      {/* 3. EXISTING FEATURES — Focus Timer, Phrase Bank, AI Roleplay */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Focus Timer & Phrase Bank */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Focus Timer (Gamification) */}
          <div className="glass-morphism p-6 text-center relative overflow-hidden border-t-2 border-t-primary/50">
            <h3 className="font-bold text-foreground text-lg mb-1 flex items-center justify-center gap-2">
              <BrainCircuit className="text-primary" size={20} /> Focus Zone Multiplier
            </h3>
            <p className="text-xs text-muted-foreground mb-6">Earn 2x XP while the timer is active.</p>
            
            <div className="text-6xl font-black tracking-tighter mb-6 font-mono text-foreground">
              {formatTime(focusTimeLeft)}
            </div>
            
            <button 
              onClick={toggleFocus}
              className={`px-8 py-3 rounded-full font-black text-sm uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 mx-auto ${
                isFocusing ? 'bg-secondary text-foreground hover:bg-secondary/70' : 'bg-primary text-primary-foreground shadow-primary/20 hover:scale-105'
              }`}
            >
              {isFocusing ? <><Pause size={18} /> Pause Focus</> : <><Play size={18} /> Start 25 Min Focus</>}
            </button>
          </div>

          {/* Binge-Learn Phrase Bank */}
          <div className="glass-morphism p-6 flex flex-col h-[500px]">
            <h3 className="font-bold text-foreground text-lg mb-1 flex items-center gap-2">
              <GraduationCap className="text-accent" size={20} /> Survival Phrase Bank
            </h3>
            <p className="text-xs text-muted-foreground mb-4">Hardcoded native phrases for immediate fluency.</p>
            
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
              {phrasesForLang.map((phrase, i) => (
                <div key={i} className="p-4 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider px-2 py-0.5 bg-primary/10 rounded-md">
                      {phrase.category}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-foreground">{phrase.script}</h4>
                  <p className="text-sm font-medium text-muted-foreground mb-1 font-mono bg-background/50 px-2 py-0.5 rounded inline-block">
                    {phrase.romanization}
                  </p>
                  <p className="text-xs text-foreground/80 font-bold border-l-2 border-accent pl-2 italic">
                    "{phrase.english}"
                  </p>
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* RIGHT COLUMN: AI Roleplay Chat */}
        <div className="lg:col-span-7 h-[780px]">
          <div className="glass-morphism h-full flex flex-col border-t-2 border-t-accent/50">
            {/* Chat Header */}
            <div className="p-5 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/10">
              <div>
                <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                  <MessageSquare className="text-accent" size={20} /> AI Agent Roleplay
                </h3>
                <p className="text-xs text-muted-foreground">Practice speaking {profile.currentLanguage} natively.</p>
              </div>
              <select 
                value={scenario}
                onChange={e => { setScenario(e.target.value); setChatMessages([]); }}
                className="input-field py-1.5 text-xs font-bold sm:max-w-[200px] cursor-pointer"
              >
                {scenariosForLang.map(s => <option key={s} value={s} className="bg-background text-foreground font-semibold py-1">{s}</option>)}
              </select>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-background/30">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <MessageSquare size={48} className="text-muted-foreground mb-4" />
                  <p className="text-sm font-bold text-muted-foreground">Start the scenario:</p>
                  <p className="text-lg font-black text-foreground">"{scenario}"</p>
                  <p className="text-xs text-muted-foreground mt-2 max-w-xs">Introduce yourself in {profile.currentLanguage}. Don't worry about making mistakes — the AI will correct your grammar!</p>
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[85%]">
                      <div className={`p-4 rounded-2xl ${
                        msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-br-none shadow-lg shadow-primary/20' 
                        : 'bg-secondary border border-border/50 text-foreground rounded-bl-none shadow-sm'
                      }`}>
                        <p className="text-sm font-medium leading-relaxed">
                          {renderKaraokeText(msg.content, speakingMsgIndex === i)}
                        </p>
                        {/* Speaker button for all messages */}
                        <button
                          type="button"
                          onClick={() => speakText(msg.content, i)}
                          className={`mt-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            speakingMsgIndex === i
                              ? 'text-primary'
                              : msg.role === 'user' ? 'text-primary-foreground/60 hover:text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                          }`}
                          title={speakingMsgIndex === i ? 'Stop speaking' : 'Hear this message'}
                        >
                          {speakingMsgIndex === i ? <><Square size={10} className="fill-current" /> Speaking...</> : <><Volume2 size={12} /> Listen</>}
                        </button>
                      </div>
                      
                      {/* Grammar Feedback Overlay */}
                      {msg.feedback && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 p-3 bg-accent/10 border border-accent/20 rounded-xl text-xs text-foreground font-medium flex items-start gap-2"
                        >
                          <BrainCircuit className="text-accent shrink-0 mt-0.5" size={14} />
                          <div>
                            <span className="font-bold text-accent uppercase tracking-wider text-[10px] block mb-0.5">Grammar Correction</span>
                            {msg.feedback}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                ))
              )}
              
              {isAiTyping && (
                <div className="flex justify-start">
                  <div className="p-4 rounded-2xl bg-secondary border border-border/50 text-foreground rounded-bl-none max-w-[85%] flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border/50 bg-background/50">
              <form onSubmit={sendMessage} className="flex items-end gap-2 relative">
                
                <button
                  type="button"
                  onClick={toggleListen}
                  className={`p-3.5 rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center ${
                    isListening ? 'bg-destructive/10 text-destructive border border-destructive/20 animate-pulse outline outline-4 outline-destructive/20' : 'bg-secondary text-muted-foreground hover:text-foreground border border-border/50'
                  }`}
                  title={isListening ? "Listening... click to stop" : "Start Voice Input"}
                >
                  {isListening ? <Mic size={20} /> : <MicOff size={20} />}
                </button>

                <div className="flex-1 relative">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={isListening ? "Listening to your voice..." : `Type your reply in ${profile.currentLanguage}...`}
                    className={`w-full bg-secondary border border-border/50 text-foreground p-3 pr-12 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm font-medium h-[52px]
                      ${isListening ? 'border-destructive/50 bg-destructive/5' : ''}`
                    }
                    rows="1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  {inputText && (
                    <button
                      type="button"
                      onClick={() => setInputText('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!inputText.trim() || isAiTyping}
                  className="p-3.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 shrink-0"
                >
                  <Send size={20} />
                </button>
              </form>
              <div className="flex items-center justify-between mt-2 px-1">
                <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase flex items-center gap-1">
                  <BrainCircuit size={10} /> Auto-Grammar Evaluation Active
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAutoSpeak(prev => !prev)}
                    className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      autoSpeak ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title={autoSpeak ? 'Disable auto-speak' : 'Enable auto-speak'}
                  >
                    {autoSpeak ? <Volume2 size={10} /> : <VolumeX size={10} />}
                    {autoSpeak ? 'Auto-Speak ON' : 'Auto-Speak OFF'}
                  </button>
                  <p className="text-[10px] text-muted-foreground">Shift+Enter for newline</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
      </div>

      {/* LESSON MODAL — Full-screen overlay when a lesson is active */}
      <AnimatePresence>
        {activeLesson && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.97 }}
              transition={{ type: 'spring', bounce: 0.15 }}
              className="w-full h-full max-w-2xl mx-auto flex flex-col"
            >
              {renderLessonComponent()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageHub;

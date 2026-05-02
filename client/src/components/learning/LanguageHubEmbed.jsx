import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Globe, Star, BrainCircuit, Play, Pause, GraduationCap,
  MessageSquare, Send, Mic, MicOff, Volume2, VolumeX, X, Square,
  ArrowRight
} from 'lucide-react';
import { languagePhrases, LAUNGUAGE_SCENARIOS } from '../../data/languagePhrases';
import { PHASE1_DATA, PHASE1_LESSONS_META } from '../../data/phase1Data';
import LessonPathway from '../language/LessonPathway';
import AlphabetLesson from '../language/AlphabetLesson';
import FlashcardDrill from '../language/FlashcardDrill';
import MatchPairsGame from '../language/MatchPairsGame';
import FillBlankExercise from '../language/FillBlankExercise';
import ListeningQuiz from '../language/ListeningQuiz';

const LANGUAGES = ['German', 'Japanese', 'French', 'Spanish', 'Mandarin'];

const LanguageHubEmbed = () => {
  const { api } = useAuth();

  // Profile state
  const [profile, setProfile] = useState({ currentLanguage: 'German', totalXP: 0, eloRating: 800, phase1Progress: {} });
  const [loading, setLoading] = useState(true);

  // Phase 1 Lesson Modal
  const [activeLesson, setActiveLesson] = useState(null);

  // Focus Timer
  const [focusTimeLeft, setFocusTimeLeft] = useState(25 * 60);
  const [isFocusing, setIsFocusing] = useState(false);
  const timerRef = useRef(null);

  // Chat/Roleplay State
  const [scenario, setScenario] = useState('Tech Interview in Berlin');
  const [chatMessages, setChatMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Voice
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMsgIndex, setSpeakingMsgIndex] = useState(null);
  const spokenCharRef = useRef({ charIndex: -1, charLength: 0 });
  const [speakTick, setSpeakTick] = useState(0);
  const speekingQueueIdRef = useRef(0);

  useEffect(() => {
    fetchProfile();
    initSpeechRecognition();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/language/profile');
      const data = res.data;
      const p1 = data.phase1Progress || {};
      const normalized = {};
      if (p1 instanceof Map || typeof p1?.entries === 'function') {
        for (const [k, v] of p1.entries()) normalized[k] = v;
      } else if (typeof p1 === 'object') {
        Object.assign(normalized, p1);
      }
      setProfile({ ...data, phase1Progress: normalized });
      if (data.currentLanguage) {
        setScenario(LAUNGUAGE_SCENARIOS[data.currentLanguage]?.[0] || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateLanguage = async (newLang) => {
    setProfile(prev => ({ ...prev, currentLanguage: newLang }));
    setScenario(LAUNGUAGE_SCENARIOS[newLang]?.[0] || '');
    setChatMessages([]);
    try {
      await api.put('/language/profile', { currentLanguage: newLang });
    } catch (e) {
      console.error(e);
    }
  };

  const awardXP = async (points) => {
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
    setProfile(prev => {
      const p1 = { ...prev.phase1Progress };
      const arr = [...(p1[lang] || [])];
      if (!arr.includes(lessonKey)) arr.push(lessonKey);
      p1[lang] = arr;
      return { ...prev, phase1Progress: p1, totalXP: prev.totalXP + (isFocusing ? 50 : 25) };
    });

    const currentProgress = profile.phase1Progress[lang] || [];
    const willBeComplete = [...currentProgress, lessonKey];
    const isPhaseComplete = new Set(willBeComplete).size >= PHASE1_LESSONS_META.length;

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

  // --- Focus Timer ---
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
            awardXP(50);
            return 25 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };
  const formatTime = (secs) => `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`;

  // --- Speech Recognition ---
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
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  };

  const toggleListen = () => {
    if (!recognitionRef.current) return alert("Your browser doesn't support Voice Input. Try Chrome.");
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      const langCodes = { 'German': 'de-DE', 'Japanese': 'ja-JP', 'French': 'fr-FR', 'Spanish': 'es-ES', 'Mandarin': 'zh-CN' };
      recognitionRef.current.lang = langCodes[profile.currentLanguage] || 'en-US';
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // --- TTS ---
  const LANG_CODES_TTS = { 'German': 'de-DE', 'Japanese': 'ja-JP', 'French': 'fr-FR', 'Spanish': 'es-ES', 'Mandarin': 'zh-CN' };

  const speakText = (text, msgIndex = null) => {
    if (!window.speechSynthesis) return;
    const currentQueueId = ++speekingQueueIdRef.current;
    window.speechSynthesis.cancel();

    if (isSpeaking && speakingMsgIndex === msgIndex) {
      setIsSpeaking(false);
      setSpeakingMsgIndex(null);
      spokenCharRef.current = { charIndex: -1, charLength: 0 };
      setSpeakTick(t => t + 1);
      return;
    }

    const langCode = LANG_CODES_TTS[profile.currentLanguage] || 'en';
    const segmenter = new Intl.Segmenter(langCode, { granularity: 'word' });
    const segments = Array.from(segmenter.segment(text));
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

    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.startsWith(langCode.split('-')[0]));

    const playNext = (qIndex) => {
      if (currentQueueId !== speekingQueueIdRef.current) return;
      if (qIndex >= queue.length) {
        setIsSpeaking(false);
        setSpeakingMsgIndex(null);
        spokenCharRef.current = { charIndex: -1, charLength: 0 };
        setSpeakTick(t => t + 1);
        return;
      }
      const item = queue[qIndex];
      spokenCharRef.current = { charIndex: item.index, charLength: item.length };
      setSpeakTick(t => t + 1);

      if (!item.text.trim()) {
        setTimeout(() => playNext(qIndex + 1), 100);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(item.text);
      window._activeUtterance = utterance;
      utterance.lang = langCode;
      utterance.rate = 0.85;
      utterance.pitch = 1;
      if (matchingVoice) utterance.voice = matchingVoice;
      utterance.onend = () => playNext(qIndex + 1);
      utterance.onerror = () => playNext(qIndex + 1);
      window.speechSynthesis.speak(utterance);
    };

    playNext(0);
  };

  const stopSpeaking = () => {
    speekingQueueIdRef.current++;
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setSpeakingMsgIndex(null);
    spokenCharRef.current = { charIndex: -1, charLength: 0 };
    setSpeakTick(t => t + 1);
  };

  const renderKaraokeText = (text, isActive) => {
    const { charIndex, charLength } = spokenCharRef.current;
    if (!isActive || charIndex < 0) return text;

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

  // --- Chat ---
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
      const res = await api.post('/language/roleplay', {
        language: profile.currentLanguage,
        scenario,
        messages: chatMessages,
        userMessage: userMsg
      });

      const aiReply = res.data.reply;
      setChatMessages(prev => {
        const newMessages = [...prev, {
          role: 'assistant',
          content: aiReply,
          feedback: res.data.feedback
        }];
        if (autoSpeak && aiReply) {
          setTimeout(() => speakText(aiReply, newMessages.length - 1), 300);
        }
        return newMessages;
      });
      awardXP(10);
    } catch (e) {
      console.error(e);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Connection error... Please try again later.' }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const chatEndRef = useRef(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiTyping]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Globe className="text-primary animate-pulse" size={36} />
      </div>
    );
  }

  const phrasesForLang = languagePhrases[profile.currentLanguage] || [];
  const scenariosForLang = LAUNGUAGE_SCENARIOS[profile.currentLanguage] || [];
  const completedLessons = profile.phase1Progress?.[profile.currentLanguage] || [];
  const phase1LangData = PHASE1_DATA[profile.currentLanguage] || {};

  const renderLessonComponent = () => {
    const props = {
      language: profile.currentLanguage,
      onComplete: () => handleLessonComplete(activeLesson),
      onClose: () => setActiveLesson(null),
    };
    switch (activeLesson) {
      case 'alphabet':     return <AlphabetLesson data={phase1LangData.alphabet} {...props} />;
      case 'vocabulary':   return <FlashcardDrill data={phase1LangData.vocabulary} {...props} />;
      case 'matchPairs':   return <MatchPairsGame data={phase1LangData.matchPairs} {...props} />;
      case 'fillBlanks':   return <FillBlankExercise data={phase1LangData.fillBlanks} {...props} />;
      case 'listeningQuiz': return <ListeningQuiz data={phase1LangData.listeningQuiz} {...props} />;
      default: return null;
    }
  };

  return (
    <div className="mt-6 space-y-6">
      {/* Header Bar */}
      <div className="glass-morphism p-5 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Globe size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground">Global Language Hub</h2>
            <p className="text-xs text-muted-foreground font-medium">Binge-learn phrases and converse with AI native speakers</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-3 py-1.5 bg-secondary/50 rounded-xl border border-border/50 text-center shadow-sm">
            <p className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase">Elo</p>
            <p className="text-lg font-black text-foreground">{profile.eloRating}</p>
          </div>
          <div className="px-3 py-1.5 bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-xl text-center shadow-sm">
            <p className="text-[9px] font-bold text-primary tracking-widest uppercase">XP</p>
            <p className="text-lg font-black text-primary flex items-center justify-center gap-1">
              <Star size={14} className="fill-primary" /> {profile.totalXP}
            </p>
          </div>
          <select
            value={profile.currentLanguage}
            onChange={(e) => updateLanguage(e.target.value)}
            className="input-field py-2.5 min-w-[130px] font-bold shadow-sm cursor-pointer text-sm"
          >
            {LANGUAGES.map(l => <option key={l} value={l} className="bg-background text-foreground font-semibold">{l}</option>)}
          </select>
        </div>
      </div>

      {/* Phase 1 Pathway */}
      <div className="glass-morphism p-6 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2"></div>
        <LessonPathway
          completedLessons={completedLessons}
          onStartLesson={(key) => setActiveLesson(key)}
          language={profile.currentLanguage}
        />
      </div>

      {/* Two-Column: Focus Timer + Phrases | AI Roleplay */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT: Focus Timer + Phrase Bank */}
        <div className="lg:col-span-5 space-y-6">

          {/* Focus Timer */}
          <div className="glass-morphism p-5 text-center relative overflow-hidden border-t-2 border-t-primary/50">
            <h3 className="font-bold text-foreground text-base mb-1 flex items-center justify-center gap-2">
              <BrainCircuit className="text-primary" size={18} /> Focus Zone Multiplier
            </h3>
            <p className="text-xs text-muted-foreground mb-4">Earn 2x XP while the timer is active.</p>
            <div className="text-5xl font-black tracking-tighter mb-4 font-mono text-foreground">
              {formatTime(focusTimeLeft)}
            </div>
            <button
              onClick={toggleFocus}
              className={`px-6 py-2.5 rounded-full font-black text-sm uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 mx-auto ${
                isFocusing ? 'bg-secondary text-foreground hover:bg-secondary/70' : 'bg-primary text-primary-foreground shadow-primary/20 hover:scale-105'
              }`}
            >
              {isFocusing ? <><Pause size={16} /> Pause Focus</> : <><Play size={16} /> Start 25 Min Focus</>}
            </button>
          </div>

          {/* Phrase Bank */}
          <div className="glass-morphism p-5 flex flex-col h-[420px]">
            <h3 className="font-bold text-foreground text-base mb-1 flex items-center gap-2">
              <GraduationCap className="text-accent" size={18} /> Survival Phrase Bank
            </h3>
            <p className="text-xs text-muted-foreground mb-3">Hardcoded native phrases for immediate fluency.</p>

            <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-2">
              {phrasesForLang.map((phrase, i) => (
                <div key={i} className="p-3 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-bold text-primary uppercase tracking-wider px-2 py-0.5 bg-primary/10 rounded-md">
                      {phrase.category}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-foreground">{phrase.script}</h4>
                  <p className="text-xs font-medium text-muted-foreground mb-0.5 font-mono bg-background/50 px-2 py-0.5 rounded inline-block">
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

        {/* RIGHT: AI Roleplay Chat */}
        <div className="lg:col-span-7 h-[660px]">
          <div className="glass-morphism h-full flex flex-col border-t-2 border-t-accent/50">
            {/* Chat Header */}
            <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/10">
              <div>
                <h3 className="font-bold text-foreground text-base flex items-center gap-2">
                  <MessageSquare className="text-accent" size={18} /> AI Agent Roleplay
                </h3>
                <p className="text-xs text-muted-foreground">Practice speaking {profile.currentLanguage} natively.</p>
              </div>
              <select
                value={scenario}
                onChange={e => { setScenario(e.target.value); setChatMessages([]); }}
                className="input-field py-1.5 text-xs font-bold sm:max-w-[200px] cursor-pointer"
              >
                {scenariosForLang.map(s => <option key={s} value={s} className="bg-background text-foreground font-semibold">{s}</option>)}
              </select>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-background/30">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <MessageSquare size={40} className="text-muted-foreground mb-4" />
                  <p className="text-sm font-bold text-muted-foreground">Start the scenario:</p>
                  <p className="text-lg font-black text-foreground">"{scenario}"</p>
                  <p className="text-xs text-muted-foreground mt-2 max-w-xs">Introduce yourself in {profile.currentLanguage}. Don't worry about making mistakes — the AI will correct your grammar!</p>
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[85%]">
                      <div className={`p-3.5 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-none shadow-lg shadow-primary/20'
                          : 'bg-secondary border border-border/50 text-foreground rounded-bl-none shadow-sm'
                      }`}>
                        <p className="text-sm font-medium leading-relaxed">
                          {renderKaraokeText(msg.content, speakingMsgIndex === i)}
                        </p>
                        <button
                          type="button"
                          onClick={() => speakText(msg.content, i)}
                          className={`mt-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            speakingMsgIndex === i
                              ? 'text-primary'
                              : msg.role === 'user' ? 'text-primary-foreground/60 hover:text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                          }`}
                          title={speakingMsgIndex === i ? 'Stop speaking' : 'Hear this message'}
                        >
                          {speakingMsgIndex === i ? <><Square size={10} className="fill-current" /> Speaking...</> : <><Volume2 size={12} /> Listen</>}
                        </button>
                      </div>

                      {msg.feedback && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1.5 p-2.5 bg-accent/10 border border-accent/20 rounded-xl text-xs text-foreground font-medium flex items-start gap-2"
                        >
                          <BrainCircuit className="text-accent shrink-0 mt-0.5" size={13} />
                          <div>
                            <span className="font-bold text-accent uppercase tracking-wider text-[9px] block mb-0.5">Grammar Correction</span>
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

            {/* Input */}
            <div className="p-3.5 border-t border-border/50 bg-background/50">
              <form onSubmit={sendMessage} className="flex items-end gap-2 relative">
                <button
                  type="button"
                  onClick={toggleListen}
                  className={`p-3 rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center ${
                    isListening ? 'bg-destructive/10 text-destructive border border-destructive/20 animate-pulse outline outline-4 outline-destructive/20' : 'bg-secondary text-muted-foreground hover:text-foreground border border-border/50'
                  }`}
                  title={isListening ? "Listening... click to stop" : "Start Voice Input"}
                >
                  {isListening ? <Mic size={18} /> : <MicOff size={18} />}
                </button>

                <div className="flex-1 relative">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={isListening ? "Listening to your voice..." : `Type your reply in ${profile.currentLanguage}...`}
                    className={`w-full bg-secondary border border-border/50 text-foreground p-2.5 pr-10 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm font-medium h-[48px] ${
                      isListening ? 'border-destructive/50 bg-destructive/5' : ''
                    }`}
                    rows="1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                    }}
                  />
                  {inputText && (
                    <button type="button" onClick={() => setInputText('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
                      <X size={14} />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!inputText.trim() || isAiTyping}
                  className="p-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 shrink-0"
                >
                  <Send size={18} />
                </button>
              </form>
              <div className="flex items-center justify-between mt-1.5 px-1">
                <p className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase flex items-center gap-1">
                  <BrainCircuit size={9} /> Auto-Grammar Evaluation Active
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAutoSpeak(prev => !prev)}
                    className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider transition-colors ${
                      autoSpeak ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {autoSpeak ? <Volume2 size={9} /> : <VolumeX size={9} />}
                    {autoSpeak ? 'Auto-Speak ON' : 'Auto-Speak OFF'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Hub Link */}
      <Link
        to="/language"
        className="flex items-center justify-center gap-3 p-4 glass-morphism hover:bg-primary/5 transition-all group"
      >
        <Globe size={20} className="text-primary" />
        <span className="font-bold text-foreground text-sm">Open Full Language Hub</span>
        <ArrowRight size={16} className="text-primary group-hover:translate-x-1 transition-transform" />
      </Link>

      {/* Lesson Modal */}
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

export default LanguageHubEmbed;

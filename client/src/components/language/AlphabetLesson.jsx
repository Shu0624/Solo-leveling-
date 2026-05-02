import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, ChevronLeft, ChevronRight, CheckCircle2, X } from 'lucide-react';

const LANG_CODES = { German: 'de-DE', Japanese: 'ja-JP', French: 'fr-FR', Spanish: 'es-ES', Mandarin: 'zh-CN' };

const AlphabetLesson = ({ data, language, onComplete, onClose }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState({});
  const [visitedAll, setVisitedAll] = useState(false);
  const visitedRef = useRef(new Set([0]));

  const items = data || [];
  const item = items[currentIdx];

  const speakChar = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = LANG_CODES[language] || 'en-US';
    utter.rate = 0.7;
    window._activeUtterance = utter;
    window.speechSynthesis.speak(utter);
  };

  const goTo = (idx) => {
    if (idx < 0 || idx >= items.length) return;
    setCurrentIdx(idx);
    visitedRef.current.add(idx);
    if (visitedRef.current.size >= items.length) {
      setVisitedAll(true);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div>
          <h3 className="text-lg font-black text-foreground">🔤 Alphabet & Sounds</h3>
          <p className="text-xs text-muted-foreground">{language} — Tap each card, hear the sound</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-secondary rounded-xl transition-colors">
          <X size={20} className="text-muted-foreground" />
        </button>
      </div>

      {/* Progress */}
      <div className="px-6 pt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Card {currentIdx + 1} of {items.length}</span>
          <span>{visitedRef.current.size} visited</span>
        </div>
        <div className="w-full h-1.5 bg-secondary/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
            animate={{ width: `${((currentIdx + 1) / items.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Main Card */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            onClick={() => setFlipped(prev => ({ ...prev, [currentIdx]: !prev[currentIdx] }))}
            className="w-full max-w-sm cursor-pointer perspective-1000"
          >
            <div className={`relative w-full min-h-[280px] rounded-3xl border-2 transition-all duration-500 ${
              flipped[currentIdx]
                ? 'bg-primary/5 border-primary/30'
                : 'bg-secondary/30 border-border/50 hover:border-primary/30'
            }`}>
              {/* Front */}
              <div className="flex flex-col items-center justify-center h-full min-h-[280px] p-8">
                <span className="text-7xl sm:text-8xl font-black text-foreground mb-4">{item.char}</span>
                
                <button
                  onClick={(e) => { e.stopPropagation(); speakChar(item.char); }}
                  className="p-3 bg-primary/10 hover:bg-primary/20 rounded-full text-primary transition-colors mb-4"
                >
                  <Volume2 size={24} />
                </button>

                <AnimatePresence>
                  {flipped[currentIdx] && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="text-center mt-2"
                    >
                      <p className="text-lg font-bold text-primary mb-1">/{item.romanization}/</p>
                      <p className="text-sm text-muted-foreground font-medium">{item.example}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!flipped[currentIdx] && (
                  <p className="text-xs text-muted-foreground/50 mt-2">Tap to reveal pronunciation</p>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="px-6 pb-6 flex items-center justify-between gap-4">
        <button
          onClick={() => goTo(currentIdx - 1)}
          disabled={currentIdx === 0}
          className="p-3 bg-secondary hover:bg-secondary/80 rounded-xl disabled:opacity-30 transition-colors"
        >
          <ChevronLeft size={20} className="text-foreground" />
        </button>

        {visitedAll ? (
          <motion.button
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={onComplete}
            className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={20} />
            Complete Lesson (+25 XP)
          </motion.button>
        ) : (
          <button
            onClick={() => goTo(currentIdx + 1)}
            className="flex-1 py-4 bg-primary text-primary-foreground font-bold rounded-2xl hover:opacity-90 transition-opacity"
          >
            {currentIdx === items.length - 1 ? 'Review Cards' : 'Next Card'}
          </button>
        )}

        <button
          onClick={() => goTo(currentIdx + 1)}
          disabled={currentIdx === items.length - 1}
          className="p-3 bg-secondary hover:bg-secondary/80 rounded-xl disabled:opacity-30 transition-colors"
        >
          <ChevronRight size={20} className="text-foreground" />
        </button>
      </div>
    </div>
  );
};

export default AlphabetLesson;

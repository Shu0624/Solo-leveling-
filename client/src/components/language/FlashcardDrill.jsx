import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, CheckCircle2, X, ChevronRight, Volume2 } from 'lucide-react';

const LANG_CODES = { German: 'de-DE', Japanese: 'ja-JP', French: 'fr-FR', Spanish: 'es-ES', Mandarin: 'zh-CN' };

const FlashcardDrill = ({ data, language, onComplete, onClose }) => {
  const words = data || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knewCount, setKnewCount] = useState(0);
  const [done, setDone] = useState(false);

  const word = words[currentIdx];

  const speakWord = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = LANG_CODES[language] || 'en-US';
    utter.rate = 0.75;
    window._activeUtterance = utter;
    window.speechSynthesis.speak(utter);
  };

  const handleResponse = (knew) => {
    if (knew) setKnewCount(prev => prev + 1);
    
    if (currentIdx >= words.length - 1) {
      setDone(true);
    } else {
      setIsFlipped(false);
      setTimeout(() => setCurrentIdx(prev => prev + 1), 200);
    }
  };

  if (done) {
    const pct = Math.round((knewCount / words.length) * 100);
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h3 className="text-lg font-black text-foreground">📚 Core Vocabulary</h3>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-xl"><X size={20} className="text-muted-foreground" /></button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.4 }}>
            <div className="text-6xl mb-4">{pct >= 70 ? '🎉' : '💪'}</div>
            <h3 className="text-2xl font-black text-foreground mb-2">
              {pct >= 70 ? 'Great Job!' : 'Keep Practicing!'}
            </h3>
            <p className="text-muted-foreground mb-2">
              You knew <span className="text-primary font-bold">{knewCount}</span> out of <span className="font-bold">{words.length}</span> words
            </p>
            <p className="text-sm text-muted-foreground mb-8">({pct}% accuracy)</p>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={onComplete}
            className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-xl transition-all flex items-center gap-2"
          >
            <CheckCircle2 size={20} />
            Complete Lesson (+25 XP)
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div>
          <h3 className="text-lg font-black text-foreground">📚 Core Vocabulary</h3>
          <p className="text-xs text-muted-foreground">Flip each card — do you know this word?</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-secondary rounded-xl transition-colors">
          <X size={20} className="text-muted-foreground" />
        </button>
      </div>

      {/* Progress */}
      <div className="px-6 pt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Word {currentIdx + 1} of {words.length}</span>
          <span className="text-primary font-bold">{knewCount} known</span>
        </div>
        <div className="w-full h-1.5 bg-secondary/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
            animate={{ width: `${((currentIdx + 1) / words.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, rotateY: 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, x: -200 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full max-w-sm cursor-pointer"
          >
            <div className={`relative w-full min-h-[300px] rounded-3xl border-2 transition-all duration-300 flex flex-col items-center justify-center p-8 ${
              isFlipped
                ? 'bg-primary/5 border-primary/30'
                : 'bg-secondary/30 border-border/50 hover:border-primary/20'
            }`}>
              {/* Front: Native script */}
              <span className="text-4xl sm:text-5xl font-black text-foreground mb-3">{word.native}</span>
              
              <button
                onClick={(e) => { e.stopPropagation(); speakWord(word.native); }}
                className="p-2.5 bg-primary/10 hover:bg-primary/20 rounded-full text-primary transition-colors mb-4"
              >
                <Volume2 size={20} />
              </button>

              <AnimatePresence>
                {isFlipped && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center border-t border-border/50 pt-4 mt-2 w-full"
                  >
                    <p className="text-sm font-mono text-muted-foreground mb-1">{word.romanization}</p>
                    <p className="text-xl font-bold text-primary">{word.english}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {!isFlipped && (
                <p className="text-xs text-muted-foreground/50 mt-2">Tap to reveal meaning</p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Response buttons */}
      <div className="px-6 pb-6">
        {isFlipped ? (
          <div className="flex gap-3">
            <button
              onClick={() => handleResponse(false)}
              className="flex-1 py-4 bg-secondary border border-border/50 text-foreground font-bold rounded-2xl hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} />
              Still Learning
            </button>
            <button
              onClick={() => handleResponse(true)}
              className="flex-1 py-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold rounded-2xl hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} />
              I Knew It!
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsFlipped(true)}
            className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            Flip Card <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default FlashcardDrill;

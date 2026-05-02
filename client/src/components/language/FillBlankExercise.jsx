import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, X, ChevronRight } from 'lucide-react';

const FillBlankExercise = ({ data, language, onComplete, onClose }) => {
  const questions = data || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [done, setDone] = useState(false);

  const q = questions[currentIdx];

  const handleSelect = (option) => {
    if (showResult) return;
    setSelectedAnswer(option);
    setShowResult(true);
    if (option === q.answer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx >= questions.length - 1) {
      setDone(true);
    } else {
      setSelectedAnswer(null);
      setShowResult(false);
      setCurrentIdx(prev => prev + 1);
    }
  };

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    const passed = pct >= 60;
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h3 className="text-lg font-black text-foreground">✏️ Build a Sentence</h3>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-xl"><X size={20} className="text-muted-foreground" /></button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.4 }}>
            <div className="text-6xl mb-4">{passed ? '🎉' : '💪'}</div>
            <h3 className="text-2xl font-black text-foreground mb-2">
              {passed ? 'Excellent!' : 'Keep Practicing!'}
            </h3>
            <p className="text-muted-foreground mb-1">
              Score: <span className="text-primary font-bold">{score}</span> / {questions.length}
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
          <h3 className="text-lg font-black text-foreground">✏️ Build a Sentence</h3>
          <p className="text-xs text-muted-foreground">Fill in the missing {language} word</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-secondary rounded-xl transition-colors">
          <X size={20} className="text-muted-foreground" />
        </button>
      </div>

      {/* Progress */}
      <div className="px-6 pt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Question {currentIdx + 1} of {questions.length}</span>
          <span className="text-primary font-bold">{score} correct</span>
        </div>
        <div className="w-full h-1.5 bg-secondary/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
            animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col px-6 py-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="flex-1 flex flex-col"
          >
            {/* English sentence */}
            <div className="mb-6 p-4 bg-secondary/30 border border-border/50 rounded-2xl">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Translate</p>
              <p className="text-lg font-bold text-foreground">{q.english}</p>
            </div>

            {/* Template with blank */}
            <div className="mb-8 p-5 bg-primary/5 border-2 border-primary/20 rounded-2xl text-center">
              <p className="text-xl sm:text-2xl font-bold text-foreground leading-relaxed">
                {q.template.split('____').map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className={`inline-block min-w-[80px] border-b-3 mx-1 pb-1 font-black ${
                        showResult
                          ? selectedAnswer === q.answer
                            ? 'text-emerald-400 border-emerald-400'
                            : 'text-red-400 border-red-400 line-through'
                          : 'text-primary border-primary/40'
                      }`}>
                        {selectedAnswer || '____'}
                      </span>
                    )}
                  </span>
                ))}
              </p>
              {showResult && selectedAnswer !== q.answer && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-emerald-400 font-bold mt-3"
                >
                  Correct answer: {q.answer}
                </motion.p>
              )}
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3">
              {q.options.map((option) => {
                const isCorrect = option === q.answer;
                const isChosen = option === selectedAnswer;

                return (
                  <motion.button
                    key={option}
                    onClick={() => handleSelect(option)}
                    whileTap={!showResult ? { scale: 0.96 } : {}}
                    className={`py-4 px-4 rounded-2xl font-bold text-sm transition-all duration-200 border-2 flex items-center justify-center gap-2 ${
                      showResult
                        ? isCorrect
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                          : isChosen && !isCorrect
                          ? 'bg-red-500/10 border-red-500/40 text-red-400'
                          : 'bg-secondary/20 border-border/30 text-muted-foreground/50'
                        : 'bg-secondary/40 border-border/50 text-foreground hover:border-primary/40 hover:bg-primary/5'
                    }`}
                    disabled={showResult}
                  >
                    {showResult && isCorrect && <CheckCircle2 size={16} />}
                    {showResult && isChosen && !isCorrect && <XCircle size={16} />}
                    {option}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Next button */}
      {showResult && (
        <div className="px-6 pb-6">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleNext}
            className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {currentIdx === questions.length - 1 ? 'See Results' : 'Next Question'}
            <ChevronRight size={18} />
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default FillBlankExercise;

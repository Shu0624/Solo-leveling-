import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X, Clock, Zap, RotateCcw } from 'lucide-react';

const MatchPairsGame = ({ data, language, onComplete, onClose }) => {
  const pairs = data || [];
  const [tiles, setTiles] = useState([]);
  const [selected, setSelected] = useState([]);
  const [matched, setMatched] = useState(new Set());
  const [shaking, setShaking] = useState(null);
  const [timer, setTimer] = useState(0);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const timerRef = useRef(null);

  // Shuffle and create tiles on mount
  useEffect(() => {
    resetGame();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const resetGame = () => {
    const all = [];
    pairs.forEach((pair, idx) => {
      all.push({ id: `n-${idx}`, pairId: idx, text: pair.native, type: 'native' });
      all.push({ id: `e-${idx}`, pairId: idx, text: pair.english, type: 'english' });
    });
    // Fisher-Yates shuffle
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    setTiles(all);
    setSelected([]);
    setMatched(new Set());
    setTimer(0);
    setStarted(false);
    setDone(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleTileClick = (tile) => {
    if (!started) {
      setStarted(true);
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    }

    if (matched.has(tile.pairId) || selected.find(s => s.id === tile.id)) return;
    if (selected.length >= 2) return;

    const newSelected = [...selected, tile];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      const [a, b] = newSelected;
      if (a.pairId === b.pairId && a.type !== b.type) {
        // Match!
        setTimeout(() => {
          setMatched(prev => {
            const next = new Set(prev);
            next.add(a.pairId);
            // Check win
            if (next.size >= pairs.length) {
              clearInterval(timerRef.current);
              setDone(true);
            }
            return next;
          });
          setSelected([]);
        }, 400);
      } else {
        // No match
        setShaking(Date.now());
        setTimeout(() => {
          setSelected([]);
          setShaking(null);
        }, 600);
      }
    }
  };

  const formatTimer = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const isSpeedBonus = timer <= 60 && done;

  if (done) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h3 className="text-lg font-black text-foreground">🧩 Match the Pairs</h3>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-xl"><X size={20} className="text-muted-foreground" /></button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.4 }}>
            <div className="text-6xl mb-4">{isSpeedBonus ? '⚡' : '🎉'}</div>
            <h3 className="text-2xl font-black text-foreground mb-2">
              {isSpeedBonus ? 'Lightning Fast!' : 'All Pairs Matched!'}
            </h3>
            <p className="text-muted-foreground mb-1">
              Completed in <span className="text-primary font-bold">{formatTimer(timer)}</span>
            </p>
            {isSpeedBonus && (
              <p className="text-sm text-amber-400 font-bold flex items-center justify-center gap-1 mb-2">
                <Zap size={14} /> Speed Bonus! Under 60 seconds
              </p>
            )}
            <p className="text-sm text-muted-foreground mb-8">
              {pairs.length} pairs matched
            </p>
          </motion.div>
          <div className="flex gap-3">
            <button onClick={resetGame} className="px-6 py-3 bg-secondary border border-border/50 text-foreground font-bold rounded-2xl flex items-center gap-2">
              <RotateCcw size={16} /> Retry
            </button>
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={onComplete}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <CheckCircle2 size={18} /> Complete (+25 XP)
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div>
          <h3 className="text-lg font-black text-foreground">🧩 Match the Pairs</h3>
          <p className="text-xs text-muted-foreground">Tap two tiles to match {language} ↔ English</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-secondary rounded-xl transition-colors">
          <X size={20} className="text-muted-foreground" />
        </button>
      </div>

      {/* Stats bar */}
      <div className="px-6 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Clock size={14} className="text-muted-foreground" />
          <span className="font-mono font-bold text-foreground">{formatTimer(timer)}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="text-primary font-bold">{matched.size}</span> / {pairs.length} matched
        </div>
      </div>

      {/* Progress */}
      <div className="px-6 pt-2">
        <div className="w-full h-1.5 bg-secondary/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
            animate={{ width: `${(matched.size / pairs.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Tile Grid */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6">
        <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full max-w-lg">
          {tiles.map((tile) => {
            const isMatched = matched.has(tile.pairId);
            const isSelected = selected.find(s => s.id === tile.id);
            const isWrongShake = shaking && selected.find(s => s.id === tile.id);

            return (
              <motion.button
                key={tile.id}
                onClick={() => handleTileClick(tile)}
                animate={isWrongShake ? { x: [0, -6, 6, -6, 6, 0] } : {}}
                transition={{ duration: 0.4 }}
                disabled={isMatched}
                className={`aspect-square rounded-xl sm:rounded-2xl flex items-center justify-center p-1.5 sm:p-2 text-center text-xs sm:text-sm font-bold transition-all duration-200 border-2 ${
                  isMatched
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 opacity-60 scale-95'
                    : isSelected
                    ? 'bg-primary/15 border-primary/60 text-primary shadow-lg shadow-primary/10 scale-[1.03]'
                    : 'bg-secondary/40 border-border/40 text-foreground hover:border-primary/30 hover:bg-secondary/60'
                }`}
              >
                <span className="leading-tight break-all">{tile.text}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MatchPairsGame;

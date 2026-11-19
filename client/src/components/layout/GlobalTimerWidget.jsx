import { useActivity, ACTIVITY_CATEGORIES } from '../../context/ActivityContext';
import { Play, Pause, Square } from 'lucide-react';
import { useLocation } from 'react-router-dom';

// Rendered on every page, so it deliberately avoids framer-motion: importing it
// here put the whole animation library on the landing page's critical path.

const GlobalTimerWidget = () => {
  const { 
    timerRunning, timerSeconds, timerCategory, formatTime, 
    pauseTimer, startTimer, stopAndSaveTimer 
  } = useActivity();
  
  const location = useLocation();

  // Don't show compact widget if on Dashboard, because Dashboard has the big timer
  if (location.pathname === '/dashboard') return null;
  // If timer isn't running and has 0 seconds, don't show it either to keep UI clean
  if (!timerRunning && timerSeconds === 0) return null;

  const currentCat = ACTIVITY_CATEGORIES.find(c => c.value === timerCategory);

  return (
      <div
        className="animate-fade-in motion-reduce:animate-none fixed top-20 right-4 md:right-8 z-50 glass-morphism px-4 py-2 flex items-center gap-4 border-primary/20 shadow-lg shadow-primary/10 rounded-full bg-background/80 backdrop-blur-xl"
      >
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: currentCat?.color || 'var(--primary)' }} />
          <span className="text-xs font-bold text-muted-foreground uppercase">{currentCat?.label}</span>
        </div>
        
        <div className="text-lg font-mono font-bold tracking-tight text-foreground w-16 text-center">
          {formatTime(timerSeconds)}
        </div>

        <div className="flex gap-1 border-l border-border/50 pl-3">
          {timerRunning ? (
            <button onClick={pauseTimer} className="p-1.5 text-warning hover:bg-warning/10 rounded-full transition-colors">
              <Pause size={16} fill="currentColor" />
            </button>
          ) : (
            <button onClick={startTimer} className="p-1.5 text-success hover:bg-success/10 rounded-full transition-colors">
              <Play size={16} fill="currentColor" />
            </button>
          )}
          <button onClick={stopAndSaveTimer} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-full transition-colors">
            <Square size={14} fill="currentColor" />
          </button>
        </div>
      </div>
  );
};

export default GlobalTimerWidget;

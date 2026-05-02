import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle2, ChevronRight, Sparkles, Trophy, BookOpen } from 'lucide-react';

/**
 * Generic, reusable lesson pathway component.
 * Supports any phase — just pass in the lessons meta, completed list, and config.
 */
const LessonPathway = ({ 
  lessonsMeta = [],
  completedLessons = [], 
  onStartLesson, 
  language,
  phaseNumber = 1,
  phaseTitle = 'Foundation',
  phaseIcon = null,
  accentColor = 'primary',  // 'primary' | 'accent' | 'amber'
  locked = false,            // entire phase is locked
}) => {
  const allDone = completedLessons.length >= lessonsMeta.length;

  const colorMap = {
    primary: {
      text: 'text-primary',
      bg: 'bg-primary/10',
      border: 'border-primary/50',
      shadow: 'shadow-primary/10',
      progress: 'from-primary to-accent',
      badge: 'text-primary bg-primary/10',
      hover: 'hover:border-primary',
      pulse: 'border-primary/40',
    },
    accent: {
      text: 'text-accent',
      bg: 'bg-accent/10',
      border: 'border-accent/50',
      shadow: 'shadow-accent/10',
      progress: 'from-accent to-purple-500',
      badge: 'text-accent bg-accent/10',
      hover: 'hover:border-accent',
      pulse: 'border-accent/40',
    },
  };
  const colors = colorMap[accentColor] || colorMap.primary;

  if (locked) {
    return (
      <div className="w-full opacity-50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center">
              <Lock size={18} className="text-muted-foreground/50" />
            </div>
            <div>
              <h2 className="text-lg font-black text-muted-foreground flex items-center gap-2">
                Phase {phaseNumber} — {phaseTitle}
              </h2>
              <p className="text-xs text-muted-foreground/60">Complete Phase {phaseNumber - 1} to unlock</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-0">
          {lessonsMeta.map((lesson, idx) => (
            <div key={lesson.key} className="flex items-center">
              <div className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl bg-secondary/20 border-2 border-border/20 min-w-[100px] sm:min-w-[120px] cursor-not-allowed">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-secondary/30 flex items-center justify-center">
                  <Lock size={18} className="text-muted-foreground/30" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-muted-foreground/30 text-center leading-tight">{lesson.title}</span>
              </div>
              {idx < lessonsMeta.length - 1 && (
                <div className="hidden md:flex items-center mx-1">
                  <div className="w-8 lg:w-12 h-0.5 bg-border/20" />
                  <ChevronRight size={14} className="text-muted-foreground/20" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Phase Title */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          {phaseIcon || <Sparkles className={colors.text} size={22} />}
          <div>
            <h2 className="text-xl font-black text-foreground">
              Phase {phaseNumber} — {phaseTitle}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {allDone 
                ? `🎉 All lessons complete!` 
                : `${completedLessons.length} / ${lessonsMeta.length} lessons completed`
              }
            </p>
          </div>
        </div>
        {allDone && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-xl"
          >
            <Trophy size={18} className="text-amber-400" />
            <span className="text-sm font-bold text-amber-400">Phase {phaseNumber} Mastered</span>
          </motion.div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-secondary/50 rounded-full mb-10 overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${colors.progress} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${(completedLessons.length / lessonsMeta.length) * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Lesson Nodes — Horizontal Pathway */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-0">
        {lessonsMeta.map((lesson, idx) => {
          const isCompleted = completedLessons.includes(lesson.key);
          const isUnlocked = idx === 0 || completedLessons.includes(lessonsMeta[idx - 1].key);
          const isLocked = !isCompleted && !isUnlocked;
          const isNext = isUnlocked && !isCompleted;

          return (
            <div key={lesson.key} className="flex items-center">
              {/* Node */}
              <motion.button
                onClick={() => !isLocked && onStartLesson(lesson.key)}
                disabled={isLocked}
                whileHover={!isLocked ? { scale: 1.08 } : {}}
                whileTap={!isLocked ? { scale: 0.95 } : {}}
                className={`relative flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl transition-all duration-300 min-w-[100px] sm:min-w-[120px] group ${
                  isCompleted
                    ? `bg-emerald-500/10 border-2 border-emerald-500/40 hover:border-emerald-400 cursor-pointer`
                    : isNext
                    ? `${colors.bg} border-2 ${colors.border} ${colors.hover} shadow-lg ${colors.shadow} cursor-pointer`
                    : 'bg-secondary/30 border-2 border-border/30 cursor-not-allowed opacity-50'
                }`}
              >
                {/* Pulse ring for next lesson */}
                {isNext && (
                  <div className={`absolute inset-0 rounded-2xl border-2 ${colors.pulse} animate-ping pointer-events-none`} />
                )}

                {/* Icon Area */}
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110 ${
                  isCompleted
                    ? 'bg-emerald-500/20'
                    : isNext
                    ? colors.bg
                    : 'bg-secondary/50'
                }`}>
                  {isLocked ? (
                    <Lock size={20} className="text-muted-foreground/50" />
                  ) : isCompleted ? (
                    <CheckCircle2 size={24} className="text-emerald-400" />
                  ) : (
                    <span>{lesson.icon}</span>
                  )}
                </div>

                {/* Title */}
                <span className={`text-[11px] sm:text-xs font-bold text-center leading-tight ${
                  isCompleted ? 'text-emerald-400' : isNext ? colors.text : 'text-muted-foreground/50'
                }`}>
                  {lesson.title}
                </span>

                {/* Status Badge */}
                {isCompleted && (
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    +25 XP
                  </span>
                )}
                {isNext && (
                  <span className={`text-[9px] font-bold ${colors.badge} px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse`}>
                    Start
                  </span>
                )}
              </motion.button>

              {/* Connector Line */}
              {idx < lessonsMeta.length - 1 && (
                <div className="hidden md:flex items-center mx-1">
                  <div className={`w-8 lg:w-12 h-0.5 ${
                    completedLessons.includes(lessonsMeta[idx].key) 
                      ? 'bg-emerald-500/50' 
                      : 'bg-border/30'
                  }`} 
                    style={{ backgroundImage: completedLessons.includes(lessonsMeta[idx].key) ? 'none' : 'repeating-linear-gradient(90deg, transparent, transparent 4px, currentColor 4px, currentColor 8px)' }}
                  />
                  <ChevronRight size={14} className={
                    completedLessons.includes(lessonsMeta[idx].key) 
                      ? 'text-emerald-400' 
                      : 'text-muted-foreground/30'
                  } />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LessonPathway;

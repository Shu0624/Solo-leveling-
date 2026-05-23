import { motion } from 'framer-motion';
import { useActivity } from '../../context/ActivityContext';
import { Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// =====================================================================
// Focus Score Ring — Animated circular progress for focus quality
// Shows: score ring, label, trend indicator
// =====================================================================

const FocusScoreRing = ({ score = null, size = 'md', showLabel = true, className = '' }) => {
  const displayScore = score !== null ? score : 0;
  const hasData = score !== null && score > 0;

  // Size variants
  const sizes = {
    sm: { width: 72,  radius: 28, stroke: 5, textSize: 'text-lg',  labelSize: 'text-[9px]' },
    md: { width: 100, radius: 40, stroke: 6, textSize: 'text-2xl', labelSize: 'text-[10px]' },
    lg: { width: 140, radius: 56, stroke: 8, textSize: 'text-4xl', labelSize: 'text-xs' },
  };
  const s = sizes[size] || sizes.md;

  const circumference = 2 * Math.PI * s.radius;
  const progress = hasData ? (displayScore / 100) * circumference : 0;

  // Color based on score
  const getColor = (val) => {
    if (val >= 80) return '#34d399';  // emerald
    if (val >= 60) return '#3b82f6';  // blue
    if (val >= 40) return '#f59e0b';  // amber
    return '#ef4444';                  // red
  };
  const color = hasData ? getColor(displayScore) : '#3f3f46';

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: s.width, height: s.width }}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${s.width} ${s.width}`}>
          {/* Background track */}
          <circle
            cx={s.width / 2} cy={s.width / 2} r={s.radius}
            fill="none" stroke="currentColor" strokeWidth={s.stroke}
            className="text-white/8"
          />
          {/* Progress arc */}
          {hasData && (
            <motion.circle
              cx={s.width / 2} cy={s.width / 2} r={s.radius}
              fill="none" stroke={color} strokeWidth={s.stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - progress }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            />
          )}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${s.textSize} font-black`} style={{ color: hasData ? color : '#52525b' }}>
            {hasData ? displayScore : '—'}
          </span>
        </div>
      </div>
      {showLabel && (
        <div className="text-center mt-2">
          <div className={`${s.labelSize} font-bold text-white/40 uppercase tracking-widest`}>
            Focus Score
          </div>
        </div>
      )}
    </div>
  );
};

export default FocusScoreRing;

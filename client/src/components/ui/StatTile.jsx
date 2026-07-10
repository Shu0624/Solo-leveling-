import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCountUp } from './useCountUp';

const toneStyles = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-destructive',
  accent: 'text-accent',
  default: 'text-foreground',
};

/**
 * Fintech-style stat tile: label, big tabular value with count-up, optional
 * delta chip and trailing slot (e.g. sparkline). `hero` gives it the cyan glow.
 */
export default function StatTile({
  label,
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
  icon,
  tone = 'default',
  delta,
  trend, // 'up' | 'down' | 'neutral'
  hero = false,
  countUp = true,
  className,
}) {
  const numeric = typeof value === 'number';
  const animated = useCountUp(numeric ? value : 0, { decimals });
  const shown = numeric && countUp ? animated.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }) : value;

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up' ? 'text-success bg-success/10'
    : trend === 'down' ? 'text-destructive bg-destructive/10'
    : 'text-muted-foreground bg-secondary';

  return (
    <div
      className={cn(
        'relative rounded-2xl border p-5 bg-card overflow-hidden transition-all duration-200 ease-out-expo',
        hero ? 'border-primary/30 shadow-glow' : 'border-border shadow-sm-token hover:border-border/80',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">
          {label}
        </span>
        {icon && (
          <span className={cn('shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-secondary', toneStyles[tone])}>
            {icon}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-2">
        <div className={cn('font-display tnum text-3xl sm:text-4xl font-bold leading-none tracking-display', toneStyles[tone])}>
          {prefix}{shown}{suffix}
        </div>
        {(delta != null) && (
          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold', trendColor)}>
            <TrendIcon size={12} />
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}

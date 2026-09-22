import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCountUp } from './useCountUp';

// ─────────────────────────────────────────────────────────────────
// StatTile — a figure with its label, set like a table cell.
//
// The number is the loudest thing in the tile and everything else
// recedes: the label is small caps, the delta is plain text with a
// direction glyph rather than a coloured pill, and the tile itself is
// a hairline rule with no glow.
//
// Figures are tabular so a row of tiles aligns on the decimal.
// ─────────────────────────────────────────────────────────────────

const toneStyles = {
  primary: 'text-[hsl(var(--primary-accent))]',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-destructive',
  accent: 'text-accent',
  default: 'text-foreground',
};

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
  const shown = numeric && countUp
    ? animated.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : value;

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up' ? 'text-success'
    : trend === 'down' ? 'text-destructive'
    : 'text-muted-foreground';

  return (
    <div
      className={cn(
        'relative rounded-md border bg-card p-4 transition-colors duration-[var(--dur)]',
        hero ? 'border-[hsl(var(--primary-accent))]/40' : 'border-border hover:border-muted-foreground/35',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.07em] text-muted-foreground truncate">
          {label}
        </span>
        {icon && (
          <span className={cn('shrink-0 text-muted-foreground', toneStyles[tone])} aria-hidden="true">
            {icon}
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline gap-2">
        <span
          className={cn(
            'font-display tnum text-[28px] font-semibold leading-none',
            toneStyles[tone]
          )}
        >
          {prefix}{shown}{suffix}
        </span>

        {delta != null && (
          <span className={cn('inline-flex items-center gap-1 text-[13px] font-medium tnum', trendColor)}>
            <TrendIcon size={13} aria-hidden="true" />
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}

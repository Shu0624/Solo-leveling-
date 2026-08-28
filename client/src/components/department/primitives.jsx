import { cn } from '../../lib/utils';

/**
 * The small vocabulary the register is written in.
 *
 * A department register is a document before it is an interface, so status
 * here is a word with a mark beside it — never a colour on its own, never an
 * emoji. Anyone printing a page or reading it colour-blind still gets the
 * information.
 */

/* -------------------------------------------------------------------------- */
/* Attendance standing                                                        */
/* -------------------------------------------------------------------------- */

export const attendanceTone = (pct, threshold = 75) => {
  if (pct < threshold) return 'short';
  if (pct < threshold + 5) return 'watch';
  return 'clear';
};

const TONE_TEXT = {
  short: 'text-destructive',
  watch: 'text-warning',
  clear: 'text-success',
  neutral: 'text-foreground',
};

const TONE_DOT = {
  short: 'bg-destructive',
  watch: 'bg-warning',
  clear: 'bg-success',
  neutral: 'bg-muted-foreground/50',
};

/** A 6px mark. Enough to scan a column by, small enough not to shout. */
export function Mark({ tone = 'neutral', className }) {
  return <span aria-hidden className={cn('inline-block w-1.5 h-1.5 rounded-full shrink-0', TONE_DOT[tone], className)} />;
}

export function Standing({ tone = 'neutral', children, className }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 text-xs font-medium',
      tone === 'neutral' ? 'text-muted-foreground' : TONE_TEXT[tone],
      className
    )}>
      <Mark tone={tone} />
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Figures                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * One cell of the ledger strip. Figure, what it counts, and the qualifier a
 * person would say out loud after it ("of 64 on roll", "below 75%").
 */
export function Figure({ label, value, note, tone = 'neutral', onClick, active = false, className }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-pressed={onClick ? active : undefined}
      className={cn(
        'text-left px-4 py-3.5 sm:px-5 bg-card',
        onClick && 'transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
        active && 'bg-secondary',
        className
      )}
    >
      <div className="flex items-baseline gap-2">
        <span className={cn('font-display tnum text-2xl sm:text-[1.75rem] font-semibold leading-none tracking-tight', TONE_TEXT[tone])}>
          {value}
        </span>
        {tone !== 'neutral' && <Mark tone={tone} className="mb-0.5" />}
      </div>
      <div className="mt-1.5 text-[0.8125rem] font-medium text-foreground/90">{label}</div>
      {note && <div className="mt-0.5 text-xs text-muted-foreground leading-snug">{note}</div>}
    </Tag>
  );
}

/**
 * Hairline-divided band of figures — the summary line of a printed register.
 * The 1px gap over a border-coloured ground gives clean rules in both
 * directions however the cells wrap, which a flex row with dividers does not.
 */
export function LedgerStrip({ children, className }) {
  return (
    <div className={cn('rounded-xl border border-border overflow-hidden', className)}>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-border">
        {children}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Bars                                                                       */
/* -------------------------------------------------------------------------- */

/** Attendance bar with the regulation line drawn on it, where it belongs. */
export function AttendanceBar({ percentage, threshold = 75, className }) {
  const tone = attendanceTone(percentage, threshold);
  const fill = { short: 'bg-destructive', watch: 'bg-warning', clear: 'bg-success' }[tone];
  return (
    <div className={cn('relative h-1.5 w-full rounded-full bg-secondary overflow-hidden', className)}>
      <div className={cn('absolute inset-y-0 left-0 rounded-full', fill)} style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }} />
      <span
        aria-hidden
        title={`${threshold}% requirement`}
        className="absolute inset-y-0 w-px bg-foreground/40"
        style={{ left: `${threshold}%` }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Layout helpers                                                             */
/* -------------------------------------------------------------------------- */

export function SectionTitle({ children, note, action, className }) {
  return (
    <div className={cn('flex items-end justify-between gap-4 mb-3', className)}>
      <div>
        <h2 className="text-sm font-semibold text-foreground tracking-tight">{children}</h2>
        {note && <p className="text-xs text-muted-foreground mt-0.5 max-w-prose">{note}</p>}
      </div>
      {action}
    </div>
  );
}

/** Label/value pair as it would appear on a form. */
export function Field({ label, value, mono = false, className }) {
  return (
    <div className={className}>
      <dt className="text-[0.6875rem] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={cn('text-sm text-foreground mt-0.5', mono && 'font-mono tnum')}>{value || <span className="text-muted-foreground">Not on record</span>}</dd>
    </div>
  );
}

export function Rule({ className }) {
  return <hr className={cn('border-0 border-t border-border', className)} />;
}

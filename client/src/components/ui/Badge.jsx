import { cn } from '../../lib/utils';

// Editorial tags: square, hairline-ruled, low-saturation. The old pill shape
// plus 10%-tint fill is the single most recognisable "generic dashboard"
// signature, so both are gone.
const tones = {
  default: 'bg-secondary text-secondary-foreground border-border',
  primary: 'bg-transparent text-[hsl(var(--primary-accent))] border-[hsl(var(--primary-accent))]/35',
  success: 'bg-transparent text-success border-success/40',
  warning: 'bg-transparent text-warning border-warning/40',
  danger:  'bg-transparent text-destructive border-destructive/40',
  info:    'bg-transparent text-info border-info/40',
  accent:  'bg-transparent text-accent border-accent/40',
  /** Filled — for the one status per view that must be unmissable. */
  solid:   'bg-primary text-primary-foreground border-primary',
};

export default function Badge({ tone = 'default', icon, className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] border',
        'text-[11px] font-medium uppercase tracking-[0.06em] leading-5',
        tones[tone] ?? tones.default,
        className
      )}
      {...props}
    >
      {icon && <span aria-hidden="true" className="[&>svg]:w-3 [&>svg]:h-3">{icon}</span>}
      {children}
    </span>
  );
}

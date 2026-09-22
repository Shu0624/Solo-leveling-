import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

// ─────────────────────────────────────────────────────────────────
// Button
//
// Editorial rules this encodes:
//  · One solid button per view. Everything else is outline or quiet.
//  · No lift-on-hover. Paper does not levitate; it darkens under the
//    thumb. Hover changes tone, press changes tone further.
//  · Weight is 500, not 600/700. A serif page with heavy sans buttons
//    reads like two unrelated designs.
// ─────────────────────────────────────────────────────────────────

const variants = {
  // The single call to action.
  primary: 'bg-primary text-primary-foreground border border-primary hover:bg-primary/90 active:bg-primary/80',
  // Default for most actions: reads as paper with a rule around it.
  outline: 'bg-card text-foreground border border-input hover:bg-elevated active:bg-secondary',
  // Sits on a card that already has a border.
  secondary: 'bg-secondary text-secondary-foreground border border-transparent hover:bg-elevated active:bg-secondary',
  // Toolbar / inline actions with no chrome until touched.
  ghost: 'bg-transparent text-muted-foreground border border-transparent hover:bg-secondary hover:text-foreground active:bg-elevated',
  // Reads as a link, behaves as a button.
  link: 'bg-transparent border-0 text-[hsl(var(--primary-accent))] underline underline-offset-4 decoration-1 hover:decoration-2 px-0 h-auto',
  danger: 'bg-destructive text-destructive-foreground border border-destructive hover:bg-destructive/90 active:bg-destructive/80',
};

const sizes = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-md',
  md: 'h-9 px-4 text-sm gap-2 rounded-md',
  lg: 'h-11 px-5 text-[15px] gap-2 rounded-md',
};

// Square footprints for icon-only buttons — matched to the text sizes above
// so an icon button lines up on the same row as a labelled one.
const iconSizes = {
  sm: 'h-8 w-8 rounded-md',
  md: 'h-9 w-9 rounded-md',
  lg: 'h-11 w-11 rounded-md',
};

const Button = forwardRef(function Button(
  {
    variant = 'outline',
    size = 'md',
    loading = false,
    iconOnly = false,
    className,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref
) {
  // An icon-only button has no accessible name unless one is supplied.
  // Fail loudly in development rather than shipping a button screen readers
  // announce as "button".
  if (
    import.meta.env?.DEV &&
    iconOnly &&
    !props['aria-label'] &&
    !props['aria-labelledby'] &&
    !props.title
  ) {
    console.error(
      '[Button] iconOnly is set but no aria-label, aria-labelledby or title was provided. ' +
      'Screen readers will announce this control as an unlabelled button.'
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center font-medium whitespace-nowrap',
        'transition-colors duration-[var(--dur-fast)] ease-out-expo select-none',
        'disabled:opacity-45 disabled:pointer-events-none',
        variants[variant],
        iconOnly ? iconSizes[size] : sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
});

export default Button;

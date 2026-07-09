import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const variants = {
  primary:
    'bg-primary text-primary-foreground shadow-glow hover:brightness-110 active:brightness-95',
  secondary:
    'bg-secondary text-secondary-foreground border border-border hover:bg-elevated',
  outline:
    'border border-border bg-transparent text-foreground hover:bg-secondary',
  ghost:
    'bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground',
  danger:
    'bg-destructive text-destructive-foreground hover:brightness-110 active:brightness-95',
};

const sizes = {
  sm: 'h-9 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2 rounded-xl',
  icon: 'h-10 w-10 rounded-xl',
};

/**
 * Shared button primitive. Token-driven, accessible focus ring, loading state.
 */
const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    className,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-semibold whitespace-nowrap',
        'transition-all duration-150 ease-out-expo select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:opacity-50 disabled:pointer-events-none',
        !loading && 'hover:-translate-y-0.5 active:translate-y-0',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
});

export default Button;

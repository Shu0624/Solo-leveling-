import { forwardRef, useId } from 'react';
import { cn } from '../../lib/utils';

// ─────────────────────────────────────────────────────────────────
// Input — label, field, hint and error as one unit.
//
// Fields were previously assembled by hand on every page, which is why
// labels, hints and error text were inconsistent and often missing. This
// wires `htmlFor`/`id`, `aria-describedby` and `aria-invalid` together so
// the accessible wiring cannot drift from the visual one.
// ─────────────────────────────────────────────────────────────────

export const fieldBase =
  'w-full bg-card border rounded-md text-sm text-foreground placeholder:text-muted-foreground ' +
  'transition-colors duration-[var(--dur-fast)] outline-none ' +
  'hover:border-muted-foreground/50 disabled:opacity-50 disabled:cursor-not-allowed';

const Input = forwardRef(function Input(
  {
    label,
    hint,
    error,
    icon,
    id: idProp,
    className,
    containerClassName,
    required,
    ...props
  },
  ref
) {
  const reactId = useId();
  const id = idProp || `field-${reactId}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label && (
        <label htmlFor={id} className="block text-[13px] font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && (
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={cn(errorId, hintId) || undefined}
          className={cn(
            fieldBase,
            'h-9 px-3',
            icon && 'pl-9',
            error ? 'border-destructive' : 'border-input',
            className
          )}
          {...props}
        />
      </div>

      {error ? (
        <p id={errorId} role="alert" className="text-[13px] text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[13px] text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default Input;

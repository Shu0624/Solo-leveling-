import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

// ─────────────────────────────────────────────────────────────────
// Card
//
// A sheet of paper, delimited by a hairline rule. Depth comes from
// paper tone, not from shadow or coloured light: `card` sits on
// `background`, `elevated` sits on `card`.
//
// The old `spotlight` prop (a cursor-tracking aurora) is accepted and
// ignored so existing call sites keep working; it no longer paints.
// ─────────────────────────────────────────────────────────────────

const Card = forwardRef(function Card(
  {
    as: Tag = 'div',
    elevated = false,
    interactive = false,
    flush = false,
    spotlight,          // accepted, intentionally unused
    className,
    children,
    ...props
  },
  ref
) {
  return (
    <Tag
      ref={ref}
      className={cn(
        'rounded-md border border-border',
        !flush && 'overflow-hidden',
        elevated ? 'bg-elevated' : 'bg-card',
        interactive &&
          'transition-colors duration-[var(--dur)] hover:border-muted-foreground/40 hover:bg-elevated',
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
});

export function CardBody({ className, ...props }) {
  return <div className={cn('p-5', className)} {...props} />;
}

/**
 * CardHeader — title, optional supporting line, optional trailing action.
 * The bottom rule is what separates it from the body; there is no tinted
 * icon chip, which is the detail that made every card look identical.
 */
export function CardHeader({ title, subtitle, action, icon, className, as: Heading = 'h3' }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 px-5 py-4 border-b border-border', className)}>
      <div className="flex items-start gap-2.5 min-w-0">
        {icon && (
          <span className="shrink-0 mt-0.5 text-muted-foreground" aria-hidden="true">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          {title && (
            <Heading className="font-display text-[15px] font-semibold text-foreground truncate">
              {title}
            </Heading>
          )}
          {subtitle && <p className="text-[13px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Footer rule for actions sitting at the bottom of a card. */
export function CardFooter({ className, ...props }) {
  return (
    <div
      className={cn('flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-elevated/50', className)}
      {...props}
    />
  );
}

export default Card;

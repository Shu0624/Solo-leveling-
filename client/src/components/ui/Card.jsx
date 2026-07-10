import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

/**
 * Surface primitive. Three depth intents:
 *  - default: card surface
 *  - elevated: raised surface (hover targets, modals-in-page)
 * `spotlight` adds the mouse-tracking aurora hover from index.css (.bento-card).
 * `interactive` adds a subtle lift + border glow on hover.
 */
const Card = forwardRef(function Card(
  { as: Tag = 'div', elevated = false, spotlight = false, interactive = false, className, children, ...props },
  ref
) {
  return (
    <Tag
      ref={ref}
      className={cn(
        'rounded-2xl border border-border overflow-hidden',
        elevated ? 'bg-elevated shadow-md-token' : 'bg-card shadow-sm-token',
        spotlight && 'bento-card',
        interactive &&
          'transition-all duration-200 ease-out-expo hover:-translate-y-1 hover:border-primary/30 hover:shadow-glow',
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
});

export function CardBody({ className, ...props }) {
  return <div className={cn('p-5 sm:p-6', className)} {...props} />;
}

export function CardHeader({ title, subtitle, action, icon, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 p-5 sm:p-6 pb-0', className)}>
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <span className="shrink-0 w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          {title && <h3 className="font-display text-base font-semibold tracking-tight text-foreground truncate">{title}</h3>}
          {subtitle && <p className="text-sm text-muted-foreground truncate">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export default Card;

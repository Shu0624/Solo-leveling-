import { cn } from '../../lib/utils';

/**
 * Consistent page header: eyebrow + title + subtitle on the left, actions right.
 */
export default function PageHeader({ eyebrow, title, subtitle, actions, icon, className }) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6', className)}>
      <div className="flex items-center gap-4 min-w-0">
        {icon && (
          <span className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center shadow-glow">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">{eyebrow}</p>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

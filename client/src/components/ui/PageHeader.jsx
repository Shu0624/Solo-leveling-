import { cn } from '../../lib/utils';

/**
 * PageHeader — the masthead of a page.
 *
 * Set as a headline over a rule, the way a section opens in print. The
 * gradient icon chip is gone: it appeared identically on every page and
 * carried no information.
 */
export default function PageHeader({ eyebrow, title, subtitle, actions, icon, className }) {
  return (
    <header className={cn('mb-8 pb-5 border-b border-border', className)}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground mb-2">
              {eyebrow}
            </p>
          )}

          <div className="flex items-center gap-2.5 min-w-0">
            {icon && (
              <span className="shrink-0 text-muted-foreground" aria-hidden="true">
                {icon}
              </span>
            )}
            <h1 className="font-display text-[26px] sm:text-[32px] font-semibold text-foreground leading-tight truncate">
              {title}
            </h1>
          </div>

          {subtitle && (
            <p className="text-sm text-muted-foreground mt-2 max-w-measure-wide leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </header>
  );
}

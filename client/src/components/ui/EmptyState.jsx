import { cn } from '../../lib/utils';

/**
 * Friendly empty state: icon + one warm line + optional CTA. Never a blank panel.
 */
export default function EmptyState({ icon, title, message, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 px-6', className)}>
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-secondary text-muted-foreground flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      {title && <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>}
      {message && <p className="text-sm text-muted-foreground max-w-sm mb-4">{message}</p>}
      {action}
    </div>
  );
}

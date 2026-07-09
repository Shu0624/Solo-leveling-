import { cn } from '../../lib/utils';

const tones = {
  default: 'bg-secondary text-secondary-foreground border-border',
  primary: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  danger: 'bg-destructive/10 text-destructive border-destructive/20',
  info: 'bg-info/10 text-info border-info/20',
  accent: 'bg-accent/10 text-accent border-accent/20',
};

export default function Badge({ tone = 'default', icon, className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        tones[tone],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}

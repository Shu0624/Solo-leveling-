import { cn } from '../../lib/utils';

/**
 * Shimmer skeleton placeholder. Compose several to mirror the loaded layout.
 */
export default function Skeleton({ className, rounded = 'rounded-lg' }) {
  return <div className={cn('skeleton-shimmer bg-secondary', rounded, className)} />;
}

/** A card-shaped skeleton block for dashboard grids. */
export function SkeletonCard({ className }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-5', className)}>
      <Skeleton className="h-4 w-24 mb-4" />
      <Skeleton className="h-9 w-32 mb-3" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}

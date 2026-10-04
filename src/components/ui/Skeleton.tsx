import { cx } from '../../lib/cx';

interface SkeletonProps {
  /** Size classes, e.g. "h-4 w-20". */
  className?: string;
}

/** Grey pulsing placeholder that holds the layout while data loads. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      data-testid="skeleton"
      className={cx('inline-block animate-pulse rounded bg-surface-muted', className ?? 'h-4 w-16')}
    />
  );
}

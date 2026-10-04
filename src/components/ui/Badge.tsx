import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';

export type BadgeTone = 'neutral' | 'positive' | 'negative' | 'warning';

interface BadgeProps {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-surface-muted text-fg-muted',
  // Tinted background from the same token as the text, so it works in both themes.
  positive: 'bg-up/12 text-up',
  negative: 'bg-down/12 text-down',
  warning: 'bg-warn/15 text-warn',
};

export function Badge({ tone = 'neutral', className, children }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

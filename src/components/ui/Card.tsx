import type { HTMLAttributes } from 'react';
import { cx } from '../../lib/cx';

/** Bordered surface used for every panel. Accepts normal div props (id, role, aria-*). */
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('rounded-xl border border-border bg-surface', className)} {...rest} />;
}

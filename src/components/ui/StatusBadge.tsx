import type { ConnectionStatus } from '../../types';
import { cx } from '../../lib/cx';
import { Badge, type BadgeTone } from './Badge';

const config: Record<ConnectionStatus, { label: string; tone: BadgeTone; dot: string }> = {
  connecting: { label: 'Connecting', tone: 'neutral', dot: 'bg-fg-muted' },
  live: { label: 'Live', tone: 'positive', dot: 'bg-up animate-pulse' },
  reconnecting: { label: 'Reconnecting', tone: 'warning', dot: 'bg-warn animate-pulse' },
  offline: { label: 'Offline', tone: 'negative', dot: 'bg-down' },
};

/** Connection indicator for the market data socket. Screen readers announce changes politely. */
export function StatusBadge({ status }: { status: ConnectionStatus }) {
  const { label, tone, dot } = config[status];
  return (
    <span role="status" aria-live="polite" aria-label={`Market data: ${label}`}>
      <Badge tone={tone}>
        <span aria-hidden="true" className={cx('h-2 w-2 rounded-full', dot)} />
        {label}
      </Badge>
    </span>
  );
}

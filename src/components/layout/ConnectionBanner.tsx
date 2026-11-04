import type { ConnectionStatus } from '../../types';

const messages: Partial<Record<ConnectionStatus, string>> = {
  reconnecting: 'Can’t reach market data. Retrying…',
  offline: 'You’re offline. Prices will resume when your connection is back.',
};

/** Full-width warning shown while the socket is down. Prices on screen may be out of date. */
export function ConnectionBanner({ status }: { status: ConnectionStatus }) {
  const message = messages[status];
  if (!message) return null;
  return (
    <div role="alert" className="border-b border-warn/30 bg-warn/10 px-4 py-2 text-center text-sm font-medium text-warn">
      {message}
    </div>
  );
}

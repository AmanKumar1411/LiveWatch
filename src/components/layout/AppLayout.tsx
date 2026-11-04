import { Link, Outlet } from 'react-router-dom';
import { PERF_ENABLED } from '../../dev/perf';
import { PerfCounter } from '../../dev/PerfCounter';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';
import { StatusBadge } from '../ui';
import { ConnectionBanner } from './ConnectionBanner';
import { ThemeToggle } from './ThemeToggle';

export function AppLayout() {
  const status = useConnectionStatus();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <Link
            to="/"
            className="mr-auto rounded text-lg font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-accent"
          >
            Live<span className="text-accent">Watch</span>
          </Link>
          <StatusBadge status={status} />
          <ThemeToggle />
        </div>
        <ConnectionBanner status={status} />
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>

      {PERF_ENABLED && <PerfCounter />}
    </div>
  );
}

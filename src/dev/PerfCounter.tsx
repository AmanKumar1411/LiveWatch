import { useEffect, useState } from 'react';
import { BATCH_UPDATES, MEMO_ROWS, takePerfSample, type PerfSample } from './perf';

/** Dev-only overlay: socket messages per second vs how often React actually renders the list. */
export function PerfCounter() {
  const [sample, setSample] = useState<PerfSample | null>(null);

  useEffect(() => {
    const id = setInterval(() => setSample(takePerfSample()), 1_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed bottom-3 left-3 z-50 rounded-lg border border-border bg-surface/95 px-3 py-2 font-mono text-[11px] leading-5 text-fg shadow-lg"
    >
      <div>
        msgs/s <b>{sample?.messages ?? '–'}</b> · list renders/s <b>{sample?.tableRenders ?? '–'}</b> · row
        renders/s <b>{sample?.rowRenders ?? '–'}</b>
      </div>
      <div className="text-fg-muted">
        batching {BATCH_UPDATES ? 'on' : 'off'} · memo {MEMO_ROWS ? 'on' : 'off'} · dev only
      </div>
    </div>
  );
}

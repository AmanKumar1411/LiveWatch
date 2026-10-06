import { useEffect } from 'react';

/**
 * Dev-only performance instrumentation.
 *
 * On in `npm run dev`, or in a production build made with VITE_PERF=true (`npm run perf`).
 * In a normal production build PERF_ENABLED is the constant `false`, so the bundler
 * strips the counters out.
 *
 * Two URL switches let us measure the optimisations against their absence:
 *   ?batch=0  push every socket message straight into React state (no 200ms buffer)
 *   ?memo=0   render watchlist rows without React.memo
 */
export const PERF_ENABLED: boolean = import.meta.env.DEV || import.meta.env.VITE_PERF === 'true';

const params = PERF_ENABLED ? new URLSearchParams(window.location.search) : null;

export const BATCH_UPDATES: boolean = params?.get('batch') !== '0';
export const MEMO_ROWS: boolean = params?.get('memo') !== '0';

export type PerfCounterName = 'messages' | 'tableRenders' | 'rowRenders';

export interface PerfSample {
  /** Sample time (ms epoch). Each sample covers the preceding ~1s. */
  t: number;
  messages: number;
  tableRenders: number;
  rowRenders: number;
}

declare global {
  interface Window {
    /** Per-second samples, read by scripts/measure-perf.mjs. */
    __livewatchPerf?: PerfSample[];
  }
}

const counters: Record<PerfCounterName, number> = { messages: 0, tableRenders: 0, rowRenders: 0 };

export function countPerf(name: PerfCounterName): void {
  if (PERF_ENABLED) counters[name] += 1;
}

/** Read the counters, reset them, and record the sample for the measurement script. */
export function takePerfSample(): PerfSample {
  const sample: PerfSample = { t: Date.now(), ...counters };
  counters.messages = counters.tableRenders = counters.rowRenders = 0;
  (window.__livewatchPerf ??= []).push(sample);
  return sample;
}

/**
 * Counts committed renders of the calling component. It counts in an effect, not in the
 * render body, so StrictMode's double render doesn't double-count and bailed-out (memoised)
 * renders are skipped. Chosen once at module load, so it is never a conditional hook call.
 */
function useRenderCountImpl(name: PerfCounterName): void {
  useEffect(() => {
    counters[name] += 1;
  });
}

function noop(): void {}

export const useRenderCount: (name: PerfCounterName) => void = PERF_ENABLED ? useRenderCountImpl : noop;

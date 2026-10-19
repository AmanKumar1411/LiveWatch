import { useCallback, useEffect, useState } from 'react';
import { KLINE_LIMIT, buildKlinesUrl } from '../config';
import type { PricePoint } from '../types';

export type KlinesState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; points: PricePoint[] };

const MINUTE_MS = 60_000;

/** REST rows are arrays: [openTime, open, high, low, close, …]. Validate instead of trusting them. */
export function parseKlines(json: unknown): PricePoint[] {
  if (!Array.isArray(json)) throw new Error('Unexpected response from the price history API');
  const rows: unknown[] = json;
  return rows.map((row) => {
    const cells: unknown[] = Array.isArray(row) ? row : [];
    const time = Number(cells[0]);
    const close = Number(cells[4]);
    if (!Number.isFinite(time) || !Number.isFinite(close)) throw new Error('Malformed price history row');
    return { time, close };
  });
}

async function fetchKlines(symbol: string, signal: AbortSignal): Promise<PricePoint[]> {
  const response = await fetch(buildKlinesUrl(symbol), { signal });
  if (!response.ok) throw new Error(`Price history request failed (HTTP ${response.status})`);
  return parseKlines(await response.json());
}

/**
 * Fold one live price into the 1-minute series:
 * - same minute as the last point → replace the last point's close;
 * - a later minute → append a point and drop the oldest, keeping a sliding 60-minute window.
 * Returns the same array when nothing changes, so the chart can skip rendering.
 */
export function mergeLivePrice(points: PricePoint[], price: number, time: number): PricePoint[] {
  const minute = Math.floor(time / MINUTE_MS) * MINUTE_MS;
  const last = points.at(-1);
  if (!last || minute < last.time) return points; // older than what we have: ignore
  if (minute === last.time) {
    if (last.close === price) return points;
    return [...points.slice(0, -1), { time: minute, close: price }];
  }
  return [...points, { time: minute, close: price }].slice(-KLINE_LIMIT);
}

/**
 * 60 one-minute closes from REST, kept current with live prices from the socket.
 * Handles loading, error and retry, and aborts the request on unmount or symbol change.
 */
export function useKlines(symbol: string, livePrice: number | undefined, liveTime: number | undefined) {
  const [state, setState] = useState<KlinesState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });

    fetchKlines(symbol, controller.signal).then(
      (points) => {
        if (!controller.signal.aborted) setState({ status: 'success', points });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return; // we cancelled it (unmount/navigation), not a failure
        setState({ status: 'error', message: error instanceof Error ? error.message : 'Unknown error' });
      },
    );

    // Cleanup: cancel the request so a slow response can't overwrite a newer one, or set
    // state after unmount.
    return () => controller.abort();
  }, [symbol, attempt]);

  const isLoaded = state.status === 'success';

  // Live updates. Also runs as soon as history loads, so the last point is current right away.
  useEffect(() => {
    if (!isLoaded || livePrice === undefined || liveTime === undefined) return;
    setState((prev) => {
      if (prev.status !== 'success') return prev;
      const points = mergeLivePrice(prev.points, livePrice, liveTime);
      return points === prev.points ? prev : { status: 'success', points };
    });
  }, [isLoaded, livePrice, liveTime]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { state, retry };
}

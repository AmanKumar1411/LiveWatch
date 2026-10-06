import { useEffect, useRef, useState } from 'react';
import { FLUSH_INTERVAL_MS, STALE_AFTER_MS, STALE_CHECK_INTERVAL_MS } from '../config';
import { BATCH_UPDATES, countPerf } from '../dev/perf';
import { marketSocket, type MarketSocket } from '../services/marketSocket';
import type { MarketEvent, Ticker, TickerMap, TickerStats } from '../types';

/** Everything received for one coin since the last flush. Only the latest value of each field matters. */
interface PendingUpdate {
  price?: number;
  priceTime?: number;
  stats?: TickerStats;
}

type UpdateBuffer = Map<string, PendingUpdate>;

export interface TickersState {
  tickers: TickerMap;
  /** Coins that have had no message for STALE_AFTER_MS. */
  staleSymbols: ReadonlySet<string>;
}

const EMPTY_SET: ReadonlySet<string> = new Set();

/**
 * Live tickers for every coin, built for rapid updates:
 * 1. Socket messages (dozens per second) go into a ref, which never triggers a render.
 * 2. At most every FLUSH_INTERVAL_MS, the buffer is applied to state in one setState.
 * 3. Coins whose visible data didn't change keep the *same object*, so memoised rows skip rendering.
 */
export function useTickers(socket: MarketSocket = marketSocket): TickersState {
  const [tickers, setTickers] = useState<TickerMap>({});
  const [staleSymbols, setStaleSymbols] = useState<ReadonlySet<string>>(EMPTY_SET);

  const bufferRef = useRef<UpdateBuffer>(new Map());
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSeenRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const lastSeen = lastSeenRef.current;

    const flush = () => {
      flushTimerRef.current = null;
      const updates = bufferRef.current;
      if (updates.size === 0) return;
      bufferRef.current = new Map(); // swap, so messages arriving now go into a fresh buffer
      setTickers((prev) => applyUpdates(prev, updates));
    };

    const unsubscribe = socket.subscribe((event) => {
      countPerf('messages');
      lastSeen.set(event.symbol, Date.now());
      addToBuffer(bufferRef.current, event);

      if (!BATCH_UPDATES) {
        flush(); // dev-only comparison mode: one setState per message
        return;
      }
      // Schedule a flush only if none is pending: at most one flush per interval, and no
      // timer at all while the socket is quiet.
      flushTimerRef.current ??= setTimeout(flush, FLUSH_INTERVAL_MS);
    });

    // Staleness is driven by a clock, not by messages: when nothing arrives, nothing
    // else would ever re-render to grey the row out.
    const staleTimer = setInterval(() => {
      const now = Date.now();
      const stale: string[] = [];
      for (const [symbol, seenAt] of lastSeen) {
        if (now - seenAt > STALE_AFTER_MS) stale.push(symbol);
      }
      // Return the previous Set when nothing changed, so React skips the update.
      setStaleSymbols((prev) => (sameMembers(prev, stale) ? prev : new Set(stale)));
    }, STALE_CHECK_INTERVAL_MS);

    // Cleanup on unmount: stop listening (the service closes the socket when the last
    // subscriber leaves), cancel timers, and drop half-collected data.
    return () => {
      unsubscribe();
      if (flushTimerRef.current !== null) clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
      clearInterval(staleTimer);
      bufferRef.current = new Map();
      lastSeen.clear();
    };
  }, [socket]);

  return { tickers, staleSymbols };
}

function addToBuffer(buffer: UpdateBuffer, event: MarketEvent): void {
  const pending = buffer.get(event.symbol) ?? {};
  if (event.type === 'trade') {
    pending.price = event.price;
    pending.priceTime = event.time;
  } else {
    pending.stats = event.stats;
  }
  buffer.set(event.symbol, pending);
}

/**
 * Pure state transition: previous tickers + buffered updates → next tickers.
 * Returns `prev` itself when nothing visible changed, so React bails out of the render.
 */
export function applyUpdates(prev: TickerMap, updates: ReadonlyMap<string, PendingUpdate>): TickerMap {
  let next: Record<string, Ticker> | null = null;
  for (const [symbol, update] of updates) {
    const old = prev[symbol];
    const merged = mergeTicker(symbol, old, update);
    if (merged === undefined || merged === old) continue;
    next ??= { ...prev };
    next[symbol] = merged;
  }
  return next ?? prev;
}

function mergeTicker(symbol: string, old: Ticker | undefined, update: PendingUpdate): Ticker | undefined {
  const { stats } = update;

  if (!old) {
    // Wait for the first 24h ticker (≤1s): it carries every field, so a Ticker is never half-filled.
    if (!stats) return undefined;
    return {
      symbol,
      price: update.price ?? stats.lastPrice,
      priceTime: update.priceTime ?? stats.time,
      direction: null,
      changePct: stats.changePct,
      high: stats.high,
      low: stats.low,
      quoteVolume: stats.quoteVolume,
    };
  }

  const price = update.price ?? old.price;
  const changePct = stats?.changePct ?? old.changePct;
  const high = stats?.high ?? old.high;
  const low = stats?.low ?? old.low;
  const quoteVolume = stats?.quoteVolume ?? old.quoteVolume;

  // Nothing on screen would change → keep the old object (stable props for React.memo).
  if (
    price === old.price &&
    changePct === old.changePct &&
    high === old.high &&
    low === old.low &&
    quoteVolume === old.quoteVolume
  ) {
    return old;
  }

  return {
    symbol,
    price,
    priceTime: update.priceTime ?? old.priceTime,
    // Compared with the previous *flushed* price, which is what the user last saw.
    direction: price > old.price ? 'up' : price < old.price ? 'down' : old.direction,
    changePct,
    high,
    low,
    quoteVolume,
  };
}

function sameMembers(set: ReadonlySet<string>, items: readonly string[]): boolean {
  return set.size === items.length && items.every((item) => set.has(item));
}

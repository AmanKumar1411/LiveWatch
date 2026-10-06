import {
  RECONNECT_BASE_DELAY_MS,
  RECONNECT_JITTER_MS,
  RECONNECT_MAX_DELAY_MS,
  buildStreamUrl,
} from '../config';
import type { ConnectionStatus, MarketEvent } from '../types';

type MessageListener = (event: MarketEvent) => void;
type StatusListener = (status: ConnectionStatus) => void;

/**
 * Delay before reconnect attempt `attempt` (0-based): 1s, 2s, 4s, 8s … capped at 30s,
 * plus a little random jitter so clients that dropped together don't retry in lockstep.
 */
export function getBackoffDelay(attempt: number, random: () => number = Math.random): number {
  const exponential = Math.min(RECONNECT_MAX_DELAY_MS, RECONNECT_BASE_DELAY_MS * 2 ** attempt);
  return exponential + Math.round(random() * RECONNECT_JITTER_MS);
}

/**
 * Owns the app's single WebSocket. Components never touch the socket directly:
 * they subscribe, and the service opens the socket for the first subscriber and
 * closes it (and every timer) when the last one leaves.
 */
export class MarketSocket {
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = 'connecting';
  private attempt = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly listeners = new Set<MessageListener>();
  private readonly statusListeners = new Set<StatusListener>();

  constructor(private readonly url: string) {}

  /** Start receiving market events. Returns the unsubscribe function. */
  subscribe = (listener: MessageListener): (() => void) => {
    this.listeners.add(listener);
    if (this.listeners.size === 1) this.start();
    return () => this.unsubscribe(listener);
  };

  unsubscribe = (listener: MessageListener): void => {
    if (!this.listeners.delete(listener)) return;
    if (this.listeners.size === 0) this.stop();
  };

  /** Shaped for `useSyncExternalStore`: subscribe(callback) → unsubscribe, plus getStatus(). */
  onStatusChange = (listener: StatusListener): (() => void) => {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  };

  getStatus = (): ConnectionStatus => this.status;

  // ---- lifecycle ----

  private start(): void {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    this.attempt = 0;
    this.setStatus('connecting');
    this.connect();
  }

  private stop(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.clearRetry();
    this.closeSocket();
  }

  private connect(): void {
    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.onopen = () => {
      this.attempt = 0; // success → the next outage starts again from 1s
      this.setStatus('live');
    };

    ws.onmessage = (message: MessageEvent<unknown>) => {
      if (typeof message.data !== 'string') return;
      const event = parseMarketMessage(message.data);
      if (!event) return;
      for (const listener of this.listeners) listener(event);
    };

    // `error` is always followed by `close`, so all recovery happens in onclose.
    ws.onclose = () => {
      if (this.ws !== ws) return; // a socket we closed on purpose
      this.ws = null;
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect(): void {
    if (this.listeners.size === 0) return;
    // No network: retrying is pointless. Wait for the browser's `online` event instead.
    if (!navigator.onLine) {
      this.setStatus('offline');
      return;
    }
    this.setStatus('reconnecting');
    const delay = getBackoffDelay(this.attempt);
    this.attempt += 1;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.connect();
    }, delay);
  }

  private closeSocket(): void {
    const ws = this.ws;
    if (!ws) return;
    this.ws = null; // set first, so onclose knows this close was intentional
    ws.onopen = ws.onmessage = ws.onclose = null;
    ws.close();
  }

  private clearRetry(): void {
    if (this.retryTimer !== null) clearTimeout(this.retryTimer);
    this.retryTimer = null;
  }

  private handleOffline = (): void => {
    // A dead connection can take a long time to report `close`, so drop it right away.
    this.clearRetry();
    this.closeSocket();
    this.setStatus('offline');
  };

  private handleOnline = (): void => {
    if (this.ws || this.listeners.size === 0) return;
    this.clearRetry();
    this.attempt = 0;
    this.setStatus('reconnecting');
    this.connect();
  };

  private setStatus(next: ConnectionStatus): void {
    if (next === this.status) return;
    this.status = next;
    for (const listener of this.statusListeners) listener(next);
  }
}

// ---- message parsing ----

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toNumber(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Validate and convert a combined-stream frame (`{stream, data}`). Socket data is untrusted,
 * so we check every field we use instead of casting. Returns null for anything unexpected.
 */
export function parseMarketMessage(raw: string): MarketEvent | null {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(json) || !isRecord(json.data)) return null;
  const d = json.data;
  if (typeof d.s !== 'string') return null;

  if (d.e === 'aggTrade') {
    const price = toNumber(d.p);
    const time = toNumber(d.T);
    if (price === null || time === null) return null;
    return { type: 'trade', symbol: d.s, price, time };
  }

  if (d.e === '24hrTicker') {
    const lastPrice = toNumber(d.c);
    const changePct = toNumber(d.P);
    const high = toNumber(d.h);
    const low = toNumber(d.l);
    const quoteVolume = toNumber(d.q);
    const time = toNumber(d.E);
    if (
      lastPrice === null ||
      changePct === null ||
      high === null ||
      low === null ||
      quoteVolume === null ||
      time === null
    ) {
      return null;
    }
    return { type: 'ticker', symbol: d.s, stats: { lastPrice, changePct, high, low, quoteVolume, time } };
  }

  return null;
}

/** The one shared connection for the whole app. */
export const marketSocket = new MarketSocket(buildStreamUrl());

import type { Coin } from './types';

/** Every external URL, tunable and storage key lives here, so nothing is hard-coded deeper in the app. */

// ---- Endpoints (Binance public market data: free, no API key) ----
export const WS_BASE_URL = 'wss://data-stream.binance.vision/stream';
export const REST_BASE_URL = 'https://data-api.binance.vision/api/v3';

// ---- Coins ----
// `decimals` matches each pair's tick size on Binance, so prices render exactly as the exchange quotes them.
export const COINS: readonly Coin[] = [
  { symbol: 'BTCUSDT', base: 'BTC', name: 'Bitcoin', decimals: 2 },
  { symbol: 'ETHUSDT', base: 'ETH', name: 'Ethereum', decimals: 2 },
  { symbol: 'SOLUSDT', base: 'SOL', name: 'Solana', decimals: 2 },
  { symbol: 'BNBUSDT', base: 'BNB', name: 'BNB', decimals: 2 },
  { symbol: 'XRPUSDT', base: 'XRP', name: 'XRP', decimals: 4 },
  { symbol: 'DOGEUSDT', base: 'DOGE', name: 'Dogecoin', decimals: 5 },
  { symbol: 'ADAUSDT', base: 'ADA', name: 'Cardano', decimals: 4 },
  { symbol: 'AVAXUSDT', base: 'AVAX', name: 'Avalanche', decimals: 2 },
];

export const COINS_BY_SYMBOL: ReadonlyMap<string, Coin> = new Map(COINS.map((coin) => [coin.symbol, coin]));

/**
 * One combined stream for every coin:
 * - `@ticker`   → 24h stats (change %, high, low, volume), about once per second per coin.
 * - `@aggTrade` → the live trade price, many times per second for busy coins.
 */
export function buildStreamUrl(coins: readonly Coin[] = COINS): string {
  const streams = coins.flatMap((coin) => {
    const s = coin.symbol.toLowerCase();
    return [`${s}@ticker`, `${s}@aggTrade`];
  });
  return `${WS_BASE_URL}?streams=${streams.join('/')}`;
}

// ---- Price history (detail page chart) ----
export const KLINE_INTERVAL = '1m';
export const KLINE_LIMIT = 60;

export function buildKlinesUrl(symbol: string): string {
  return `${REST_BASE_URL}/klines?symbol=${symbol}&interval=${KLINE_INTERVAL}&limit=${KLINE_LIMIT}`;
}

// ---- Rendering and freshness ----
/** Socket messages are buffered and pushed into React state at most this often. */
export const FLUSH_INTERVAL_MS = 200;
/** A coin with no new data for this long is greyed out. */
export const STALE_AFTER_MS = 10_000;
/** How often to re-check staleness. */
export const STALE_CHECK_INTERVAL_MS = 1_000;

// ---- Reconnect (exponential backoff) ----
export const RECONNECT_BASE_DELAY_MS = 1_000;
export const RECONNECT_MAX_DELAY_MS = 30_000;
/** Random extra delay, so many clients that dropped together don't all retry at the same instant. */
export const RECONNECT_JITTER_MS = 300;

// ---- localStorage keys ----
export const STARRED_STORAGE_KEY = 'livewatch:starred';
// Also read by the inline script in index.html, so keep the two in sync.
export const THEME_STORAGE_KEY = 'livewatch:theme';

/** A coin we track. Static data from config.ts. */
export interface Coin {
  /** Binance pair symbol, e.g. "BTCUSDT". Also used in the URL. */
  symbol: string;
  /** Base asset, e.g. "BTC". */
  base: string;
  /** Display name, e.g. "Bitcoin". */
  name: string;
  /** Decimal places to show for the price. */
  decimals: number;
}

/** Live market state for one coin, as stored in React state. */
export interface Ticker {
  symbol: string;
  /** Latest trade price. */
  price: number;
  /** Exchange timestamp (ms) of that price, used to bucket chart points by minute. */
  priceTime: number;
  /** Move versus the previous flushed price, used for the green/red flash. */
  direction: PriceDirection;
  /** 24h change in percent. */
  changePct: number;
  high: number;
  low: number;
  /** 24h volume in the quote asset (USDT). */
  quoteVolume: number;
}

export type PriceDirection = 'up' | 'down' | null;

export type TickerMap = Readonly<Record<string, Ticker>>;

export type ConnectionStatus = 'connecting' | 'live' | 'reconnecting' | 'offline';

/** 24h statistics from the `@ticker` stream. */
export interface TickerStats {
  lastPrice: number;
  changePct: number;
  high: number;
  low: number;
  quoteVolume: number;
  /** Exchange event time (ms). */
  time: number;
}

/**
 * A socket message after parsing and validation. The service converts Binance's
 * string-encoded numbers once, so the rest of the app only sees numbers.
 */
export type MarketEvent =
  | { type: 'trade'; symbol: string; price: number; time: number }
  | { type: 'ticker'; symbol: string; stats: TickerStats };

/** One point on the price chart. */
export interface PricePoint {
  /** Minute open time (ms). */
  time: number;
  close: number;
}

import { test as base, expect, type Page, type WebSocketRoute } from '@playwright/test';

/** Fixed prices, so assertions can check exact formatted strings. */
export const PRICES: Readonly<Record<string, number>> = {
  BTCUSDT: 72933.26,
  ETHUSDT: 2021.11,
  SOLUSDT: 82.07,
  BNBUSDT: 671.62,
  XRPUSDT: 1.0461,
  DOGEUSDT: 0.06715,
  ADAUSDT: 0.1721,
  AVAXUSDT: 8.19,
};

const MINUTE = 60_000;

/** 60 one-minute klines ending in the current minute, in Binance's array format. */
export function makeKlines(symbol: string): (number | string)[][] {
  const price = PRICES[symbol] ?? 100;
  const currentMinute = Math.floor(Date.now() / MINUTE) * MINUTE;
  return Array.from({ length: 60 }, (_, i) => {
    const openTime = currentMinute - (59 - i) * MINUTE;
    const close = (price * (1 + Math.sin(i / 6) / 200)).toFixed(8);
    return [openTime, close, close, close, close, '10', openTime + MINUTE - 1, '1000', 10, '5', '500', '0'];
  });
}

/**
 * A fake Binance stream server. `page.routeWebSocket` hands us each connection the page
 * opens; we never call connectToServer(), so nothing reaches the real exchange.
 */
export class MarketMock {
  connections = 0;
  private socket: WebSocketRoute | null = null;

  attach(ws: WebSocketRoute): void {
    this.connections += 1;
    this.socket = ws;
  }

  /** Wait until the page has opened at least `count` sockets in total (reconnects included). */
  async waitForConnection(count = 1): Promise<void> {
    await expect.poll(() => this.connections, { message: `expected ${count} socket connection(s)` }).toBeGreaterThanOrEqual(count);
  }

  private send(stream: string, data: Record<string, unknown>): void {
    if (!this.socket) throw new Error('No socket connected yet');
    this.socket.send(JSON.stringify({ stream, data }));
  }

  /** One 24h ticker frame per coin: the first data the app shows. */
  async sendSnapshot(): Promise<void> {
    await this.waitForConnection();
    for (const [symbol, price] of Object.entries(PRICES)) {
      this.send(`${symbol.toLowerCase()}@ticker`, {
        e: '24hrTicker',
        E: Date.now(),
        s: symbol,
        c: String(price),
        P: '1.50',
        h: String(price * 1.05),
        l: String(price * 0.95),
        q: '123456789.12',
      });
    }
  }

  sendTrade(symbol: string, price: number): void {
    this.send(`${symbol.toLowerCase()}@aggTrade`, { e: 'aggTrade', E: Date.now(), s: symbol, p: String(price), T: Date.now() });
  }

  /** Simulate the server dropping the connection. */
  async closeSocket(): Promise<void> {
    if (!this.socket) throw new Error('No socket connected yet');
    await this.socket.close({ code: 4000, reason: 'test: server went away' });
  }
}

export const test = base.extend<{ market: MarketMock }>({
  // `auto`: every test gets the mocks, even ones that never touch `market` directly.
  market: [
    async ({ page }, use) => {
      const market = new MarketMock();
      // Safety net (registered first = lowest priority): any Binance request that isn't
      // mocked below fails instead of hitting the real API.
      await page.route(/binance\.vision/, (route) => route.abort());
      await page.route(/\/api\/v3\/klines/, async (route) => {
        const symbol = new URL(route.request().url()).searchParams.get('symbol') ?? '';
        await route.fulfill({ json: makeKlines(symbol) });
      });
      await page.routeWebSocket(/data-stream\.binance\.vision/, (ws) => market.attach(ws));
      await use(market);
    },
    { auto: true },
  ],
});

export { expect };

/** Coin rows only (skips the header row). */
export function coinRows(page: Page) {
  return page.locator('tbody').getByRole('row');
}

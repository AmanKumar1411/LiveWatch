import { createContext, useContext } from 'react';
import type { TickersState } from '../hooks/useTickers';

export const MarketDataContext = createContext<TickersState | null>(null);

/** Live tickers + stale set, shared by every page through one socket subscription. */
export function useMarketData(): TickersState {
  const value = useContext(MarketDataContext);
  if (!value) throw new Error('useMarketData must be used inside <MarketDataProvider>');
  return value;
}

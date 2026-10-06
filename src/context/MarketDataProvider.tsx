import { useMemo, type ReactNode } from 'react';
import { useTickers } from '../hooks/useTickers';
import { MarketDataContext } from './marketDataContext';

/**
 * Subscribes once, at the app root. Both pages read from here, so moving between the
 * watchlist and a coin page never reopens the socket or shows the skeleton again.
 */
export function MarketDataProvider({ children }: { children: ReactNode }) {
  const { tickers, staleSymbols } = useTickers();
  const value = useMemo(() => ({ tickers, staleSymbols }), [tickers, staleSymbols]);
  return <MarketDataContext.Provider value={value}>{children}</MarketDataContext.Provider>;
}

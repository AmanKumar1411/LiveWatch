import { useRenderCount } from '../../dev/perf';
import type { Coin, TickerMap } from '../../types';
import { WatchlistRow } from './WatchlistRow';

interface WatchlistTableProps {
  coins: readonly Coin[];
  tickers: TickerMap;
  staleSymbols: ReadonlySet<string>;
  starred: ReadonlySet<string>;
  onToggleStar: (symbol: string) => void;
  onSelect: (symbol: string) => void;
}

/**
 * Re-renders on every flush (tickers changed), but only hands each row props that stay the
 * same while that coin is unchanged, so the memoised rows do the skipping.
 */
export function WatchlistTable({ coins, tickers, staleSymbols, starred, onToggleStar, onSelect }: WatchlistTableProps) {
  useRenderCount('tableRenders');
  const isLoading = coins.some((coin) => tickers[coin.symbol] === undefined);

  return (
    <table className="watchlist w-full" aria-busy={isLoading}>
      <caption className="sr-only">Live prices</caption>
      <thead>
        <tr className="text-xs font-medium uppercase tracking-wide text-fg-muted">
          <th scope="col" className="cell-name">
            Name
          </th>
          <th scope="col" className="cell-price">
            Price
          </th>
          <th scope="col" className="cell-change">
            24h
          </th>
          <th scope="col" className="cell-volume">
            24h Volume
          </th>
          <th scope="col" className="cell-star">
            <span className="sr-only">Star</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {coins.map((coin) => (
          <WatchlistRow
            key={coin.symbol}
            coin={coin}
            ticker={tickers[coin.symbol]}
            isStale={staleSymbols.has(coin.symbol)}
            isStarred={starred.has(coin.symbol)}
            onToggleStar={onToggleStar}
            onSelect={onSelect}
          />
        ))}
      </tbody>
    </table>
  );
}

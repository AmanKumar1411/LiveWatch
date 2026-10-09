import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, EmptyState } from '../components/ui';
import { SearchBar } from '../components/watchlist/SearchBar';
import { Tabs, type TabOption } from '../components/watchlist/Tabs';
import { WatchlistTable } from '../components/watchlist/WatchlistTable';
import { COINS } from '../config';
import { useMarketData } from '../context/marketDataContext';
import { useStarred } from '../hooks/useStarred';
import type { Coin } from '../types';

type ListTab = 'all' | 'starred';
const PANEL_ID = 'watchlist-panel';

function matchesQuery(coin: Coin, query: string): boolean {
  return (
    coin.base.toLowerCase().includes(query) ||
    coin.name.toLowerCase().includes(query) ||
    coin.symbol.toLowerCase().includes(query)
  );
}

export function WatchlistPage() {
  const { tickers, staleSymbols } = useMarketData();
  const { starred, toggleStar } = useStarred();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<ListTab>('all');
  const navigate = useNavigate();

  // Stable identity across price flushes, so it doesn't break React.memo on the rows.
  const openCoin = useCallback((symbol: string) => navigate(`/coin/${symbol}`), [navigate]);

  // Filter the static coin list, not the live tickers: this recomputes only when the
  // query, tab or stars change, never on a price update.
  const visibleCoins = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COINS.filter(
      (coin) => (tab === 'all' || starred.has(coin.symbol)) && (q === '' || matchesQuery(coin, q)),
    );
  }, [query, tab, starred]);

  const tabOptions: TabOption<ListTab>[] = [
    { value: 'all', label: 'All', count: COINS.length },
    { value: 'starred', label: 'Starred', count: starred.size },
  ];

  let content;
  if (tab === 'starred' && starred.size === 0) {
    content = (
      <EmptyState
        icon={<StarOutline />}
        title="Star a coin to see it here"
        description="Tap the star next to any coin to pin it to this list."
        action={
          <Button size="sm" onClick={() => setTab('all')}>
            Browse all coins
          </Button>
        }
      />
    );
  } else if (visibleCoins.length === 0) {
    content = (
      <EmptyState
        title="No coins match your search"
        description={`Nothing matches “${query.trim()}”. Try a name like “Solana” or a symbol like “SOL”.`}
        action={
          <Button size="sm" onClick={() => setQuery('')}>
            Clear search
          </Button>
        }
      />
    );
  } else {
    content = (
      <WatchlistTable
        coins={visibleCoins}
        tickers={tickers}
        staleSymbols={staleSymbols}
        starred={starred}
        onToggleStar={toggleStar}
        onSelect={openCoin}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Watchlist</h1>
        <p className="text-sm text-fg-muted">Live prices for USDT pairs, streamed from Binance.</p>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs label="Watchlist filter" options={tabOptions} value={tab} onChange={setTab} controls={PANEL_ID} />
        <SearchBar value={query} onChange={setQuery} />
      </div>

      <Card id={PANEL_ID} role="tabpanel" className="overflow-hidden">
        {content}
      </Card>
    </div>
  );
}

function StarOutline() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true">
      <path
        d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

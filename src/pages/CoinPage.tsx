import { useEffect, type ReactNode } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { PriceChart } from '../components/coin/PriceChart';
import { Badge, Button, Card, EmptyState, Skeleton } from '../components/ui';
import { COINS_BY_SYMBOL, KLINE_LIMIT } from '../config';
import { useMarketData } from '../context/marketDataContext';
import { useKlines } from '../hooks/useKlines';
import { cx } from '../lib/cx';
import { formatCompactUsd, formatPercent, formatPrice } from '../lib/format';
import type { Coin } from '../types';

/** Route: /coin/:symbol. Default export, because the route lazy-loads this file. */
export default function CoinPage() {
  const { symbol = '' } = useParams();
  const coin = COINS_BY_SYMBOL.get(symbol.toUpperCase());

  if (!coin) {
    return (
      <Card>
        <EmptyState
          title="Coin not found"
          description={`“${symbol}” isn’t on the watchlist.`}
          action={<BackButton />}
        />
      </Card>
    );
  }
  // Canonical URL: /coin/btcusdt → /coin/BTCUSDT.
  if (coin.symbol !== symbol) return <Navigate to={`/coin/${coin.symbol}`} replace />;

  // Keyed by symbol so all per-coin state resets when the coin changes.
  return <CoinDetail key={coin.symbol} coin={coin} />;
}

function CoinDetail({ coin }: { coin: Coin }) {
  const { tickers, staleSymbols } = useMarketData();
  const ticker = tickers[coin.symbol];
  const isStale = staleSymbols.has(coin.symbol);
  const { state: history, retry } = useKlines(coin.symbol, ticker?.price, ticker?.priceTime);

  useEffect(() => {
    document.title = `${coin.name} (${coin.base}) · LiveWatch`;
    return () => {
      document.title = 'LiveWatch';
    };
  }, [coin]);

  return (
    <div className="space-y-4">
      <BackButton />

      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">
            {coin.name} <span className="text-base font-medium text-fg-muted">{coin.base}/USDT</span>
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            {ticker ? (
              <span
                key={ticker.price}
                data-testid="live-price"
                className={cx(
                  '-mx-1 rounded px-1 text-3xl font-bold tabular-nums',
                  ticker.direction === 'up' && 'flash-up',
                  ticker.direction === 'down' && 'flash-down',
                )}
              >
                {formatPrice(ticker.price, coin.decimals)}
              </span>
            ) : (
              <Skeleton className="h-9 w-48" />
            )}
            {ticker ? (
              <Badge tone={ticker.changePct >= 0 ? 'positive' : 'negative'} className="text-sm">
                {formatPercent(ticker.changePct)} 24h
              </Badge>
            ) : (
              <Skeleton className="h-6 w-20" />
            )}
            {isStale && <Badge tone="warning">No updates for 10s+</Badge>}
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="24h High">{ticker && formatPrice(ticker.high, coin.decimals)}</Stat>
        <Stat label="24h Low">{ticker && formatPrice(ticker.low, coin.decimals)}</Stat>
        <Stat label="24h Volume" className="col-span-2 sm:col-span-1">
          {ticker && formatCompactUsd(ticker.quoteVolume)}
        </Stat>
      </dl>

      <Card className="p-4">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="font-semibold">Last {KLINE_LIMIT} minutes</h2>
          <span className="text-xs text-fg-muted">1-minute closes · live</span>
        </div>

        {history.status === 'loading' && (
          <div role="status" aria-label="Loading price history">
            <Skeleton className="h-64 w-full sm:h-80" />
          </div>
        )}

        {history.status === 'error' && (
          <EmptyState
            title="Couldn’t load price history"
            description={`${history.message}. Live prices above are unaffected.`}
            action={
              <Button variant="primary" onClick={retry}>
                Retry
              </Button>
            }
          />
        )}

        {history.status === 'success' && (
          <PriceChart points={history.points} decimals={coin.decimals} coinName={coin.name} />
        )}
      </Card>
    </div>
  );
}

function Stat({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <Card className={cx('px-4 py-3', className)}>
      <dt className="text-xs font-medium tracking-wide text-fg-muted uppercase">{label}</dt>
      <dd className="mt-1 font-semibold tabular-nums">{children ?? <Skeleton className="h-5 w-24" />}</dd>
    </Card>
  );
}

/** Goes back in history when we came from inside the app (keeps the browser's back stack honest),
 *  otherwise, e.g. when the page was opened from a shared link, to the watchlist. */
function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const goBack = () => {
    if (location.key === 'default') navigate('/');
    else navigate(-1);
  };
  return (
    <Button variant="ghost" size="sm" onClick={goBack} className="-ml-2">
      <span aria-hidden="true">←</span> Back to watchlist
    </Button>
  );
}

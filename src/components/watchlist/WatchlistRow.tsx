import { memo, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { MEMO_ROWS, useRenderCount } from '../../dev/perf';
import { cx } from '../../lib/cx';
import { formatCompactUsd, formatPercent, formatPrice } from '../../lib/format';
import type { Coin, Ticker } from '../../types';
import { Badge, Button, Skeleton } from '../ui';

export interface WatchlistRowProps {
  coin: Coin;
  /** Undefined until the first data for this coin arrives. */
  ticker: Ticker | undefined;
  isStale: boolean;
  isStarred: boolean;
  onToggleStar: (symbol: string) => void;
  onSelect: (symbol: string) => void;
}

/**
 * One coin. Every prop is either a primitive or a reference that stays the same while the
 * coin is unchanged (config object, the ticker object from useTickers, useCallback callbacks).
 * That lets React.memo skip this row whenever a *different* coin updates.
 */
function WatchlistRowImpl({ coin, ticker, isStale, isStarred, onToggleStar, onSelect }: WatchlistRowProps) {
  useRenderCount('rowRenders');

  // The whole row is a mouse target; the link and star button handle their own clicks.
  const handleRowClick = (event: MouseEvent<HTMLTableRowElement>) => {
    if (event.target instanceof Element && event.target.closest('a, button')) return;
    onSelect(coin.symbol);
  };

  return (
    <tr
      className="watchlist-row"
      data-stale={isStale || undefined}
      title={isStale ? 'No price update for over 10 seconds' : undefined}
      onClick={handleRowClick}
    >
      <td className="cell-name">
        <Link
          to={`/coin/${coin.symbol}`}
          className="inline-flex min-w-0 items-baseline gap-2 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span className="font-semibold text-fg">{coin.base}</span>
          <span className="truncate text-sm text-fg-muted">{coin.name}</span>
          {isStale && <span className="sr-only">(no recent updates)</span>}
        </Link>
      </td>

      <td className="cell-price">
        {ticker ? (
          // Keyed by price: a new price remounts the span, which replays the flash animation.
          <span
            key={ticker.price}
            className={cx(
              '-mx-1 rounded px-1 font-semibold tabular-nums',
              ticker.direction === 'up' && 'flash-up',
              ticker.direction === 'down' && 'flash-down',
            )}
          >
            {formatPrice(ticker.price, coin.decimals)}
          </span>
        ) : (
          <Skeleton className="h-5 w-24" />
        )}
      </td>

      <td className="cell-change">
        {ticker ? (
          <Badge tone={ticker.changePct >= 0 ? 'positive' : 'negative'}>{formatPercent(ticker.changePct)}</Badge>
        ) : (
          <Skeleton className="h-5 w-16" />
        )}
      </td>

      <td className="cell-volume">
        {ticker ? (
          <span className="text-sm text-fg-muted tabular-nums">
            <span className="md:hidden">Vol </span>
            {formatCompactUsd(ticker.quoteVolume)}
          </span>
        ) : (
          <Skeleton className="h-4 w-14" />
        )}
      </td>

      <td className="cell-star">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Star ${coin.name}`}
          aria-pressed={isStarred}
          onClick={() => onToggleStar(coin.symbol)}
          className={isStarred ? 'text-warn hover:text-warn' : undefined}
        >
          <StarIcon filled={isStarred} />
        </Button>
      </td>
    </tr>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Used only in the dev `?memo=0` measurement mode: "props changed" every time, so memo never skips. */
const alwaysRender = () => false;

// React.memo shallow-compares props (Object.is per prop) and skips the render when all are equal.
export const WatchlistRow = memo(WatchlistRowImpl, MEMO_ROWS ? undefined : alwaysRender);

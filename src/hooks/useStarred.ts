import { useCallback, useEffect, useState } from 'react';
import { COINS_BY_SYMBOL, STARRED_STORAGE_KEY } from '../config';

/**
 * Starred coins, persisted to localStorage. Storage can throw (private mode, quota,
 * disabled cookies) or hold junk from an older version, so reads and writes are guarded
 * and only known symbols are kept.
 */
function readStarred(): ReadonlySet<string> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STARRED_STORAGE_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((s): s is string => typeof s === 'string' && COINS_BY_SYMBOL.has(s)));
  } catch {
    return new Set();
  }
}

function writeStarred(starred: ReadonlySet<string>): void {
  try {
    localStorage.setItem(STARRED_STORAGE_KEY, JSON.stringify([...starred]));
  } catch {
    // Not fatal: stars just won't survive a reload.
  }
}

export function useStarred() {
  // Lazy initialiser: read storage once on mount, not on every render.
  const [starred, setStarred] = useState<ReadonlySet<string>>(readStarred);

  useEffect(() => {
    writeStarred(starred);
  }, [starred]);

  // Functional update + no deps → the same function for the component's lifetime,
  // so passing it to memoised rows doesn't break React.memo.
  const toggleStar = useCallback((symbol: string) => {
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });
  }, []);

  return { starred, toggleStar };
}

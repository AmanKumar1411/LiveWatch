import { useCallback, useEffect, useState } from 'react';
import { THEME_STORAGE_KEY } from '../config';

export type Theme = 'light' | 'dark';

/** The inline script in index.html sets data-theme before first paint; start from that. */
function readInitialTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);

  // The whole theme is a CSS-variable swap keyed off this attribute.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    // Saved only on an explicit choice; until then we follow the OS setting.
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage unavailable: the choice lasts for this visit only.
    }
  }, [theme]);

  return { theme, toggleTheme };
}

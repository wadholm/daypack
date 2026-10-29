import { useEffect, useState } from 'preact/hooks';
import { readStorage, writeStorage } from './safeStorage';

export type ThemePref = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'daypack.theme';
export const THEME_PREFS: readonly ThemePref[] = ['system', 'light', 'dark'];

const DARK_QUERY = '(prefers-color-scheme: dark)';

export function parseThemePref(value: string | null): ThemePref {
  return THEME_PREFS.find((pref) => pref === value) ?? 'system';
}

export function resolveTheme(pref: ThemePref, systemPrefersDark: boolean): ResolvedTheme {
  if (pref === 'system') return systemPrefersDark ? 'dark' : 'light';
  return pref;
}

export function nextThemePref(pref: ThemePref): ThemePref {
  const index = THEME_PREFS.indexOf(pref);
  return THEME_PREFS[(index + 1) % THEME_PREFS.length] ?? 'system';
}

// The inline script in index.html sets the first value before paint; this keeps it in sync afterwards.
function applyTheme(pref: ThemePref): void {
  const dark = window.matchMedia(DARK_QUERY).matches;
  document.documentElement.dataset.theme = resolveTheme(pref, dark);
}

export function useTheme(): { pref: ThemePref; setPref: (pref: ThemePref) => void } {
  const [pref, setPrefState] = useState<ThemePref>(() => parseThemePref(readStorage(THEME_STORAGE_KEY)));

  useEffect(() => {
    applyTheme(pref);
    if (pref !== 'system') return;

    const query = window.matchMedia(DARK_QUERY);
    const onChange = () => applyTheme(pref);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [pref]);

  const setPref = (next: ThemePref) => {
    writeStorage(THEME_STORAGE_KEY, next);
    setPrefState(next);
  };

  return { pref, setPref };
}

import { useEffect, useState } from 'preact/hooks';
import { fetchItems, type Item } from '../api/items';
import type { Lang } from '../i18n/lang';

export type ItemsState =
  | { status: 'loading' }
  | { status: 'error'; retry: () => void }
  | { status: 'ready'; items: Item[] };

// Keeps the previous list on screen while a new language loads, so switching never flashes empty.
export function useItems(lang: Lang): ItemsState {
  const [items, setItems] = useState<Item[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setFailed(false);
    fetchItems(lang, controller.signal)
      .then(setItems)
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [lang, attempt]);

  if (items) return { status: 'ready', items };
  if (failed) return { status: 'error', retry: () => setAttempt((n) => n + 1) };
  return { status: 'loading' };
}

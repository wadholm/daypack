import type { Lang } from '../i18n/lang';

export type Hue = 'yellow' | 'sky' | 'pink' | 'mint' | 'peach' | 'lavender' | 'sea';

export interface Item {
  id: string;
  hue: Hue;
  label: string;
}

export async function fetchItems(lang: Lang, signal: AbortSignal): Promise<Item[]> {
  const res = await fetch(`/api/items?lang=${lang}`, { signal });
  if (!res.ok) throw new Error(`Items request failed: ${res.status}`);
  const body = (await res.json()) as { items: Item[] };
  return body.items;
}

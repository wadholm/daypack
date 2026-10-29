import { useEffect, useState } from 'preact/hooks';
import { isIconId, type IconId } from '../icons/iconIds';
import { readStorage, writeStorage } from './safeStorage';

export const ITEMS_STORAGE_KEY = 'daypack.items';
const STORAGE_VERSION = 1;

export const HUES = ['yellow', 'sky', 'pink', 'mint', 'peach', 'lavender', 'sea'] as const;
export type Hue = (typeof HUES)[number];

export interface Item {
  id: string;
  // Built-ins take their label from the translation dictionary (`item_<id>`); only custom items store text.
  builtin: boolean;
  label: string | null;
  hue: Hue;
  icon: IconId;
  // category, daily, target and stock have no UI yet; carried so later slices need no data migration.
  category: string | null;
  note: string;
  daily: boolean;
  target: number;
  stock: number;
  hidden: boolean;
}

export interface ItemDraft {
  label: string;
  hue: Hue;
  icon: IconId;
  note: string;
}

const BUILTINS: readonly { id: string; hue: Hue; icon: IconId }[] = [
  { id: 'diapers', hue: 'yellow', icon: 'diapers' },
  { id: 'pacifier', hue: 'sky', icon: 'pacifier' },
  { id: 'cuddly-toy', hue: 'pink', icon: 'cuddly-toy' },
  { id: 'spare-clothes', hue: 'mint', icon: 'spare-clothes' },
  { id: 'rain-gear', hue: 'lavender', icon: 'rain-gear' },
  { id: 'water-bottle', hue: 'sea', icon: 'water-bottle' },
  { id: 'sun-hat', hue: 'peach', icon: 'sun-hat' },
];

const MAX_COUNT = 99;

function baseItem(id: string, builtin: boolean, label: string | null, hue: Hue, icon: IconId): Item {
  return {
    id,
    builtin,
    label,
    hue,
    icon,
    category: null,
    note: '',
    daily: false,
    target: 1,
    stock: 0,
    hidden: false,
  };
}

export function defaultItems(): Item[] {
  return BUILTINS.map(({ id, hue, icon }) => baseItem(id, true, null, hue, icon));
}

function isHue(value: unknown): value is Hue {
  return typeof value === 'string' && (HUES as readonly string[]).includes(value);
}

function count(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
    ? Math.min(value, MAX_COUNT)
    : fallback;
}

function parseItem(raw: unknown): Item | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || r.id === '') return null;

  const builtin = BUILTINS.find((b) => b.id === r.id);
  const label = typeof r.label === 'string' ? r.label.trim() : '';
  if (r.builtin === true && !builtin) return null;
  if (r.builtin !== true && label === '') return null;

  const base = baseItem(
    r.id,
    r.builtin === true,
    r.builtin === true ? null : label,
    isHue(r.hue) ? r.hue : (builtin?.hue ?? 'lavender'),
    isIconId(r.icon) ? r.icon : (builtin?.icon ?? 'star'),
  );
  return {
    ...base,
    category: typeof r.category === 'string' ? r.category : null,
    note: typeof r.note === 'string' ? r.note : '',
    daily: r.daily === true,
    target: count(r.target, 1),
    stock: count(r.stock, 0),
    hidden: r.hidden === true,
  };
}

// Missing, corrupt or wrong-version storage re-seeds the built-ins; an empty list is a valid user choice.
export function parseItems(raw: string | null): Item[] {
  if (raw === null) return defaultItems();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return defaultItems();
    const { version, items } = parsed as { version?: unknown; items?: unknown };
    if (version !== STORAGE_VERSION || !Array.isArray(items)) return defaultItems();

    const seen = new Set<string>();
    const result: Item[] = [];
    for (const entry of items) {
      const item = parseItem(entry);
      if (!item || seen.has(item.id)) continue;
      seen.add(item.id);
      result.push(item);
    }
    return result;
  } catch {
    return defaultItems();
  }
}

export function serializeItems(items: readonly Item[]): string {
  return JSON.stringify({ version: STORAGE_VERSION, items });
}

export function slugify(label: string): string {
  const slug = label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug === '' ? 'item' : slug;
}

// Checks every id, hidden ones included, so a hidden item's persisted state is never reused.
export function uniqueId(label: string, items: readonly Item[]): string {
  const taken = new Set(items.map((item) => item.id));
  const slug = slugify(label);
  if (!taken.has(slug)) return slug;
  let n = 2;
  while (taken.has(`${slug}-${n}`)) n += 1;
  return `${slug}-${n}`;
}

export function addItem(items: readonly Item[], draft: ItemDraft): Item[] {
  const label = draft.label.trim();
  const item = { ...baseItem(uniqueId(label, items), false, label, draft.hue, draft.icon), note: draft.note };
  return [...items, item];
}

export type ItemPatch = Partial<Pick<Item, 'hue' | 'icon' | 'note'>> & { label?: string };

export function updateItem(items: readonly Item[], id: string, patch: ItemPatch): Item[] {
  return items.map((item) => {
    if (item.id !== id) return item;
    const { label, ...rest } = patch;
    const next = { ...item, ...rest };
    if (item.builtin || label === undefined) return next;
    const trimmed = label.trim();
    return trimmed === '' ? next : { ...next, label: trimmed };
  });
}

export function setHidden(items: readonly Item[], id: string, hidden: boolean): Item[] {
  return items.map((item) => (item.id === id ? { ...item, hidden } : item));
}

export function removeItem(items: readonly Item[], id: string): Item[] {
  return items.filter((item) => item.id !== id || item.builtin);
}

export function visibleItems(items: readonly Item[]): Item[] {
  return items.filter((item) => !item.hidden);
}

export function hiddenItems(items: readonly Item[]): Item[] {
  return items.filter((item) => item.hidden);
}

export function useItemList(): {
  items: readonly Item[];
  add: (draft: ItemDraft) => void;
  update: (id: string, patch: ItemPatch) => void;
  hide: (id: string, hidden: boolean) => void;
  remove: (id: string) => void;
} {
  const [items, setItems] = useState<readonly Item[]>(() => parseItems(readStorage(ITEMS_STORAGE_KEY)));

  useEffect(() => {
    writeStorage(ITEMS_STORAGE_KEY, serializeItems(items));
  }, [items]);

  return {
    items,
    add: (draft) => setItems((current) => addItem(current, draft)),
    update: (id, patch) => setItems((current) => updateItem(current, id, patch)),
    hide: (id, hidden) => setItems((current) => setHidden(current, id, hidden)),
    remove: (id) => setItems((current) => removeItem(current, id)),
  };
}

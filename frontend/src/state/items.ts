import { useEffect, useRef, useState } from 'preact/hooks';
import { isIconId, type IconId } from '../icons/iconIds';
import {
  CATALOGUE,
  CATEGORIES,
  DAILY_IDS,
  DEFAULT_TARGETS,
  SEED_IDS,
  TEMPLATE_ITEM_IDS,
  catalogueEntry,
  isCategory,
  type Category,
  type TemplateId,
} from './catalogue';
import { TRACKS_STOCK, byDestination, perDestination, type DestinationId, type PerDestination } from './destinations';
import { pending } from './pending';
import { readStorage, writeStorage } from './safeStorage';
import { mergeItems, type RemoteChanges } from './syncProtocol';

export const ITEMS_STORAGE_KEY = 'daypack.items';
// Version 1 stored target and stock as single numbers; they belong to the daycare.
const STORAGE_VERSION = 2;

export const HUES = ['yellow', 'sky', 'pink', 'mint', 'peach', 'lavender', 'sea'] as const;
export type Hue = (typeof HUES)[number];

export interface Item {
  id: string;
  // Built-ins take their label from the translation dictionary (`item_<id>`); only custom items store text.
  builtin: boolean;
  label: string | null;
  hue: Hue;
  icon: IconId;
  // null groups under 'other'.
  category: Category | null;
  note: string;
  daily: boolean;
  // A target of 0 means the destination keeps its own and nothing is packed for it.
  target: PerDestination;
  stock: PerDestination;
  hidden: boolean;
}

export interface ItemDraft {
  label: string;
  hue: Hue;
  icon: IconId;
  category: Category;
  note: string;
  target: PerDestination;
  daily: boolean;
}

export const MAX_COUNT = 99;

function baseItem(
  id: string,
  builtin: boolean,
  label: string | null,
  hue: Hue,
  icon: IconId,
  category: Category | null = null,
): Item {
  return {
    id,
    builtin,
    label,
    hue,
    icon,
    category,
    note: '',
    daily: false,
    target: perDestination(1),
    stock: perDestination(0),
    hidden: false,
  };
}

function catalogueItem(id: string): Item | null {
  const entry = catalogueEntry(id);
  return entry
    ? {
        ...baseItem(entry.id, true, null, entry.hue, entry.icon, entry.category),
        daily: DAILY_IDS.includes(id),
        target: perDestination(DEFAULT_TARGETS[id] ?? 1),
      }
    : null;
}

export function defaultItems(): Item[] {
  return SEED_IDS.flatMap((id) => catalogueItem(id) ?? []);
}

function isHue(value: unknown): value is Hue {
  return typeof value === 'string' && (HUES as readonly string[]).includes(value);
}

function count(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
    ? Math.min(value, MAX_COUNT)
    : fallback;
}

export function clampCount(value: number, min = 0): number {
  return Math.min(Math.max(Math.round(value), min), MAX_COUNT);
}

// Version 2 stores one number per destination; a version 1 number becomes the daycare's.
function counts(value: unknown, fallback: number): PerDestination {
  const result = perDestination(fallback);
  if (typeof value === 'number') return { ...result, daycare: count(value, fallback) };
  if (typeof value !== 'object' || value === null) return result;
  const record = value as Record<string, unknown>;
  return byDestination((id) => count(record[id], fallback));
}

function clampCounts(values: PerDestination): PerDestination {
  return byDestination((id) => clampCount(values[id]));
}

function parseItem(raw: unknown): Item | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || r.id === '') return null;

  // Only real built-ins take catalogue defaults; a custom item may share an id-like name.
  const builtin = r.builtin === true ? catalogueEntry(r.id) : undefined;
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
    // Items stored before categories existed fall back to the catalogue's grouping.
    category: isCategory(r.category) ? r.category : (builtin?.category ?? null),
    note: typeof r.note === 'string' ? r.note : '',
    daily: typeof r.daily === 'boolean' ? r.daily : (builtin !== undefined && DAILY_IDS.includes(r.id)),
    target: counts(r.target, DEFAULT_TARGETS[r.id] ?? 1),
    stock: counts(r.stock, 0),
    hidden: r.hidden === true,
  };
}

// Another device's item, validated like stored data; the id must match so a row can't smuggle in a different one.
export function parseRemoteItem(id: string, data: unknown): Item | null {
  const item = parseItem(data);
  return item?.id === id ? item : null;
}

// Ids whose value differs between two lists (added, edited or removed); compared by content so
// operations that rebuild unchanged items don't queue needless writes.
export function changedItemIds(before: readonly Item[], after: readonly Item[]): string[] {
  const old = new Map(before.map((item) => [item.id, JSON.stringify(item)]));
  const kept = new Set(after.map((item) => item.id));
  return [
    ...after.filter((item) => old.get(item.id) !== JSON.stringify(item)).map((item) => item.id),
    ...before.filter((item) => !kept.has(item.id)).map((item) => item.id),
  ];
}

// Missing, corrupt or wrong-version storage re-seeds the built-ins; an empty list is a valid user choice.
export function parseItems(raw: string | null): Item[] {
  if (raw === null) return defaultItems();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return defaultItems();
    const { version, items } = parsed as { version?: unknown; items?: unknown };
    if ((version !== 1 && version !== STORAGE_VERSION) || !Array.isArray(items)) return defaultItems();

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

// Lowercased and without diacritics, so "blojor" finds "Blöjor".
export function foldText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function slugify(label: string): string {
  const slug = foldText(label)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug === '' ? 'item' : slug;
}

// Checks every id, hidden ones included, so a hidden item's persisted state is never reused.
// Catalogue ids are reserved so a custom item never collides with a template item added later.
export function uniqueId(label: string, items: readonly Item[]): string {
  const taken = new Set(items.map((item) => item.id));
  const isTaken = (id: string) => taken.has(id) || catalogueEntry(id) !== undefined;
  const slug = slugify(label);
  if (!isTaken(slug)) return slug;
  let n = 2;
  while (isTaken(`${slug}-${n}`)) n += 1;
  return `${slug}-${n}`;
}

export function addItem(items: readonly Item[], draft: ItemDraft): Item[] {
  const label = draft.label.trim();
  const item = {
    ...baseItem(uniqueId(label, items), false, label, draft.hue, draft.icon, draft.category),
    note: draft.note,
    target: clampCounts(draft.target),
    daily: draft.daily,
  };
  return [...items, item];
}

export type ItemPatch = Partial<Pick<Item, 'hue' | 'icon' | 'note' | 'daily'>> & {
  label?: string;
  category?: Category;
  target?: PerDestination;
};

export function updateItem(items: readonly Item[], id: string, patch: ItemPatch): Item[] {
  return items.map((item) => {
    if (item.id !== id) return item;
    const { label, target, ...rest } = patch;
    const next = { ...item, ...rest, ...(target === undefined ? {} : { target: clampCounts(target) }) };
    if (item.builtin || label === undefined) return next;
    const trimmed = label.trim();
    return trimmed === '' ? next : { ...next, label: trimmed };
  });
}

export function setStock(items: readonly Item[], id: string, destination: DestinationId, stock: number): Item[] {
  return items.map((item) =>
    item.id === id ? { ...item, stock: { ...item.stock, [destination]: clampCount(stock) } } : item,
  );
}

export function setHidden(items: readonly Item[], id: string, hidden: boolean): Item[] {
  return items.map((item) => (item.id === id ? { ...item, hidden } : item));
}

// The seeded built-ins stay (hide them instead); built-ins that arrived through a template can go.
export function canDelete(item: Item): boolean {
  return !item.builtin || !SEED_IDS.includes(item.id);
}

export function removeItem(items: readonly Item[], id: string): Item[] {
  return items.filter((item) => item.id !== id || !canDelete(item));
}

export function categoryOf(item: Item): Category {
  return item.category ?? 'other';
}

export interface ItemGroup {
  category: Category;
  items: Item[];
}

// Groups follow the fixed category order; items keep their list order inside a group.
export function groupByCategory(items: readonly Item[]): ItemGroup[] {
  return CATEGORIES.map((category) => ({
    category,
    items: items.filter((item) => categoryOf(item) === category),
  })).filter((group) => group.items.length > 0);
}

export function visibleItems(items: readonly Item[]): Item[] {
  return items.filter((item) => !item.hidden);
}

// How many to put in the bag: daily items always bring their full amount, the rest only top up what is already there.
export function packQuantity(item: Item, destination: DestinationId): number {
  const target = item.target[destination];
  const stock = TRACKS_STOCK[destination] ? item.stock[destination] : 0;
  return item.daily ? target : Math.max(0, target - stock);
}

// Ticking an item never touches the stock; stock only changes in the At view.
export function packItems(items: readonly Item[], destination: DestinationId): Item[] {
  return visibleItems(items).filter((item) => packQuantity(item, destination) > 0);
}

// Daily items are left out (their stock is not tracked), and so is anything the destination keeps itself.
export function destinationItems(items: readonly Item[], destination: DestinationId): Item[] {
  return visibleItems(items).filter((item) => !item.daily && item.target[destination] > 0);
}

export function hiddenItems(items: readonly Item[]): Item[] {
  return items.filter((item) => item.hidden);
}

// While editing: the items that were on the list when editing began (even if hidden since, so the
// hide can be undone) plus anything added meanwhile. Items hidden before the session stay out.
export function editableItems(items: readonly Item[], startedWith: ReadonlySet<string>): Item[] {
  return items.filter((item) => !item.hidden || startedWith.has(item.id));
}

// Everything that could still be added: hidden items plus catalogue entries not on the list yet.
export function availableItems(items: readonly Item[]): Item[] {
  const present = new Set(items.map((item) => item.id));
  const fresh = CATALOGUE.flatMap((entry) => (present.has(entry.id) ? [] : (catalogueItem(entry.id) ?? [])));
  return [...hiddenItems(items), ...fresh];
}

// Unhides an item the user already has, or adds a catalogue item for the first time.
export function includeItem(items: readonly Item[], id: string): Item[] {
  if (items.some((item) => item.id === id)) return setHidden(items, id, false);
  const item = catalogueItem(id);
  return item ? [...items, item] : [...items];
}

export function searchItems(
  candidates: readonly Item[],
  labelOf: (item: Item) => string,
  query: string,
): Item[] {
  const needle = foldText(query);
  if (needle === '') return [...candidates];
  return candidates.filter((item) => foldText(labelOf(item)).includes(needle));
}

export function findByLabel(
  items: readonly Item[],
  labelOf: (item: Item) => string,
  query: string,
): Item | undefined {
  const needle = foldText(query);
  return needle === '' ? undefined : items.find((item) => foldText(labelOf(item)) === needle);
}

export type TemplateState = 'on' | 'partial' | 'off';

// On when every item of the list is visible, off when none is, partial when the user has hidden some by hand.
export function templateState(items: readonly Item[], template: TemplateId): TemplateState {
  const ids = TEMPLATE_ITEM_IDS[template];
  const shown = ids.filter((id) => items.some((item) => item.id === id && !item.hidden)).length;
  if (shown === ids.length) return 'on';
  return shown === 0 ? 'off' : 'partial';
}

export function templateActive(items: readonly Item[], template: TemplateId): boolean {
  return templateState(items, template) === 'on';
}

// Turning a list on (also from partial) adds what is missing and unhides the rest; turning it off only hides,
// so edits and notes survive switching back.
export function setTemplate(items: readonly Item[], template: TemplateId, active: boolean): Item[] {
  const ids = new Set(TEMPLATE_ITEM_IDS[template]);
  if (!active) return items.map((item) => (ids.has(item.id) ? { ...item, hidden: true } : item));
  const present = new Set(items.map((item) => item.id));
  const added = TEMPLATE_ITEM_IDS[template].flatMap((id) => (present.has(id) ? [] : (catalogueItem(id) ?? [])));
  return [...items.map((item) => (ids.has(item.id) ? { ...item, hidden: false } : item)), ...added];
}

export function useItemList(): {
  items: readonly Item[];
  add: (draft: ItemDraft) => void;
  update: (id: string, patch: ItemPatch) => void;
  setStock: (id: string, destination: DestinationId, stock: number) => void;
  hide: (id: string, hidden: boolean) => void;
  remove: (id: string) => void;
  include: (id: string) => void;
  setWeather: (template: TemplateId, active: boolean) => void;
  getItems: () => readonly Item[];
  applyRemote: (changes: RemoteChanges['items']) => void;
  replaceAll: (items: readonly Item[]) => void;
} {
  const [items, setItems] = useState<readonly Item[]>(() => parseItems(readStorage(ITEMS_STORAGE_KEY)));
  // Edits within one tick must build on each other, so the latest list lives in a ref as well as in state.
  const latest = useRef(items);

  useEffect(() => {
    writeStorage(ITEMS_STORAGE_KEY, serializeItems(items));
  }, [items]);

  const set = (next: readonly Item[]) => {
    latest.current = next;
    setItems(next);
  };

  // Local edits are queued for the household; remote ones (applyRemote, replaceAll) are not, or they would echo back.
  const edit = (change: (current: readonly Item[]) => Item[]) => {
    const current = latest.current;
    const next = change(current);
    pending.markItems(changedItemIds(current, next));
    set(next);
  };

  return {
    items,
    add: (draft) => edit((current) => addItem(current, draft)),
    update: (id, patch) => edit((current) => updateItem(current, id, patch)),
    setStock: (id, destination, stock) => edit((current) => setStock(current, id, destination, stock)),
    hide: (id, hidden) => edit((current) => setHidden(current, id, hidden)),
    remove: (id) => edit((current) => removeItem(current, id)),
    include: (id) => edit((current) => includeItem(current, id)),
    setWeather: (template, active) => edit((current) => setTemplate(current, template, active)),
    getItems: () => latest.current,
    applyRemote: (changes) => set(mergeItems(latest.current, changes, pending.hasItem, parseRemoteItem)),
    replaceAll: set,
  };
}

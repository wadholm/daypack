import { useEffect, useState } from 'preact/hooks';
import { isIconId, type IconId } from '../icons/iconIds';
import {
  CATALOGUE,
  CATEGORIES,
  SEED_IDS,
  TEMPLATE_ITEM_IDS,
  catalogueEntry,
  isCategory,
  type Category,
  type TemplateId,
} from './catalogue';
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
  // daily, target and stock have no UI yet; carried so later slices need no data migration.
  // null groups under 'other'.
  category: Category | null;
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
  category: Category;
  note: string;
}

const MAX_COUNT = 99;

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
    target: 1,
    stock: 0,
    hidden: false,
  };
}

function catalogueItem(id: string): Item | null {
  const entry = catalogueEntry(id);
  return entry ? baseItem(entry.id, true, null, entry.hue, entry.icon, entry.category) : null;
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
  };
  return [...items, item];
}

export type ItemPatch = Partial<Pick<Item, 'hue' | 'icon' | 'note'>> & { label?: string; category?: Category };

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
  hide: (id: string, hidden: boolean) => void;
  remove: (id: string) => void;
  include: (id: string) => void;
  setWeather: (template: TemplateId, active: boolean) => void;
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
    include: (id) => setItems((current) => includeItem(current, id)),
    setWeather: (template, active) => setItems((current) => setTemplate(current, template, active)),
  };
}

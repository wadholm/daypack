import { describe, expect, it } from 'vitest';
import { countPacked } from './checked';
import {
  addItem,
  defaultItems,
  hiddenItems,
  parseItems,
  removeItem,
  serializeItems,
  setHidden,
  slugify,
  uniqueId,
  updateItem,
  visibleItems,
  type Item,
  applyTemplate,
  canDelete,
  categoryOf,
  groupByCategory,
  templateAdditions,
} from './items';

const seed = defaultItems();

function stored(items: unknown): string {
  return JSON.stringify({ version: 1, items });
}

describe('defaultItems', () => {
  it('seeds the seven built-ins with the ids and hues from the spec', () => {
    expect(seed.map((item) => [item.id, item.hue])).toEqual([
      ['diapers', 'yellow'],
      ['pacifier', 'sky'],
      ['cuddly-toy', 'pink'],
      ['spare-clothes', 'mint'],
      ['rain-gear', 'lavender'],
      ['water-bottle', 'sea'],
      ['sun-hat', 'peach'],
    ]);
    expect(seed.every((item) => item.builtin && item.label === null && !item.hidden)).toBe(true);
  });

  it('returns a fresh list each call', () => {
    expect(defaultItems()).not.toBe(defaultItems());
  });
});

describe('parseItems', () => {
  it('falls back to the seed for missing, corrupt or wrongly shaped storage', () => {
    expect(parseItems(null)).toEqual(seed);
    expect(parseItems('not json')).toEqual(seed);
    expect(parseItems('[]')).toEqual(seed);
    expect(parseItems(JSON.stringify({ version: 2, items: [] }))).toEqual(seed);
    expect(parseItems(JSON.stringify({ version: 1, items: 'nope' }))).toEqual(seed);
  });

  it('keeps an intentionally empty list instead of re-seeding', () => {
    expect(parseItems(stored([]))).toEqual([]);
  });

  it('round-trips through serializeItems', () => {
    const items = addItem(seed, { label: 'Snack box', hue: 'mint', icon: 'snack', category: 'feeding', note: 'No nuts' });
    expect(parseItems(serializeItems(items))).toEqual(items);
  });

  it('drops entries that are not objects or have no usable id', () => {
    const raw = stored([null, 5, { id: '' }, { id: 7 }, { ...seed[0] }]);
    expect(parseItems(raw).map((item) => item.id)).toEqual(['diapers']);
  });

  it('drops duplicate ids, keeping the first', () => {
    const raw = stored([{ ...seed[0], note: 'first' }, { ...seed[0], note: 'second' }]);
    const items = parseItems(raw);
    expect(items).toHaveLength(1);
    expect(items[0]?.note).toBe('first');
  });

  it('repairs invalid fields with defaults', () => {
    const raw = stored([
      { id: 'mystery', builtin: false, label: 'Mystery', hue: 'neon', icon: 'nope', target: -3, stock: 'x', note: 4, daily: 'yes', hidden: 1 },
    ]);
    expect(parseItems(raw)[0]).toEqual({
      id: 'mystery',
      builtin: false,
      label: 'Mystery',
      hue: 'lavender',
      icon: 'star',
      category: null,
      note: '',
      daily: false,
      target: 1,
      stock: 0,
      hidden: false,
    });
  });

  it('drops a custom item without a label', () => {
    expect(parseItems(stored([{ id: 'x', builtin: false, label: '  ', hue: 'sky', icon: 'star' }]))).toEqual([]);
  });

  it('forces built-ins back to a null label, and ignores unknown built-in ids', () => {
    const raw = stored([{ ...seed[0], label: 'Hacked' }, { id: 'unknown-builtin', builtin: true }]);
    const items = parseItems(raw);
    expect(items).toHaveLength(1);
    expect(items[0]?.label).toBeNull();
  });
});

describe('slugify and uniqueId', () => {
  it('lowercases, strips diacritics and hyphenates', () => {
    expect(slugify('Extra Kläder!')).toBe('extra-klader');
    expect(slugify('  Blöjor   (stora) ')).toBe('blojor-stora');
  });

  it('falls back to "item" when nothing usable remains', () => {
    expect(slugify('🧸')).toBe('item');
    expect(slugify('')).toBe('item');
  });

  it('suffixes a number on collision, hidden items included', () => {
    const items = [
      ...seed,
      { ...seed[0]!, id: 'snack', builtin: false, label: 'Snack', hidden: true },
    ];
    expect(uniqueId('Snack', items)).toBe('snack-2');
    expect(uniqueId('Diapers', items)).toBe('diapers-2');
    expect(uniqueId('Towel', items)).toBe('towel');
  });
});

describe('addItem', () => {
  it('appends a custom item with a generated id and carried defaults', () => {
    const items = addItem(seed, { label: '  Towel ', hue: 'sea', icon: 'blanket', category: 'other', note: '' });
    expect(items).toHaveLength(8);
    expect(items[7]).toEqual({
      id: 'towel',
      builtin: false,
      label: 'Towel',
      hue: 'sea',
      icon: 'blanket',
      category: 'other',
      note: '',
      daily: false,
      target: 1,
      stock: 0,
      hidden: false,
    });
  });

  it('does not mutate the input', () => {
    const before = [...seed];
    addItem(seed, { label: 'Towel', hue: 'sea', icon: 'blanket', category: 'other', note: '' });
    expect(seed).toEqual(before);
  });
});

describe('updateItem', () => {
  it('patches editable fields and keeps the id stable even when the label changes', () => {
    const items = addItem(seed, { label: 'Towel', hue: 'sea', icon: 'blanket', category: 'other', note: '' });
    const next = updateItem(items, 'towel', { label: 'Beach towel', note: 'Blue one' });
    const towel = next.find((item) => item.id === 'towel');
    expect(towel).toMatchObject({ id: 'towel', label: 'Beach towel', note: 'Blue one' });
  });

  it('never gives a built-in a label', () => {
    const next = updateItem(seed, 'diapers', { label: 'Nappies', hue: 'mint' });
    expect(next[0]).toMatchObject({ label: null, hue: 'mint' });
  });

  it('ignores a blank label on a custom item', () => {
    const items = addItem(seed, { label: 'Towel', hue: 'sea', icon: 'blanket', category: 'other', note: '' });
    expect(updateItem(items, 'towel', { label: '   ' })).toEqual(items);
  });
});

describe('hide, unhide and remove', () => {
  it('hides and unhides, moving items between the two views', () => {
    const hidden = setHidden(seed, 'pacifier', true);
    expect(visibleItems(hidden).map((i) => i.id)).not.toContain('pacifier');
    expect(hiddenItems(hidden).map((i) => i.id)).toEqual(['pacifier']);
    expect(hiddenItems(setHidden(hidden, 'pacifier', false))).toEqual([]);
  });

  it('removes a custom item', () => {
    const items = addItem(seed, { label: 'Towel', hue: 'sea', icon: 'blanket', category: 'other', note: '' });
    expect(removeItem(items, 'towel')).toEqual(seed);
  });

  it('refuses to delete a built-in', () => {
    expect(removeItem(seed, 'diapers')).toEqual(seed);
  });
});

describe('categories', () => {
  it('assigns catalogue categories to built-ins and repairs stored ones', () => {
    expect(seed.map((item) => item.category)).toEqual([
      'hygiene',
      'comfort',
      'comfort',
      'clothing',
      'weather',
      'feeding',
      'weather',
    ]);
    const raw = stored([{ id: 'diapers', builtin: true, category: 'bogus' }, { ...seed[1], category: null }]);
    expect(parseItems(raw).map((item) => item.category)).toEqual(['hygiene', 'comfort']);
  });

  it('treats a custom item without a category as other', () => {
    const raw = stored([{ id: 'towel', builtin: false, label: 'Towel', hue: 'sea', icon: 'star' }]);
    const [towel] = parseItems(raw);
    expect(towel?.category).toBeNull();
    expect(categoryOf(towel!)).toBe('other');
  });

  it('groups in the fixed category order and keeps list order inside a group', () => {
    const groups = groupByCategory(seed);
    expect(groups.map((g) => g.category)).toEqual(['clothing', 'hygiene', 'feeding', 'comfort', 'weather']);
    expect(groups.find((g) => g.category === 'weather')?.items.map((i) => i.id)).toEqual(['rain-gear', 'sun-hat']);
  });

  it('lets an edit move an item to another category', () => {
    const next = updateItem(seed, 'diapers', { category: 'other' });
    expect(next[0]?.category).toBe('other');
  });
});

describe('starter templates', () => {
  it('adds only what is missing, built-in and without labels', () => {
    const added = templateAdditions(seed, 'warm').map((item) => item.id);
    expect(added).toEqual(['wet-wipes', 'socks', 'snack', 'sunscreen']);
    expect(applyTemplate(seed, 'warm')).toHaveLength(seed.length + 4);
    expect(templateAdditions(seed, 'warm').every((item) => item.builtin && item.label === null)).toBe(true);
  });

  it('is idempotent', () => {
    const once = applyTemplate(seed, 'cold');
    expect(templateAdditions(once, 'cold')).toEqual([]);
    expect(applyTemplate(once, 'cold')).toEqual(once);
  });

  it('does not resurrect an item the user hid', () => {
    const items = setHidden(seed, 'diapers', true);
    expect(templateAdditions(items, 'cold').map((i) => i.id)).not.toContain('diapers');
  });

  it('survives a storage round trip', () => {
    const items = applyTemplate(seed, 'cold');
    expect(parseItems(serializeItems(items))).toEqual(items);
  });

  it('lets template-added built-ins be deleted but not the seeded ones', () => {
    const items = applyTemplate(seed, 'cold');
    const socks = items.find((i) => i.id === 'socks')!;
    expect(canDelete(socks)).toBe(true);
    expect(removeItem(items, 'socks').map((i) => i.id)).not.toContain('socks');
    expect(canDelete(items[0]!)).toBe(false);
  });
});

describe('migration of existing checked state', () => {
  it('keeps legacy daypack.checked ids working against the seeded list', () => {
    const legacyChecked = new Set(['diapers', 'sun-hat']);
    const ids = visibleItems(parseItems(null)).map((item: Item) => item.id);
    expect(countPacked(ids, legacyChecked)).toBe(2);
  });

  it('does not count hidden items toward progress', () => {
    const items = setHidden(seed, 'diapers', true);
    const ids = visibleItems(items).map((item) => item.id);
    expect(countPacked(ids, new Set(['diapers', 'sun-hat']))).toBe(1);
    expect(ids).toHaveLength(6);
  });
});

import { describe, expect, it } from 'vitest';
import { SEED_IDS, TEMPLATES, TEMPLATE_ITEM_IDS, catalogueEntry } from './catalogue';
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
  canDelete,
  categoryOf,
  groupByCategory,
  setTemplate,
  templateActive,
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
      ['socks', 'pink'],
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
    expect(uniqueId('Rattle', items)).toBe('rattle');
  });
});

describe('addItem', () => {
  it('appends a custom item with a generated id and carried defaults', () => {
    const items = addItem(seed, { label: '  Rattle ', hue: 'sea', icon: 'blanket', category: 'other', note: '' });
    expect(items).toHaveLength(8);
    expect(items[7]).toEqual({
      id: 'rattle',
      builtin: false,
      label: 'Rattle',
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
    addItem(seed, { label: 'Rattle', hue: 'sea', icon: 'blanket', category: 'other', note: '' });
    expect(seed).toEqual(before);
  });
});

describe('updateItem', () => {
  it('patches editable fields and keeps the id stable even when the label changes', () => {
    const items = addItem(seed, { label: 'Rattle', hue: 'sea', icon: 'blanket', category: 'other', note: '' });
    const next = updateItem(items, 'rattle', { label: 'Beach rattle', note: 'Blue one' });
    const rattle = next.find((item) => item.id === 'rattle');
    expect(rattle).toMatchObject({ id: 'rattle', label: 'Beach rattle', note: 'Blue one' });
  });

  it('never gives a built-in a label', () => {
    const next = updateItem(seed, 'diapers', { label: 'Nappies', hue: 'mint' });
    expect(next[0]).toMatchObject({ label: null, hue: 'mint' });
  });

  it('ignores a blank label on a custom item', () => {
    const items = addItem(seed, { label: 'Rattle', hue: 'sea', icon: 'blanket', category: 'other', note: '' });
    expect(updateItem(items, 'rattle', { label: '   ' })).toEqual(items);
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
    const items = addItem(seed, { label: 'Rattle', hue: 'sea', icon: 'blanket', category: 'other', note: '' });
    expect(removeItem(items, 'rattle')).toEqual(seed);
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
    const raw = stored([{ id: 'rattle', builtin: false, label: 'Rattle', hue: 'sea', icon: 'star' }]);
    const [rattle] = parseItems(raw);
    expect(rattle?.category).toBeNull();
    expect(categoryOf(rattle!)).toBe('other');
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

describe('weather templates', () => {
  it('turning on adds the missing items as label-less built-ins and keeps the seed', () => {
    const next = setTemplate(seed, 'warm', true);
    expect(next.map((i) => i.id)).toEqual([
      ...seed.map((i) => i.id),
      'shirt',
      'shorts',
      'sunscreen',
      'uv-clothes',
      'sunglasses',
    ]);
    expect(next.slice(seed.length).every((i) => i.builtin && i.label === null && !i.hidden)).toBe(true);
    expect(templateActive(next, 'warm')).toBe(true);
    expect(templateActive(next, 'cold')).toBe(false);
  });

  it('turning on is idempotent and unhides items that were hidden', () => {
    const once = setTemplate(seed, 'cold', true);
    expect(setTemplate(once, 'cold', true)).toEqual(once);
    const off = setTemplate(once, 'cold', false);
    expect(templateActive(off, 'cold')).toBe(false);
    expect(setTemplate(off, 'cold', true)).toEqual(once);
  });

  it('turning off hides rather than deletes, so notes survive', () => {
    const items = updateItem(setTemplate(seed, 'cold', true), 'pants', { note: 'Wool' });
    const off = setTemplate(items, 'cold', false);
    expect(off).toHaveLength(items.length);
    expect(hiddenItems(off).map((i) => i.id)).toContain('pants');
    expect(setTemplate(off, 'cold', true).find((i) => i.id === 'pants')?.note).toBe('Wool');
  });

  it('only touches its own items, so the other weather and the rest stay visible', () => {
    const both = setTemplate(setTemplate(seed, 'warm', true), 'cold', true);
    const coldOff = setTemplate(both, 'cold', false);
    expect(templateActive(coldOff, 'warm')).toBe(true);
    expect(visibleItems(coldOff).map((i) => i.id)).toContain('diapers');
  });

  it('a template whose item was deleted is off until turned on again', () => {
    const items = removeItem(setTemplate(seed, 'cold', true), 'pants');
    expect(templateActive(items, 'cold')).toBe(false);
    expect(templateActive(setTemplate(items, 'cold', true), 'cold')).toBe(true);
  });

  it('keeps the lists disjoint and only made of catalogue items', () => {
    const all = TEMPLATES.flatMap((template) => TEMPLATE_ITEM_IDS[template]);
    expect(new Set(all).size).toBe(all.length);
    expect(all.every((id) => catalogueEntry(id) !== undefined)).toBe(true);
    expect(all.some((id) => SEED_IDS.includes(id) && id !== 'rain-gear' && id !== 'sun-hat')).toBe(false);
  });

  it('keeps swimming separate from the overnight list', () => {
    const overnight = setTemplate(seed, 'overnight', true);
    expect(templateActive(overnight, 'swim')).toBe(false);
    expect(overnight.map((i) => i.id)).toEqual(expect.arrayContaining(['pyjamas', 'toothbrush', 'night-light']));
    expect(overnight.map((i) => i.id)).not.toContain('towel');
  });

  it('reserves catalogue ids so a custom item never shadows a template item', () => {
    const custom = addItem(seed, { label: 'Towel', hue: 'sea', icon: 'star', category: 'other', note: '' });
    expect(custom.at(-1)?.id).toBe('towel-2');
    expect(templateActive(setTemplate(custom, 'swim', true), 'swim')).toBe(true);
  });

  it('survives a storage round trip', () => {
    const items = setTemplate(seed, 'cold', true);
    expect(parseItems(serializeItems(items))).toEqual(items);
  });

  it('lets template-added built-ins be deleted but not the seeded ones', () => {
    const items = setTemplate(seed, 'cold', true);
    const pants = items.find((i) => i.id === 'pants')!;
    expect(canDelete(pants)).toBe(true);
    expect(removeItem(items, 'pants').map((i) => i.id)).not.toContain('pants');
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

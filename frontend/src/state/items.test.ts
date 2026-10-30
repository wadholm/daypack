import { describe, expect, it } from 'vitest';
import { SEED_IDS, TEMPLATES, TEMPLATE_ITEM_IDS, catalogueEntry } from './catalogue';
import { countPacked } from './checked';
import { perDestination } from './destinations';
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
  availableItems,
  editableItems,
  canDelete,
  findByLabel,
  includeItem,
  searchItems,
  categoryOf,
  groupByCategory,
  setTemplate,
  templateActive,
  templateState,
  clampCount,
  destinationItems,
  packItems,
  packQuantity,
  setStock,
} from './items';

const seed = defaultItems();

function stored(items: unknown): string {
  return JSON.stringify({ version: 1, items });
}

describe('defaultItems', () => {
  it('seeds the five everyday built-ins', () => {
    expect(seed.map((item) => [item.id, item.hue])).toEqual([
      ['diapers', 'yellow'],
      ['pacifier', 'sky'],
      ['cuddly-toy', 'pink'],
      ['socks', 'pink'],
      ['water-bottle', 'sea'],
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
    expect(parseItems(JSON.stringify({ version: 3, items: [] }))).toEqual(seed);
    expect(parseItems(JSON.stringify({ version: 1, items: 'nope' }))).toEqual(seed);
  });

  it('keeps an intentionally empty list instead of re-seeding', () => {
    expect(parseItems(stored([]))).toEqual([]);
  });

  it('round-trips through serializeItems', () => {
    const items = addItem(seed, { label: 'Snack box', hue: 'mint', icon: 'snack', category: 'feeding', note: 'No nuts', target: perDestination(1), daily: false });
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
      target: perDestination(1),
      stock: perDestination(0),
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
    const items = addItem(seed, { label: '  Rattle ', hue: 'sea', icon: 'blanket', category: 'other', note: '', target: perDestination(1), daily: false });
    expect(items).toHaveLength(6);
    expect(items[5]).toEqual({
      id: 'rattle',
      builtin: false,
      label: 'Rattle',
      hue: 'sea',
      icon: 'blanket',
      category: 'other',
      note: '',
      daily: false,
      target: perDestination(1),
      stock: perDestination(0),
      hidden: false,
    });
  });

  it('does not mutate the input', () => {
    const before = [...seed];
    addItem(seed, { label: 'Rattle', hue: 'sea', icon: 'blanket', category: 'other', note: '', target: perDestination(1), daily: false });
    expect(seed).toEqual(before);
  });
});

describe('updateItem', () => {
  it('patches editable fields and keeps the id stable even when the label changes', () => {
    const items = addItem(seed, { label: 'Rattle', hue: 'sea', icon: 'blanket', category: 'other', note: '', target: perDestination(1), daily: false });
    const next = updateItem(items, 'rattle', { label: 'Beach rattle', note: 'Blue one' });
    const rattle = next.find((item) => item.id === 'rattle');
    expect(rattle).toMatchObject({ id: 'rattle', label: 'Beach rattle', note: 'Blue one' });
  });

  it('never gives a built-in a label', () => {
    const next = updateItem(seed, 'diapers', { label: 'Nappies', hue: 'mint' });
    expect(next[0]).toMatchObject({ label: null, hue: 'mint' });
  });

  it('ignores a blank label on a custom item', () => {
    const items = addItem(seed, { label: 'Rattle', hue: 'sea', icon: 'blanket', category: 'other', note: '', target: perDestination(1), daily: false });
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
    const items = addItem(seed, { label: 'Rattle', hue: 'sea', icon: 'blanket', category: 'other', note: '', target: perDestination(1), daily: false });
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
      'feeding',
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
    expect(groups.map((g) => g.category)).toEqual(['clothing', 'hygiene', 'feeding', 'comfort']);
    expect(groups.find((g) => g.category === 'comfort')?.items.map((i) => i.id)).toEqual(['pacifier', 'cuddly-toy']);
  });

  it('lets an edit move an item to another category', () => {
    const next = updateItem(seed, 'diapers', { category: 'other' });
    expect(next[0]?.category).toBe('other');
  });
});

describe('editableItems', () => {
  it('keeps items hidden during the session but not ones hidden before it', () => {
    const before = setHidden(seed, 'pacifier', true);
    const startedWith = new Set(visibleItems(before).map((i) => i.id));
    const during = setHidden(before, 'diapers', true);
    expect(editableItems(during, startedWith).map((i) => i.id)).toContain('diapers');
    expect(editableItems(during, startedWith).map((i) => i.id)).not.toContain('pacifier');
  });

  it('shows items added during the session', () => {
    const added = includeItem(seed, 'pyjamas');
    expect(editableItems(added, new Set(seed.map((i) => i.id))).map((i) => i.id)).toContain('pyjamas');
  });
});

describe('adding existing items', () => {
  const labelOf = (item: Item) => item.label ?? item.id;

  it('offers hidden items and catalogue entries that are not on the list', () => {
    const items = setHidden(seed, 'pacifier', true);
    const ids = availableItems(items).map((i) => i.id);
    expect(ids[0]).toBe('pacifier');
    expect(ids).toContain('pyjamas');
    expect(ids).not.toContain('diapers');
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('adds a catalogue item once, and unhides one the user already has', () => {
    const added = includeItem(seed, 'pyjamas');
    expect(added.at(-1)).toMatchObject({ id: 'pyjamas', builtin: true, label: null, hidden: false });
    expect(includeItem(added, 'pyjamas')).toEqual(added);
    const hidden = setHidden(added, 'pyjamas', true);
    expect(includeItem(hidden, 'pyjamas')).toEqual(added);
  });

  it('ignores an unknown id', () => {
    expect(includeItem(seed, 'nope')).toEqual(seed);
  });

  it('searches ignoring case and diacritics', () => {
    const items = [
      { ...seed[0]!, builtin: false, id: 'blojor', label: 'Blöjor' },
      { ...seed[0]!, builtin: false, id: 'napp', label: 'Napp' },
    ];
    expect(searchItems(items, labelOf, 'BLOJ').map((i) => i.id)).toEqual(['blojor']);
    expect(searchItems(items, labelOf, '  ').map((i) => i.id)).toEqual(['blojor', 'napp']);
    expect(searchItems(items, labelOf, 'xyz')).toEqual([]);
  });

  it('finds an exact label match so duplicates are not created', () => {
    const items = [{ ...seed[0]!, builtin: false, id: 'towel-2', label: 'Towel' }];
    expect(findByLabel(items, labelOf, ' towel ')?.id).toBe('towel-2');
    expect(findByLabel(items, labelOf, 'tow')).toBeUndefined();
    expect(findByLabel(items, labelOf, '')).toBeUndefined();
  });
});

describe('weather templates', () => {
  it('turning on adds the missing items as label-less built-ins and keeps the seed', () => {
    const next = setTemplate(seed, 'warm', true);
    expect(next.map((i) => i.id)).toEqual([
      ...seed.map((i) => i.id),
      'shirt',
      'shorts',
      'sun-hat',
      'sunscreen',
      'uv-clothes',
      'sunglasses',
    ]);
    expect(next.slice(seed.length).every((i) => i.builtin && i.label === null && !i.hidden)).toBe(true);
    expect(templateActive(next, 'warm')).toBe(true);
    expect(templateActive(next, 'cold')).toBe(false);
  });

  it('reports partly on when the user hides some of a list by hand, and turning on restores it', () => {
    const on = setTemplate(seed, 'overnight', true);
    expect(templateState(seed, 'overnight')).toBe('off');
    expect(templateState(on, 'overnight')).toBe('on');
    const partial = setHidden(on, 'travel-cot', true);
    expect(templateState(partial, 'overnight')).toBe('partial');
    expect(templateActive(partial, 'overnight')).toBe(false);
    expect(templateState(setTemplate(partial, 'overnight', true), 'overnight')).toBe('on');
    expect(templateState(setTemplate(partial, 'overnight', false), 'overnight')).toBe('off');
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
    expect(all.some((id) => SEED_IDS.includes(id))).toBe(false);
  });

  it('keeps rain gear on its own list so it works in any weather', () => {
    const rain = setTemplate(setTemplate(seed, 'warm', true), 'rain', true);
    expect(templateActive(rain, 'rain')).toBe(true);
    const warmOff = setTemplate(rain, 'warm', false);
    expect(visibleItems(warmOff).map((i) => i.id)).toEqual(expect.arrayContaining(['rain-gear', 'rubber-boots']));
    expect(templateActive(setTemplate(rain, 'cold', true), 'rain')).toBe(true);
  });

  it('keeps swimming separate from the overnight list', () => {
    const overnight = setTemplate(seed, 'overnight', true);
    expect(templateActive(overnight, 'swim')).toBe(false);
    expect(overnight.map((i) => i.id)).toEqual(expect.arrayContaining(['pyjamas', 'toothbrush', 'night-light']));
    expect(overnight.map((i) => i.id)).not.toContain('towel');
  });

  it('reserves catalogue ids so a custom item never shadows a template item', () => {
    const custom = addItem(seed, { label: 'Towel', hue: 'sea', icon: 'star', category: 'other', note: '', target: perDestination(1), daily: false });
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
    const legacyChecked = new Set(['diapers', 'socks']);
    const ids = visibleItems(parseItems(null)).map((item: Item) => item.id);
    expect(countPacked(ids, legacyChecked)).toBe(2);
  });

  it('does not count hidden items toward progress', () => {
    const items = setHidden(seed, 'diapers', true);
    const ids = visibleItems(items).map((item) => item.id);
    expect(countPacked(ids, new Set(['diapers', 'socks']))).toBe(1);
    expect(ids).toHaveLength(4);
  });
});

describe('destination stock', () => {
  const byId = (items: readonly Item[], id: string) => items.find((item) => item.id === id)!;

  it('flags the pacifier and water bottle as daily on a fresh install only', () => {
    expect(seed.filter((item) => item.daily).map((item) => item.id)).toEqual(['pacifier', 'water-bottle']);
    const old = parseItems(stored([{ id: 'pacifier', builtin: true, daily: false }]));
    expect(old[0]?.daily).toBe(false);
    const unset = parseItems(stored([{ id: 'pacifier', builtin: true }]));
    expect(unset[0]?.daily).toBe(true);
  });

  it('wants five diapers and three socks by default, at every destination', () => {
    expect(byId(seed, 'diapers').target).toEqual({ daycare: 5, grandparents: 5, as: 5 });
    expect(byId(seed, 'socks').target).toEqual({ daycare: 3, grandparents: 3, as: 3 });
  });

  it('packs target minus stock, never below zero', () => {
    const socks = { ...byId(seed, 'socks'), target: perDestination(3), stock: perDestination(1) };
    expect(packQuantity(socks, 'daycare')).toBe(2);
    expect(packQuantity({ ...socks, stock: perDestination(5) }, 'daycare')).toBe(0);
  });

  it('always packs daily items in full, whatever the stock', () => {
    const bottle = { ...byId(seed, 'water-bottle'), target: perDestination(2), stock: perDestination(2) };
    expect(packQuantity(bottle, 'daycare')).toBe(2);
  });

  it('keeps stock apart per destination', () => {
    const items = setStock(seed, 'diapers', 'daycare', 2);
    expect(packQuantity(byId(items, 'diapers'), 'daycare')).toBe(3);
    expect(packQuantity(byId(items, 'diapers'), 'grandparents')).toBe(5);
    const both = setStock(items, 'diapers', 'grandparents', 5);
    expect(packItems(both, 'grandparents').some((item) => item.id === 'diapers')).toBe(false);
    expect(packItems(both, 'daycare').some((item) => item.id === 'diapers')).toBe(true);
  });

  it('ignores stock at a destination that does not track it', () => {
    const items = setStock(setStock(seed, 'diapers', 'as', 5), 'diapers', 'daycare', 5);
    expect(packQuantity(byId(items, 'diapers'), 'as')).toBe(5);
    expect(packQuantity(byId(items, 'diapers'), 'daycare')).toBe(0);
    expect(packItems(items, 'as').some((item) => item.id === 'diapers')).toBe(true);
  });

  it('still leaves out of a stockless destination whatever it wants none of', () => {
    const items = updateItem(seed, 'diapers', { target: { daycare: 5, grandparents: 5, as: 0 } });
    expect(packItems(items, 'as').some((item) => item.id === 'diapers')).toBe(false);
  });

  it('leaves out of a destination whatever it wants none of', () => {
    const items = updateItem(seed, 'diapers', { target: { daycare: 5, grandparents: 0, as: 5 } });
    expect(packItems(items, 'grandparents').some((item) => item.id === 'diapers')).toBe(false);
    expect(destinationItems(items, 'grandparents').some((item) => item.id === 'diapers')).toBe(false);
    expect(destinationItems(items, 'daycare').some((item) => item.id === 'diapers')).toBe(true);
  });

  it('drops covered and hidden items from the pack list and daily ones from the destination list', () => {
    let items = setStock(seed, 'socks', 'daycare', 3);
    items = setHidden(items, 'cuddly-toy', true);
    expect(packItems(items, 'daycare').map((item) => item.id)).toEqual(['diapers', 'pacifier', 'water-bottle']);
    expect(destinationItems(items, 'daycare').map((item) => item.id)).toEqual(['diapers', 'socks']);
  });

  it('brings an item back when its target rises above the stock', () => {
    const covered = setStock(seed, 'socks', 'daycare', 3);
    expect(packItems(covered, 'daycare').some((item) => item.id === 'socks')).toBe(false);
    const raised = updateItem(covered, 'socks', { target: { daycare: 4, grandparents: 3, as: 3 } });
    expect(packItems(raised, 'daycare').some((item) => item.id === 'socks')).toBe(true);
  });

  it('keeps stock and target in range', () => {
    expect(clampCount(-4)).toBe(0);
    expect(clampCount(400)).toBe(99);
    expect(byId(setStock(seed, 'socks', 'daycare', 150), 'socks').stock.daycare).toBe(99);
    expect(byId(updateItem(seed, 'socks', { target: perDestination(150) }), 'socks').target.daycare).toBe(99);
    expect(byId(updateItem(seed, 'socks', { target: perDestination(-2) }), 'socks').target.daycare).toBe(0);
  });

  it('carries target and daily into a new custom item', () => {
    const items = addItem(seed, {
      label: 'Rattle',
      hue: 'sea',
      icon: 'star',
      category: 'other',
      note: '',
      target: { daycare: 2, grandparents: 0, as: 1 },
      daily: true,
    });
    expect(byId(items, 'rattle')).toMatchObject({
      target: { daycare: 2, grandparents: 0, as: 1 },
      daily: true,
      stock: perDestination(0),
    });
  });

  it('migrates version 1 numbers to the daycare and keeps the default elsewhere', () => {
    const raw = JSON.stringify({ version: 1, items: [{ id: 'socks', builtin: true, target: 4, stock: 2 }] });
    const [socks] = parseItems(raw);
    expect(socks?.target).toEqual({ daycare: 4, grandparents: 3, as: 3 });
    expect(socks?.stock).toEqual({ daycare: 2, grandparents: 0, as: 0 });
  });

  it('reads per-destination counts and repairs bad entries', () => {
    const raw = stored([{ id: 'socks', builtin: true, target: { daycare: 2, grandparents: 'x' }, stock: { daycare: -1 } }]);
    const [socks] = parseItems(raw.replace('"version":1', '"version":2'));
    expect(socks?.target).toEqual({ daycare: 2, grandparents: 3, as: 3 });
    expect(socks?.stock).toEqual(perDestination(0));
  });

  it('writes version 2 and round-trips', () => {
    const items = setStock(seed, 'diapers', 'grandparents', 4);
    expect(JSON.parse(serializeItems(items)).version).toBe(2);
    expect(parseItems(serializeItems(items))).toEqual(items);
  });
});

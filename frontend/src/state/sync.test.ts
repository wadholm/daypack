import { describe, expect, it, vi } from 'vitest';
import { changedChecks, emptyChecked } from './checked';
import { inviteLink, parseHousehold, parseJoinHash } from './household';
import { changedItemIds, defaultItems, setStock, updateItem } from './items';
import { checkedKey, createPendingStore, parsePending, type PendingStore } from './pending';
import { syncOnce, type SyncDeps } from './syncClient';
import { buildRequest, mergeChecked, mergeItems, parseResponse } from './syncProtocol';
import { parseRemoteItem } from './items';

const memoryStore = () => {
  let saved: string | null = null;
  return createPendingStore(() => saved, (value) => (saved = value));
};

describe('pending store', () => {
  it('acknowledges what was sent', () => {
    const store = memoryStore();
    store.markItems(['a', 'b']);
    store.acknowledge(store.snapshot());
    expect(store.isEmpty()).toBe(true);
  });

  it('keeps an entry that changed again while its push was in flight', () => {
    const store = memoryStore();
    store.markItems(['a', 'b']);
    const sent = store.snapshot();
    store.markItems(['a']);
    store.acknowledge(sent);
    expect(store.hasItem('a')).toBe(true);
    expect(store.hasItem('b')).toBe(false);
  });

  it('survives a reload and keeps versions increasing', () => {
    let saved: string | null = null;
    const first = createPendingStore(() => saved, (value) => (saved = value));
    first.markItems(['a']);
    const second = createPendingStore(() => saved, (value) => (saved = value));
    expect(second.hasItem('a')).toBe(true);
    const sent = second.snapshot();
    second.markItems(['a']);
    second.acknowledge(sent);
    expect(second.hasItem('a')).toBe(true);
  });

  it('reads corrupt storage as empty', () => {
    expect(parsePending('{nope')).toEqual({ items: {}, checked: {} });
    expect(parsePending('{"items":{"a":"x","b":2}}').items).toEqual({ b: 2 });
  });

  it('notifies subscribers', () => {
    const store = memoryStore();
    const listener = vi.fn();
    const off = store.subscribe(listener);
    store.markItems(['a']);
    off();
    store.markItems(['b']);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('detecting local changes', () => {
  it('lists only items whose content changed', () => {
    const before = defaultItems();
    const after = updateItem(before, 'diapers', { note: 'size 3' });
    expect(changedItemIds(before, after)).toEqual(['diapers']);
  });

  it('lists removed items', () => {
    const before = defaultItems();
    expect(changedItemIds(before, before.slice(1))).toEqual([before[0]?.id]);
  });

  it('ignores a stock change that sets the same value', () => {
    const before = defaultItems();
    expect(changedItemIds(before, setStock(before, 'diapers', 'daycare', 0))).toEqual([]);
  });

  it('lists ticks per destination, both ways', () => {
    const before = { ...emptyChecked(), daycare: new Set(['socks']) };
    const after = { ...emptyChecked(), as: new Set(['socks']) };
    expect(changedChecks(before, after).sort()).toEqual(['as/socks', 'daycare/socks']);
  });
});

describe('buildRequest', () => {
  it('sends the current value of queued items and a delete for missing ones', () => {
    const items = defaultItems();
    const store = memoryStore();
    store.markItems(['diapers', 'gone']);
    store.markChecked([checkedKey('daycare', 'socks'), checkedKey('nowhere', 'socks')]);
    const checked = { ...emptyChecked(), daycare: new Set(['socks']) };
    const request = buildRequest(7, store.snapshot(), items, checked);
    expect(request.since).toBe(7);
    expect(request.items.map((i) => [i.id, i.data === null])).toEqual([
      ['diapers', false],
      ['gone', true],
    ]);
    expect(request.checked).toEqual([{ destination: 'daycare', id: 'socks', checked: true }]);
  });
});

describe('merging remote changes', () => {
  const remoteDiapers = (note: string) => ({
    id: 'diapers',
    data: updateItem(defaultItems(), 'diapers', { note }).find((i) => i.id === 'diapers'),
  });

  it('applies a remote edit in place and appends new items', () => {
    const items = defaultItems();
    const added = { id: 'socks', data: items.find((i) => i.id === 'socks') };
    const merged = mergeItems(items.filter((i) => i.id !== 'socks'), [remoteDiapers('hi'), added], () => false, parseRemoteItem);
    expect(merged.find((i) => i.id === 'diapers')?.note).toBe('hi');
    expect(merged.at(-1)?.id).toBe('socks');
  });

  it("keeps this device's unpushed change over a remote one", () => {
    const merged = mergeItems(defaultItems(), [remoteDiapers('remote')], (id) => id === 'diapers', parseRemoteItem);
    expect(merged.find((i) => i.id === 'diapers')?.note).toBe('');
  });

  it('removes a deleted item and skips invalid ones', () => {
    const merged = mergeItems(
      defaultItems(),
      [
        { id: 'diapers', data: null },
        { id: 'socks', data: { id: 'socks', builtin: false, label: '' } },
        { id: 'pacifier', data: { id: 'other', builtin: true } },
      ],
      () => false,
      parseRemoteItem,
    );
    expect(merged.some((i) => i.id === 'diapers')).toBe(false);
    expect(merged.some((i) => i.id === 'socks')).toBe(true);
    expect(merged.some((i) => i.id === 'pacifier')).toBe(true);
  });

  it('merges ticks, ignoring unknown destinations and pending ticks', () => {
    const start = { ...emptyChecked(), daycare: new Set(['a', 'b']) };
    const merged = mergeChecked(
      start,
      [
        { destination: 'daycare', id: 'a', checked: false },
        { destination: 'daycare', id: 'b', checked: false },
        { destination: 'as', id: 'c', checked: true },
        { destination: 'mars', id: 'd', checked: true },
      ],
      (key) => key === 'daycare/b',
    );
    expect([...merged.daycare]).toEqual(['b']);
    expect([...merged.as]).toEqual(['c']);
  });

  it('parses a response defensively', () => {
    expect(parseResponse(null)).toBeNull();
    expect(parseResponse({ cursor: 'x', items: [], checked: [] })).toBeNull();
    expect(parseResponse({ cursor: 3, items: [{ id: 1 }, { id: 'a', data: null }], checked: [{ id: 'a' }] })).toEqual({
      cursor: 3,
      items: [{ id: 'a', data: null }],
      checked: [],
    });
  });
});

describe('syncOnce', () => {
  function setup(answer: Awaited<ReturnType<SyncDeps['post']>>) {
    const store: PendingStore = memoryStore();
    const applyRemote = vi.fn();
    const post = vi.fn().mockResolvedValue(answer);
    store.markItems(['diapers']);
    const deps: SyncDeps = { post, pending: store, getItems: defaultItems, getChecked: emptyChecked, applyRemote };
    return { store, applyRemote, post, deps };
  }

  it('acknowledges and applies on success', async () => {
    const { store, applyRemote, deps } = setup({ status: 200, json: { cursor: 4, items: [], checked: [] } });
    expect(await syncOnce(1, deps)).toEqual({ kind: 'ok', cursor: 4 });
    expect(store.isEmpty()).toBe(true);
    expect(applyRemote).toHaveBeenCalledOnce();
  });

  it('keeps everything queued when offline', async () => {
    const { store, applyRemote, deps } = setup(null);
    expect(await syncOnce(1, deps)).toEqual({ kind: 'failed' });
    expect(store.hasItem('diapers')).toBe(true);
    expect(applyRemote).not.toHaveBeenCalled();
  });

  it.each([500, 400])('treats status %i as a failure and keeps the queue', async (status) => {
    const { store, deps } = setup({ status, json: {} });
    expect(await syncOnce(1, deps)).toEqual({ kind: 'failed' });
    expect(store.hasItem('diapers')).toBe(true);
  });

  it('reports a rejected token', async () => {
    const { deps } = setup({ status: 401, json: { error: 'unauthorized' } });
    expect(await syncOnce(1, deps)).toEqual({ kind: 'unauthorized' });
  });

  it('does not apply a remote value over an edit made while the request was in flight', async () => {
    const store = memoryStore();
    store.markItems(['diapers']);
    let merged = defaultItems();
    const deps: SyncDeps = {
      post: async () => {
        store.markItems(['diapers']);
        return { status: 200, json: { cursor: 2, items: [{ id: 'diapers', data: null }], checked: [] } };
      },
      pending: store,
      getItems: defaultItems,
      getChecked: emptyChecked,
      applyRemote: (changes) => (merged = mergeItems(merged, changes.items, store.hasItem, parseRemoteItem)),
    };
    await syncOnce(0, deps);
    expect(merged.some((i) => i.id === 'diapers')).toBe(true);
    expect(store.hasItem('diapers')).toBe(true);
  });
});

describe('household storage and links', () => {
  it('reads a stored household and rejects junk', () => {
    expect(parseHousehold('{"token":"t","cursor":5}')).toEqual({ token: 't', cursor: 5 });
    expect(parseHousehold('{"token":"t","cursor":-1}')).toEqual({ token: 't', cursor: 0 });
    expect(parseHousehold('')).toBeNull();
    expect(parseHousehold('{"token":""}')).toBeNull();
    expect(parseHousehold(null)).toBeNull();
  });

  it('round-trips an invite through the URL fragment', () => {
    const link = inviteLink('https://daypack.example', 'a-b_c');
    expect(link).toBe('https://daypack.example/#join=a-b_c');
    expect(parseJoinHash(new URL(link).hash)).toBe('a-b_c');
    expect(parseJoinHash('#other')).toBeNull();
    expect(parseJoinHash('#join=%E0%A4%A')).toBeNull();
  });
});

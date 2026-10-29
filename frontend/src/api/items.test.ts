import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchItems } from './items';

const signal = new AbortController().signal;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchItems', () => {
  it('requests the given language and returns the items', async () => {
    const items = [{ id: 'diapers', hue: 'yellow', label: 'Blöjor' }];
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items })));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchItems('sv', signal)).resolves.toEqual(items);
    expect(fetchMock).toHaveBeenCalledWith('/api/items?lang=sv', { signal });
  });

  it('rejects on a non-2xx response so the UI can show the error state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('bad gateway', { status: 502 })));

    await expect(fetchItems('en', signal)).rejects.toThrow('502');
  });
});

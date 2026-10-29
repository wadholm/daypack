import { describe, expect, it } from 'vitest';
import app from './index';

interface ItemsResponse {
  items: { id: string; hue: string; label: string }[];
}

async function fetchItems(query = ''): Promise<{ status: number; body: ItemsResponse }> {
  const res = await app.request(`/api/items${query}`);
  return { status: res.status, body: (await res.json()) as ItemsResponse };
}

describe('GET /api/items', () => {
  it('returns English labels by default', async () => {
    const { status, body } = await fetchItems();
    expect(status).toBe(200);
    expect(body.items).toHaveLength(7);
    expect(body.items[0]).toEqual({ id: 'diapers', hue: 'yellow', label: 'Diapers' });
  });

  it('returns Swedish labels for lang=sv', async () => {
    const { body } = await fetchItems('?lang=sv');
    expect(body.items.map((item) => item.label)).toEqual([
      'Blöjor',
      'Napp',
      'Gosedjur',
      'Extrakläder',
      'Regnkläder',
      'Vattenflaska',
      'Solhatt',
    ]);
  });

  it('falls back to English for an unknown lang', async () => {
    const { body } = await fetchItems('?lang=fr');
    expect(body.items[0]?.label).toBe('Diapers');
  });

  it('keeps ids, hues and order identical across languages', async () => {
    const en = (await fetchItems('?lang=en')).body.items;
    const sv = (await fetchItems('?lang=sv')).body.items;
    expect(sv.map(({ id, hue }) => ({ id, hue }))).toEqual(en.map(({ id, hue }) => ({ id, hue })));
  });
});

import { describe, expect, it } from 'vitest';
import app from './index';

describe('unknown /api routes', () => {
  it('answers with a JSON 404', async () => {
    const res = await app.request('/api/items');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'not_found' });
  });
});

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getPlatformProxy } from 'wrangler';
import migration from '../migrations/0001_init.sql?raw';
import app from './index';

// A real local D1 (miniflare, in memory) rather than a mock, so the SQL itself is what gets tested.
let env: Env;
let dispose: () => Promise<void>;

beforeAll(async () => {
  const proxy = await getPlatformProxy<Env>({ configPath: '../wrangler.jsonc', persist: false });
  env = proxy.env;
  dispose = proxy.dispose;
  await env.DB.exec(migration.replace(/--.*$/gm, '').replace(/\s+/g, ' '));
});

afterAll(async () => {
  await dispose();
});

beforeEach(async () => {
  await env.DB.batch([
    env.DB.prepare('DELETE FROM checked'),
    env.DB.prepare('DELETE FROM items'),
    env.DB.prepare('DELETE FROM devices'),
    env.DB.prepare('DELETE FROM households'),
  ]);
});

function call(path: string, init: { method?: string; token?: string; body?: unknown } = {}): Promise<Response> {
  return Promise.resolve(
    app.request(
      path,
      {
        method: init.method ?? 'GET',
        headers: {
          ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
          ...(init.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
      },
      env,
    ),
  );
}

async function createHousehold(): Promise<{ deviceToken: string; invite: string }> {
  const res = await call('/api/households', { method: 'POST' });
  expect(res.status).toBe(201);
  return (await res.json()) as { deviceToken: string; invite: string };
}

async function syncAs(token: string, body: unknown) {
  const res = await call('/api/sync', { method: 'POST', token, body });
  return { status: res.status, json: (await res.json()) as Record<string, unknown> };
}

describe('unknown /api routes', () => {
  it('answers with a JSON 404', async () => {
    const res = await call('/api/nope');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'not_found' });
  });
});

describe('household', () => {
  it('creates a household and returns a device token and an invite', async () => {
    const { deviceToken, invite } = await createHousehold();
    expect(deviceToken.length).toBeGreaterThanOrEqual(40);
    expect(invite).not.toBe(deviceToken);

    const res = await call('/api/household', { token: deviceToken });
    expect(await res.json()).toEqual({ invite });
  });

  it('stores only a hash of the device token', async () => {
    const { deviceToken } = await createHousehold();
    const rows = await env.DB.prepare('SELECT token_hash FROM devices').all<{ token_hash: string }>();
    expect(rows.results.map((r) => r.token_hash)).not.toContain(deviceToken);
  });

  it('lets a second device join with the invite and share the data', async () => {
    const first = await createHousehold();
    await syncAs(first.deviceToken, { items: [{ id: 'diapers', data: { label: 'x' } }] });

    const joined = await call('/api/households/join', { method: 'POST', body: { invite: first.invite } });
    expect(joined.status).toBe(201);
    const { deviceToken } = (await joined.json()) as { deviceToken: string };
    expect(deviceToken).not.toBe(first.deviceToken);

    const { json } = await syncAs(deviceToken, { since: 0 });
    expect(json.items).toEqual([{ id: 'diapers', data: { label: 'x' } }]);
  });

  it('rejects an unknown invite', async () => {
    const res = await call('/api/households/join', { method: 'POST', body: { invite: 'nope' } });
    expect(res.status).toBe(404);
  });

  it('rejects a join without an invite', async () => {
    const res = await call('/api/households/join', { method: 'POST', body: {} });
    expect(res.status).toBe(400);
  });

  it('regenerating the invite revokes the old link but keeps joined devices working', async () => {
    const first = await createHousehold();
    const res = await call('/api/household/invite', { method: 'POST', token: first.deviceToken });
    const { invite } = (await res.json()) as { invite: string };
    expect(invite).not.toBe(first.invite);

    const old = await call('/api/households/join', { method: 'POST', body: { invite: first.invite } });
    expect(old.status).toBe(404);
    const fresh = await call('/api/households/join', { method: 'POST', body: { invite } });
    expect(fresh.status).toBe(201);
    expect((await call('/api/household', { token: first.deviceToken })).status).toBe(200);
  });

  it('leaving forgets the device only', async () => {
    const first = await createHousehold();
    const joined = await call('/api/households/join', { method: 'POST', body: { invite: first.invite } });
    const second = (await joined.json()) as { deviceToken: string };

    expect((await call('/api/device', { method: 'DELETE', token: second.deviceToken })).status).toBe(204);
    expect((await call('/api/household', { token: second.deviceToken })).status).toBe(401);
    expect((await call('/api/household', { token: first.deviceToken })).status).toBe(200);
  });

  it('keeps households apart', async () => {
    const a = await createHousehold();
    const b = await createHousehold();
    await syncAs(a.deviceToken, { items: [{ id: 'socks', data: { n: 1 } }] });
    const { json } = await syncAs(b.deviceToken, { since: 0 });
    expect(json.items).toEqual([]);
  });
});

describe('auth', () => {
  it('rejects a missing or unknown token', async () => {
    expect((await call('/api/sync', { method: 'POST', body: {} })).status).toBe(401);
    expect((await call('/api/sync', { method: 'POST', token: 'bogus', body: {} })).status).toBe(401);
    expect((await call('/api/household')).status).toBe(401);
  });
});

describe('sync', () => {
  it('returns what was written since the cursor, and nothing older', async () => {
    const { deviceToken } = await createHousehold();
    const first = await syncAs(deviceToken, { items: [{ id: 'a', data: { n: 1 } }] });
    expect(first.json.cursor).toBe(1);

    const second = await syncAs(deviceToken, { since: 1, items: [{ id: 'b', data: { n: 2 } }] });
    expect(second.json.cursor).toBe(2);
    expect(second.json.items).toEqual([{ id: 'b', data: { n: 2 } }]);

    const pull = await syncAs(deviceToken, { since: 2 });
    expect(pull.json).toEqual({ cursor: 2, items: [], checked: [] });
  });

  it('does not advance the cursor on a pure pull', async () => {
    const { deviceToken } = await createHousehold();
    await syncAs(deviceToken, { items: [{ id: 'a', data: { n: 1 } }] });
    const a = await syncAs(deviceToken, { since: 0 });
    const b = await syncAs(deviceToken, { since: 0 });
    expect(a.json.cursor).toBe(b.json.cursor);
  });

  it('last write wins per item, not per household', async () => {
    const first = await createHousehold();
    const joined = await call('/api/households/join', { method: 'POST', body: { invite: first.invite } });
    const second = (await joined.json()) as { deviceToken: string };

    await syncAs(first.deviceToken, { items: [{ id: 'a', data: { v: 'mom' } }, { id: 'b', data: { v: 'mom' } }] });
    await syncAs(second.deviceToken, { items: [{ id: 'a', data: { v: 'dad' } }] });

    const { json } = await syncAs(first.deviceToken, { since: 0 });
    expect(json.items).toEqual(
      expect.arrayContaining([
        { id: 'a', data: { v: 'dad' } },
        { id: 'b', data: { v: 'mom' } },
      ]),
    );
  });

  it('propagates a delete as a tombstone', async () => {
    const { deviceToken } = await createHousehold();
    const written = await syncAs(deviceToken, { items: [{ id: 'a', data: { n: 1 } }] });
    const removed = await syncAs(deviceToken, { since: written.json.cursor, items: [{ id: 'a', data: null }] });
    expect(removed.json.items).toEqual([{ id: 'a', data: null }]);
  });

  it('syncs ticks per destination, including unticks', async () => {
    const { deviceToken } = await createHousehold();
    await syncAs(deviceToken, {
      checked: [
        { destination: 'daycare', id: 'socks', checked: true },
        { destination: 'as', id: 'socks', checked: true },
      ],
    });
    const untick = await syncAs(deviceToken, {
      since: 1,
      checked: [{ destination: 'daycare', id: 'socks', checked: false }],
    });
    expect(untick.json.checked).toEqual([{ destination: 'daycare', id: 'socks', checked: false }]);

    const all = await syncAs(deviceToken, { since: 0 });
    expect(all.json.checked).toEqual(
      expect.arrayContaining([
        { destination: 'daycare', id: 'socks', checked: false },
        { destination: 'as', id: 'socks', checked: true },
      ]),
    );
  });

  it.each([
    ['a negative cursor', { since: -1 }],
    ['a fractional cursor', { since: 1.5 }],
    ['an item whose data is not an object', { items: [{ id: 'a', data: 'text' }] }],
    ['an item with a bad id', { items: [{ id: '../x', data: {} }] }],
    ['an oversized item', { items: [{ id: 'a', data: { note: 'x'.repeat(5000) } }] }],
    ['a tick without a boolean', { checked: [{ destination: 'daycare', id: 'a', checked: 1 }] }],
    ['too many rows', { items: Array.from({ length: 501 }, (_, i) => ({ id: `i${i}`, data: {} })) }],
  ])('rejects %s', async (_name, body) => {
    const { deviceToken } = await createHousehold();
    expect((await syncAs(deviceToken, body)).status).toBe(400);
  });

  it('writes nothing when any row in the request is invalid', async () => {
    const { deviceToken } = await createHousehold();
    await syncAs(deviceToken, { items: [{ id: 'ok', data: {} }, { id: '../bad', data: {} }] });
    const { json } = await syncAs(deviceToken, { since: 0 });
    expect(json.items).toEqual([]);
  });
});

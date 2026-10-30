import { Hono } from 'hono';
import { requireDevice, type AppEnv } from '../auth';
import { hashToken, randomToken } from '../tokens';

export const household = new Hono<AppEnv>();

function insertDevice(db: D1Database, tokenHash: string, householdId: string): D1PreparedStatement {
  return db
    .prepare('INSERT INTO devices (token_hash, household_id, created_at) VALUES (?, ?, ?)')
    .bind(tokenHash, householdId, Date.now());
}

// Open on purpose: anyone can start a household, and the returned secrets are the only way back in.
household.post('/households', async (c) => {
  const id = crypto.randomUUID();
  const invite = randomToken();
  const deviceToken = randomToken();
  await c.env.DB.batch([
    c.env.DB.prepare('INSERT INTO households (id, invite, created_at) VALUES (?, ?, ?)').bind(id, invite, Date.now()),
    insertDevice(c.env.DB, await hashToken(deviceToken), id),
  ]);
  return c.json({ deviceToken, invite }, 201);
});

household.post('/households/join', async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const invite = typeof body === 'object' && body !== null ? (body as { invite?: unknown }).invite : undefined;
  if (typeof invite !== 'string' || invite === '') return c.json({ error: 'invalid_request' }, 400);

  const row = await c.env.DB.prepare('SELECT id FROM households WHERE invite = ?')
    .bind(invite)
    .first<{ id: string }>();
  if (!row) return c.json({ error: 'invalid_invite' }, 404);

  const deviceToken = randomToken();
  await insertDevice(c.env.DB, await hashToken(deviceToken), row.id).run();
  return c.json({ deviceToken }, 201);
});

household.get('/household', requireDevice, async (c) => {
  const row = await c.env.DB.prepare('SELECT invite FROM households WHERE id = ?')
    .bind(c.get('householdId'))
    .first<{ invite: string }>();
  return row ? c.json({ invite: row.invite }) : c.json({ error: 'not_found' }, 404);
});

// A leaked link is revoked by replacing it; devices already joined keep working.
household.post('/household/invite', requireDevice, async (c) => {
  const invite = randomToken();
  await c.env.DB.prepare('UPDATE households SET invite = ? WHERE id = ?').bind(invite, c.get('householdId')).run();
  return c.json({ invite });
});

// Leaving only forgets this device; the household and its data stay for the others.
household.delete('/device', requireDevice, async (c) => {
  await c.env.DB.prepare('DELETE FROM devices WHERE token_hash = ?').bind(c.get('deviceHash')).run();
  return c.body(null, 204);
});

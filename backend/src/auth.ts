import { createMiddleware } from 'hono/factory';
import { hashToken } from './tokens';

export interface AppEnv {
  Bindings: Env;
  Variables: { householdId: string; deviceHash: string };
}

// The device token is the identity: whoever holds it acts for its household.
export const requireDevice = createMiddleware<AppEnv>(async (c, next) => {
  const match = /^Bearer (\S+)$/.exec(c.req.header('Authorization') ?? '');
  if (!match?.[1]) return c.json({ error: 'unauthorized' }, 401);

  const deviceHash = await hashToken(match[1]);
  const row = await c.env.DB.prepare('SELECT household_id FROM devices WHERE token_hash = ?')
    .bind(deviceHash)
    .first<{ household_id: string }>();
  if (!row) return c.json({ error: 'unauthorized' }, 401);

  c.set('householdId', row.household_id);
  c.set('deviceHash', deviceHash);
  await next();
});

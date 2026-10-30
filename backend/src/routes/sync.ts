import { Hono } from 'hono';
import { requireDevice, type AppEnv } from '../auth';

export const sync = new Hono<AppEnv>();

const MAX_ROWS = 500;
const MAX_ITEM_JSON = 4096;
const ID = /^[\w-]{1,64}$/;

interface ItemWrite {
  id: string;
  // null deletes the item everywhere.
  data: string | null;
}

interface CheckedWrite {
  destination: string;
  id: string;
  checked: boolean;
}

interface SyncRequest {
  since: number;
  items: ItemWrite[];
  checked: CheckedWrite[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseItemWrite(raw: unknown): ItemWrite | null {
  if (!isRecord(raw) || typeof raw.id !== 'string' || !ID.test(raw.id)) return null;
  if (raw.data === null) return { id: raw.id, data: null };
  // Items are stored opaque (the client owns their shape) but must be a bounded JSON object.
  if (!isRecord(raw.data)) return null;
  const data = JSON.stringify(raw.data);
  return data.length <= MAX_ITEM_JSON ? { id: raw.id, data } : null;
}

function parseCheckedWrite(raw: unknown): CheckedWrite | null {
  if (!isRecord(raw)) return null;
  const { destination, id, checked } = raw;
  if (typeof destination !== 'string' || !ID.test(destination)) return null;
  if (typeof id !== 'string' || !ID.test(id) || typeof checked !== 'boolean') return null;
  return { destination, id, checked };
}

function parseList<T>(raw: unknown, parseEntry: (entry: unknown) => T | null): T[] | null {
  if (raw === undefined) return [];
  if (!Array.isArray(raw) || raw.length > MAX_ROWS) return null;
  const result: T[] = [];
  for (const entry of raw) {
    const parsed = parseEntry(entry);
    if (!parsed) return null;
    result.push(parsed);
  }
  return result;
}

function parseRequest(body: unknown): SyncRequest | null {
  if (!isRecord(body)) return null;
  const since = body.since ?? 0;
  if (typeof since !== 'number' || !Number.isInteger(since) || since < 0) return null;
  const items = parseList(body.items, parseItemWrite);
  const checked = parseList(body.checked, parseCheckedWrite);
  return items && checked ? { since, items, checked } : null;
}

interface ItemRow {
  id: string;
  data: string | null;
}

interface CheckedRow {
  destination: string;
  item_id: string;
  checked: number;
}

// Push and pull in one round trip. Writes win unconditionally (last write wins per item and per tick) and
// are stamped with a fresh seq; the reply carries everything stamped after `since`, including the caller's
// own writes, which are harmless to apply again.
sync.post('/sync', requireDevice, async (c) => {
  const request = parseRequest(await c.req.json().catch(() => null));
  if (!request) return c.json({ error: 'invalid_request' }, 400);

  const db = c.env.DB;
  const householdId = c.get('householdId');
  const writes: D1PreparedStatement[] = [];

  if (request.items.length > 0 || request.checked.length > 0) {
    writes.push(db.prepare('UPDATE households SET seq = seq + 1 WHERE id = ?').bind(householdId));
  }
  for (const item of request.items) {
    writes.push(
      db
        .prepare(
          `INSERT INTO items (household_id, id, data, seq)
           VALUES (?1, ?2, ?3, (SELECT seq FROM households WHERE id = ?1))
           ON CONFLICT (household_id, id) DO UPDATE SET data = excluded.data, seq = excluded.seq`,
        )
        .bind(householdId, item.id, item.data),
    );
  }
  for (const tick of request.checked) {
    writes.push(
      db
        .prepare(
          `INSERT INTO checked (household_id, destination, item_id, checked, seq)
           VALUES (?1, ?2, ?3, ?4, (SELECT seq FROM households WHERE id = ?1))
           ON CONFLICT (household_id, destination, item_id) DO UPDATE SET checked = excluded.checked, seq = excluded.seq`,
        )
        .bind(householdId, tick.destination, tick.id, tick.checked ? 1 : 0),
    );
  }

  // One batch is one transaction, so the cursor and the rows read after the writes are consistent.
  const results = await db.batch([
    ...writes,
    db.prepare('SELECT seq FROM households WHERE id = ?').bind(householdId),
    db.prepare('SELECT id, data FROM items WHERE household_id = ? AND seq > ?').bind(householdId, request.since),
    db
      .prepare('SELECT destination, item_id, checked FROM checked WHERE household_id = ? AND seq > ?')
      .bind(householdId, request.since),
  ]);

  const [cursorResult, itemsResult, checkedResult] = results.slice(writes.length);
  const cursor = (cursorResult?.results[0] as { seq: number } | undefined)?.seq ?? 0;
  const items = ((itemsResult?.results ?? []) as unknown as ItemRow[]).map((row) => ({
    id: row.id,
    data: row.data === null ? null : (JSON.parse(row.data) as unknown),
  }));
  const checked = ((checkedResult?.results ?? []) as unknown as CheckedRow[]).map((row) => ({
    destination: row.destination,
    id: row.item_id,
    checked: row.checked === 1,
  }));

  return c.json({ cursor, items, checked });
});

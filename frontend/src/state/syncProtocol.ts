import { DESTINATIONS, byDestination, isDestination, type DestinationId } from './destinations';
import type { Item } from './items';
import type { CheckedState } from './checked';
import { checkedKey, splitCheckedKey, type Pending } from './pending';

export interface ItemWrite {
  id: string;
  data: Item | null;
}

export interface CheckedWrite {
  destination: DestinationId;
  id: string;
  checked: boolean;
}

export interface SyncRequest {
  since: number;
  items: ItemWrite[];
  checked: CheckedWrite[];
}

export interface RemoteChanges {
  items: { id: string; data: unknown }[];
  checked: { destination: string; id: string; checked: boolean }[];
}

export interface SyncResponse extends RemoteChanges {
  cursor: number;
}

// What to push: the current value of everything marked, so an item deleted since is sent as a delete.
export function buildRequest(
  since: number,
  sent: Pending,
  items: readonly Item[],
  checked: CheckedState,
): SyncRequest {
  const byId = new Map(items.map((item) => [item.id, item]));
  return {
    since,
    items: Object.keys(sent.items).map((id) => ({ id, data: byId.get(id) ?? null })),
    checked: Object.keys(sent.checked).flatMap((key) => {
      const parts = splitCheckedKey(key);
      return parts && isDestination(parts.destination)
        ? [{ destination: parts.destination, id: parts.id, checked: checked[parts.destination].has(parts.id) }]
        : [];
    }),
  };
}

export function parseResponse(raw: unknown): SyncResponse | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const { cursor, items, checked } = raw as Record<string, unknown>;
  if (typeof cursor !== 'number' || !Array.isArray(items) || !Array.isArray(checked)) return null;
  return {
    cursor,
    items: items.flatMap((entry: unknown) => {
      const e = entry as { id?: unknown; data?: unknown } | null;
      return typeof e?.id === 'string' ? [{ id: e.id, data: e.data }] : [];
    }),
    checked: checked.flatMap((entry: unknown) => {
      const e = entry as { destination?: unknown; id?: unknown; checked?: unknown } | null;
      return typeof e?.destination === 'string' && typeof e.id === 'string' && typeof e.checked === 'boolean'
        ? [{ destination: e.destination, id: e.id, checked: e.checked }]
        : [];
    }),
  };
}

// Remote wins except where this device has a change still waiting to be pushed: that one is newer and goes
// out next. An item that fails validation is skipped rather than allowed to break the list. Known items keep
// their place; new ones are appended.
export function mergeItems(
  items: readonly Item[],
  remote: RemoteChanges['items'],
  isPending: (id: string) => boolean,
  parse: (id: string, data: unknown) => Item | null,
): Item[] {
  let result = [...items];
  for (const change of remote) {
    if (isPending(change.id)) continue;
    const at = result.findIndex((item) => item.id === change.id);
    const parsed = change.data === null ? null : parse(change.id, change.data);
    if (change.data !== null && !parsed) continue;
    if (parsed === null) result = result.filter((item) => item.id !== change.id);
    else if (at === -1) result.push(parsed);
    else result[at] = parsed;
  }
  return result;
}

export function mergeChecked(
  checked: CheckedState,
  remote: RemoteChanges['checked'],
  isPending: (key: string) => boolean,
): CheckedState {
  const next = byDestination((destination) => new Set(checked[destination]));
  for (const change of remote) {
    if (!isDestination(change.destination) || isPending(checkedKey(change.destination, change.id))) continue;
    if (change.checked) next[change.destination].add(change.id);
    else next[change.destination].delete(change.id);
  }
  return next;
}

// Everything on this device is queued, so a household that starts from it gets the full list.
export function pendingForAll(items: readonly Item[], checked: CheckedState): { items: string[]; checked: string[] } {
  return {
    items: items.map((item) => item.id),
    checked: DESTINATIONS.flatMap((destination) => [...checked[destination]].map((id) => checkedKey(destination, id))),
  };
}

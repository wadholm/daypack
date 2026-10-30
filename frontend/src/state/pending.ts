import { readStorage, writeStorage } from './safeStorage';

export const PENDING_STORAGE_KEY = 'daypack.pending';

// Local changes not yet acknowledged by the server, as key -> version. Only the keys are queued, never the
// values: what gets sent is read from current state at push time, so rapid edits collapse into one write.
// The version tells a push that an entry changed again while it was in flight, so the ack must not drop it.
export interface Pending {
  items: Record<string, number>;
  checked: Record<string, number>;
}

export const checkedKey = (destination: string, id: string): string => `${destination}/${id}`;

export function splitCheckedKey(key: string): { destination: string; id: string } | null {
  const at = key.indexOf('/');
  return at <= 0 ? null : { destination: key.slice(0, at), id: key.slice(at + 1) };
}

function versions(value: unknown): Record<string, number> {
  const result: Record<string, number> = {};
  if (typeof value !== 'object' || value === null) return result;
  for (const [key, version] of Object.entries(value)) {
    if (typeof version === 'number' && Number.isFinite(version)) result[key] = version;
  }
  return result;
}

export function parsePending(raw: string | null): Pending {
  try {
    const parsed: unknown = raw === null ? null : JSON.parse(raw);
    const record = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
    return { items: versions(record.items), checked: versions(record.checked) };
  } catch {
    return { items: {}, checked: {} };
  }
}

export interface PendingStore {
  markItems: (ids: readonly string[]) => void;
  markChecked: (keys: readonly string[]) => void;
  hasItem: (id: string) => boolean;
  hasChecked: (key: string) => boolean;
  isEmpty: () => boolean;
  snapshot: () => Pending;
  // Drops what a push delivered, except entries marked again since it was taken.
  acknowledge: (sent: Pending) => void;
  clear: () => void;
  subscribe: (listener: () => void) => () => void;
}

export function createPendingStore(
  read: () => string | null = () => readStorage(PENDING_STORAGE_KEY),
  write: (value: string) => void = (value) => writeStorage(PENDING_STORAGE_KEY, value),
): PendingStore {
  const state = parsePending(read());
  let counter = Math.max(0, ...Object.values(state.items), ...Object.values(state.checked));
  const listeners = new Set<() => void>();

  const commit = () => {
    write(JSON.stringify(state));
    listeners.forEach((listener) => listener());
  };

  return {
    markItems: (ids) => {
      if (ids.length === 0) return;
      for (const id of ids) state.items[id] = ++counter;
      commit();
    },
    markChecked: (keys) => {
      if (keys.length === 0) return;
      for (const key of keys) state.checked[key] = ++counter;
      commit();
    },
    hasItem: (id) => id in state.items,
    hasChecked: (key) => key in state.checked,
    isEmpty: () => Object.keys(state.items).length === 0 && Object.keys(state.checked).length === 0,
    snapshot: () => ({ items: { ...state.items }, checked: { ...state.checked } }),
    acknowledge: (sent) => {
      for (const [id, version] of Object.entries(sent.items)) if (state.items[id] === version) delete state.items[id];
      for (const [key, version] of Object.entries(sent.checked)) {
        if (state.checked[key] === version) delete state.checked[key];
      }
      commit();
    },
    clear: () => {
      state.items = {};
      state.checked = {};
      commit();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

// The queue the app uses; tests build their own with createPendingStore.
export const pending = createPendingStore();

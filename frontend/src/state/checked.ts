import { useEffect, useState } from 'preact/hooks';
import { DEFAULT_DESTINATION, byDestination, type DestinationId } from './destinations';
import { readStorage, writeStorage } from './safeStorage';

export const CHECKED_STORAGE_KEY = 'daypack.checked';

// Ticks are kept per destination, so switching never wipes what is packed for the other one.
export type CheckedState = Record<DestinationId, ReadonlySet<string>>;

function ids(value: unknown): Set<string> {
  return Array.isArray(value) ? new Set(value.filter((id): id is string => typeof id === 'string')) : new Set();
}

export function emptyChecked(): CheckedState {
  return byDestination(() => new Set<string>());
}

// Anything unreadable in storage means "nothing checked", never a crash. The old format, a plain
// id array from before destinations, belongs to the default destination.
export function parseChecked(raw: string | null): CheckedState {
  const state = emptyChecked();
  if (raw === null) return state;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return { ...state, [DEFAULT_DESTINATION]: ids(parsed) };
    if (typeof parsed !== 'object' || parsed === null) return state;
    const record = parsed as Record<string, unknown>;
    return byDestination((id) => ids(record[id]));
  } catch {
    return state;
  }
}

export function serializeChecked(checked: CheckedState): string {
  return JSON.stringify(byDestination((id) => [...checked[id]]));
}

export function toggleChecked(checked: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(checked);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export function uncheck(checked: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(checked);
  next.delete(id);
  return next;
}

// Only ids in the current list count, so stale stored ids can't push progress past 100%.
export function countPacked(itemIds: readonly string[], checked: ReadonlySet<string>): number {
  return itemIds.filter((id) => checked.has(id)).length;
}

export function progressPercent(packed: number, total: number): number {
  return total === 0 ? 0 : Math.round((packed / total) * 100);
}

export function useChecked(destination: DestinationId): {
  checked: ReadonlySet<string>;
  toggle: (id: string) => void;
  forget: (id: string) => void;
  reset: () => void;
} {
  const [state, setState] = useState<CheckedState>(() => parseChecked(readStorage(CHECKED_STORAGE_KEY)));

  useEffect(() => {
    writeStorage(CHECKED_STORAGE_KEY, serializeChecked(state));
  }, [state]);

  return {
    checked: state[destination],
    toggle: (id) =>
      setState((current) => ({ ...current, [destination]: toggleChecked(current[destination], id) })),
    // Called when a custom item is deleted, so a later item reusing the slug doesn't start ticked anywhere.
    forget: (id) => setState((current) => byDestination((d) => uncheck(current[d], id))),
    // "Reset for tomorrow" only clears the destination being packed for.
    reset: () => setState((current) => ({ ...current, [destination]: new Set() })),
  };
}

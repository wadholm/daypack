import { useEffect, useState } from 'preact/hooks';
import { readStorage, writeStorage } from './safeStorage';

export const CHECKED_STORAGE_KEY = 'daypack.checked';

// Anything unreadable in storage means "nothing checked", never a crash.
export function parseChecked(raw: string | null): Set<string> {
  if (raw === null) return new Set();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

export function serializeChecked(checked: ReadonlySet<string>): string {
  return JSON.stringify([...checked]);
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

export function useChecked(): {
  checked: ReadonlySet<string>;
  toggle: (id: string) => void;
  forget: (id: string) => void;
  reset: () => void;
} {
  const [checked, setChecked] = useState<ReadonlySet<string>>(() =>
    parseChecked(readStorage(CHECKED_STORAGE_KEY)),
  );

  useEffect(() => {
    writeStorage(CHECKED_STORAGE_KEY, serializeChecked(checked));
  }, [checked]);

  return {
    checked,
    toggle: (id) => setChecked((current) => toggleChecked(current, id)),
    // Called when a custom item is deleted, so a later item reusing the slug doesn't start ticked.
    forget: (id) => setChecked((current) => uncheck(current, id)),
    reset: () => setChecked(new Set()),
  };
}

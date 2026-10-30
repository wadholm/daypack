import { readStorage, writeStorage } from './safeStorage';

export const HOUSEHOLD_STORAGE_KEY = 'daypack.household';

// The device token is this device's identity; the cursor is the last server position it has seen, so a
// sync only fetches what changed since.
export interface HouseholdState {
  token: string;
  cursor: number;
}

export function parseHousehold(raw: string | null): HouseholdState | null {
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw) as { token?: unknown; cursor?: unknown } | null;
    if (typeof parsed?.token !== 'string' || parsed.token === '') return null;
    const cursor = typeof parsed.cursor === 'number' && Number.isInteger(parsed.cursor) && parsed.cursor >= 0;
    return { token: parsed.token, cursor: cursor ? (parsed.cursor as number) : 0 };
  } catch {
    return null;
  }
}

export function loadHousehold(): HouseholdState | null {
  return parseHousehold(readStorage(HOUSEHOLD_STORAGE_KEY));
}

export function saveHousehold(state: HouseholdState | null): void {
  // Leaving writes an empty marker, which parseHousehold reads back as "not in a household".
  writeStorage(HOUSEHOLD_STORAGE_KEY, state ? JSON.stringify(state) : '');
}

// The invite rides in the URL fragment, which browsers never send to a server, so it stays out of logs.
export function inviteLink(origin: string, invite: string): string {
  return `${origin}/#join=${encodeURIComponent(invite)}`;
}

export function parseJoinHash(hash: string): string | null {
  const match = /^#join=([^&]+)$/.exec(hash);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

// Accepts a pasted link or the bare code.
export function parseInviteInput(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  const hashAt = trimmed.indexOf('#');
  if (hashAt === -1) return /^[\w-]+$/.test(trimmed) ? trimmed : null;
  return parseJoinHash(trimmed.slice(hashAt));
}

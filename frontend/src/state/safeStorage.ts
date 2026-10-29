// localStorage can throw (private mode, blocked site data), so every access goes through here.
export function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Persistence is best-effort; the app keeps working in memory.
  }
}

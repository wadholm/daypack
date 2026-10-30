function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// 32 random bytes (256 bits): the invite and device tokens are bearer secrets, so they must be unguessable.
export function randomToken(): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(32)));
}

// Device tokens are stored hashed; they are high-entropy, so a plain SHA-256 is enough (no salt or stretching).
export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return base64Url(new Uint8Array(digest));
}

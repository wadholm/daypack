import type { SyncRequest } from './syncProtocol';

export interface ApiAnswer {
  status: number;
  json: unknown;
}

// Resolves to null when the network fails, so callers treat "offline" and "server said no" differently.
async function request(path: string, init: { method?: string; token?: string; body?: unknown } = {}): Promise<ApiAnswer | null> {
  try {
    const response = await fetch(`/api${path}`, {
      method: init.method ?? 'GET',
      headers: {
        ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
        ...(init.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
    });
    return { status: response.status, json: await response.json().catch(() => null) };
  } catch {
    return null;
  }
}

function stringField(answer: ApiAnswer | null, field: string, okStatus: number): string | null {
  if (answer?.status !== okStatus || typeof answer.json !== 'object' || answer.json === null) return null;
  const value = (answer.json as Record<string, unknown>)[field];
  return typeof value === 'string' ? value : null;
}

export const postSync = (token: string, body: SyncRequest) => request('/sync', { method: 'POST', token, body });

export async function createHousehold(): Promise<{ deviceToken: string; invite: string } | null> {
  const answer = await request('/households', { method: 'POST' });
  const deviceToken = stringField(answer, 'deviceToken', 201);
  const invite = stringField(answer, 'invite', 201);
  return deviceToken && invite ? { deviceToken, invite } : null;
}

export type JoinResult = { kind: 'joined'; deviceToken: string } | { kind: 'invalid' } | { kind: 'failed' };

export async function joinHousehold(invite: string): Promise<JoinResult> {
  const answer = await request('/households/join', { method: 'POST', body: { invite } });
  const deviceToken = stringField(answer, 'deviceToken', 201);
  if (deviceToken) return { kind: 'joined', deviceToken };
  return answer?.status === 404 ? { kind: 'invalid' } : { kind: 'failed' };
}

export async function fetchInvite(token: string): Promise<string | null> {
  return stringField(await request('/household', { token }), 'invite', 200);
}

export async function regenerateInvite(token: string): Promise<string | null> {
  return stringField(await request('/household/invite', { method: 'POST', token }), 'invite', 200);
}

export async function leaveHousehold(token: string): Promise<void> {
  await request('/device', { method: 'DELETE', token });
}

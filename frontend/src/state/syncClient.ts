import type { CheckedState } from './checked';
import type { Item } from './items';
import type { PendingStore } from './pending';
import { buildRequest, parseResponse, type RemoteChanges, type SyncRequest } from './syncProtocol';

export interface SyncDeps {
  // null means the request never got an answer (offline, DNS, Worker down).
  post: (body: SyncRequest) => Promise<{ status: number; json: unknown } | null>;
  pending: PendingStore;
  getItems: () => readonly Item[];
  getChecked: () => CheckedState;
  applyRemote: (changes: RemoteChanges) => void;
}

export type SyncResult = { kind: 'ok'; cursor: number } | { kind: 'unauthorized' } | { kind: 'failed' };

// One push-and-pull round. Pending entries are only dropped once the server has answered, so a failed
// round loses nothing and the next one resends it.
export async function syncOnce(since: number, deps: SyncDeps): Promise<SyncResult> {
  const sent = deps.pending.snapshot();
  const answer = await deps.post(buildRequest(since, sent, deps.getItems(), deps.getChecked()));
  if (!answer) return { kind: 'failed' };
  if (answer.status === 401) return { kind: 'unauthorized' };
  const response = answer.status === 200 ? parseResponse(answer.json) : null;
  if (!response) return { kind: 'failed' };

  deps.pending.acknowledge(sent);
  deps.applyRemote(response);
  return { kind: 'ok', cursor: response.cursor };
}

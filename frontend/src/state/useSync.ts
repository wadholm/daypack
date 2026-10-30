import { useEffect, useRef, useState } from 'preact/hooks';
import {
  createHousehold,
  fetchInvite,
  joinHousehold,
  leaveHousehold,
  postSync,
  regenerateInvite,
} from './api';
import { emptyChecked, type CheckedState } from './checked';
import { loadHousehold, saveHousehold, type HouseholdState } from './household';
import type { Item } from './items';
import { pending } from './pending';
import { syncOnce } from './syncClient';
import { mergeChecked, mergeItems, parseResponse, pendingForAll, type RemoteChanges } from './syncProtocol';
import { parseRemoteItem } from './items';

// 'idle' is in sync as far as we know; 'offline' means the last round got no answer and will be retried.
export type SyncStatus = 'idle' | 'syncing' | 'offline';

export type JoinOutcome = 'joined' | 'invalid' | 'failed';

const POLL_MS = 20_000;
// Waits out a burst of taps (a stepper, a reset) so they go out as one request.
const PUSH_DELAY_MS = 700;

export interface SyncTarget {
  getItems: () => readonly Item[];
  getChecked: () => CheckedState;
  applyRemote: (changes: RemoteChanges) => void;
  replaceAll: (items: readonly Item[], checked: CheckedState) => void;
}

export interface Sync {
  connected: boolean;
  status: SyncStatus;
  create: () => Promise<string | null>;
  join: (invite: string) => Promise<JoinOutcome>;
  leave: () => Promise<void>;
  loadInvite: () => Promise<string | null>;
  newInvite: () => Promise<string | null>;
}

export function useSync(target: SyncTarget): Sync {
  const [household, setHousehold] = useState<HouseholdState | null>(loadHousehold);
  const [status, setStatus] = useState<SyncStatus>('idle');
  // Rounds are chained through refs because callbacks (timers, events) outlive any one render.
  const householdRef = useRef(household);
  const targetRef = useRef(target);
  targetRef.current = target;
  const running = useRef(false);
  const rerun = useRef(false);

  const store = (next: HouseholdState | null) => {
    householdRef.current = next;
    saveHousehold(next);
    setHousehold(next);
  };

  const run = async (): Promise<void> => {
    if (!householdRef.current) return;
    if (running.current) {
      rerun.current = true;
      return;
    }
    running.current = true;
    setStatus('syncing');
    try {
      do {
        rerun.current = false;
        const current = householdRef.current;
        if (!current) break;
        const result = await syncOnce(current.cursor, {
          post: (body) => postSync(current.token, body),
          pending,
          getItems: () => targetRef.current.getItems(),
          getChecked: () => targetRef.current.getChecked(),
          applyRemote: (changes) => targetRef.current.applyRemote(changes),
        });
        if (result.kind === 'ok') {
          // Persist the cursor only after the changes it covers were applied.
          store({ token: current.token, cursor: result.cursor });
          setStatus('idle');
        } else if (result.kind === 'unauthorized') {
          // The device was removed (or the token is gone): carry on as a local-only list.
          store(null);
          pending.clear();
          setStatus('idle');
          break;
        } else {
          setStatus('offline');
          break;
        }
      } while (rerun.current);
    } finally {
      running.current = false;
    }
  };

  const runRef = useRef(run);
  runRef.current = run;
  const connected = household !== null;

  useEffect(() => {
    if (!connected) return;
    const sync = () => void runRef.current();
    const onVisible = () => {
      if (document.visibilityState === 'visible') sync();
    };
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = pending.subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(sync, PUSH_DELAY_MS);
    });
    const poll = setInterval(onVisible, POLL_MS);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', sync);
    window.addEventListener('online', sync);
    sync();
    return () => {
      unsubscribe();
      clearTimeout(timer);
      clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', sync);
      window.removeEventListener('online', sync);
    };
  }, [connected]);

  return {
    connected,
    status,

    // Starts a household from what is on this device: everything is queued, so the first round uploads it.
    create: async () => {
      const created = await createHousehold();
      if (!created) return null;
      const { getItems, getChecked } = targetRef.current;
      const all = pendingForAll(getItems(), getChecked());
      pending.clear();
      pending.markItems(all.items);
      pending.markChecked(all.checked);
      store({ token: created.deviceToken, cursor: 0 });
      return created.invite;
    },

    // Joining replaces this device's list with the household's: the two were never meant to be merged.
    join: async (invite) => {
      const joined = await joinHousehold(invite);
      if (joined.kind !== 'joined') return joined.kind;
      const answer = await postSync(joined.deviceToken, { since: 0, items: [], checked: [] });
      const response = answer?.status === 200 ? parseResponse(answer.json) : null;
      if (!response) {
        await leaveHousehold(joined.deviceToken);
        return 'failed';
      }
      pending.clear();
      targetRef.current.replaceAll(
        mergeItems([], response.items, () => false, parseRemoteItem),
        mergeChecked(emptyChecked(), response.checked, () => false),
      );
      store({ token: joined.deviceToken, cursor: response.cursor });
      return 'joined';
    },

    // The data stays on this device as a plain local list.
    leave: async () => {
      const current = householdRef.current;
      store(null);
      pending.clear();
      if (current) await leaveHousehold(current.token);
    },

    loadInvite: async () => (householdRef.current ? fetchInvite(householdRef.current.token) : null),
    newInvite: async () => (householdRef.current ? regenerateInvite(householdRef.current.token) : null),
  };
}

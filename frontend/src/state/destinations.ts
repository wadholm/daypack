import { useState } from 'preact/hooks';
import type { TranslationKey } from '../i18n/en';
import { readStorage, writeStorage } from './safeStorage';

export const DESTINATION_STORAGE_KEY = 'daypack.destination';

// Ids are persisted inside items and checked state, so never rename one; only the labels (destination_*) are
// user-facing. 'grandparents' is shown as Mälarhöjden.
export const DESTINATIONS = ['daycare', 'grandparents'] as const;
export type DestinationId = (typeof DESTINATIONS)[number];

export const DEFAULT_DESTINATION: DestinationId = 'daycare';

export const DESTINATION_KEYS: Record<DestinationId, TranslationKey> = {
  daycare: 'destination_daycare',
  grandparents: 'destination_grandparents',
};

// Spelled out because the sv preposition differs per place ("På dagis", "Hos ...").
export const VIEW_AT_KEYS: Record<DestinationId, TranslationKey> = {
  daycare: 'viewAt_daycare',
  grandparents: 'viewAt_grandparents',
};

export function isDestination(value: unknown): value is DestinationId {
  return typeof value === 'string' && (DESTINATIONS as readonly string[]).includes(value);
}

// One value per destination, e.g. how many are wanted or already there.
export type PerDestination = Record<DestinationId, number>;

// The one place that spells out every destination, so a new one is a compile error here and nowhere else.
export function byDestination<T>(valueFor: (id: DestinationId) => T): Record<DestinationId, T> {
  return { daycare: valueFor('daycare'), grandparents: valueFor('grandparents') };
}

export function perDestination(value: number): PerDestination {
  return byDestination(() => value);
}

export function parseDestination(value: string | null): DestinationId {
  return isDestination(value) ? value : DEFAULT_DESTINATION;
}

export function useDestination(): { destination: DestinationId; setDestination: (id: DestinationId) => void } {
  const [destination, setState] = useState<DestinationId>(() =>
    parseDestination(readStorage(DESTINATION_STORAGE_KEY)),
  );

  const setDestination = (next: DestinationId) => {
    writeStorage(DESTINATION_STORAGE_KEY, next);
    setState(next);
  };

  return { destination, setDestination };
}

import type { Item } from '../state/items';
import type { TranslationKey } from './en';

// Spelled out so the key lookup stays type-checked instead of building keys from strings.
const BUILTIN_LABEL_KEYS: Record<string, TranslationKey> = {
  diapers: 'item_diapers',
  pacifier: 'item_pacifier',
  'cuddly-toy': 'item_cuddly-toy',
  'spare-clothes': 'item_spare-clothes',
  'rain-gear': 'item_rain-gear',
  'water-bottle': 'item_water-bottle',
  'sun-hat': 'item_sun-hat',
};

export function itemLabel(item: Item, t: (key: TranslationKey) => string): string {
  if (!item.builtin) return item.label ?? item.id;
  const key = BUILTIN_LABEL_KEYS[item.id];
  return key ? t(key) : item.id;
}

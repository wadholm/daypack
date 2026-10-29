import { catalogueEntry } from '../state/catalogue';
import type { Item } from '../state/items';
import type { TranslationKey } from './en';

export function itemLabel(item: Item, t: (key: TranslationKey) => string): string {
  if (!item.builtin) return item.label ?? item.id;
  const entry = catalogueEntry(item.id);
  return entry ? t(entry.labelKey) : item.id;
}

import type { TranslationKey } from '../i18n/en';
import type { IconId } from '../icons/iconIds';
import type { Hue } from './items';

// Display order of the groups on the list.
export const CATEGORIES = ['clothing', 'hygiene', 'feeding', 'comfort', 'weather', 'other'] as const;
export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value);
}

export const TEMPLATES = ['warm', 'cold'] as const;
export type TemplateId = (typeof TEMPLATES)[number];

export interface CatalogueEntry {
  id: string;
  hue: Hue;
  icon: IconId;
  category: Category;
  // Spelled out so the dictionary lookup stays type-checked.
  labelKey: TranslationKey;
}

// Catalogue ids are persisted as item ids, so never rename one.
export const CATALOGUE: readonly CatalogueEntry[] = [
  { id: 'diapers', hue: 'yellow', icon: 'diapers', category: 'hygiene', labelKey: 'item_diapers' },
  { id: 'pacifier', hue: 'sky', icon: 'pacifier', category: 'comfort', labelKey: 'item_pacifier' },
  { id: 'cuddly-toy', hue: 'pink', icon: 'cuddly-toy', category: 'comfort', labelKey: 'item_cuddly-toy' },
  { id: 'spare-clothes', hue: 'mint', icon: 'spare-clothes', category: 'clothing', labelKey: 'item_spare-clothes' },
  { id: 'shirt', hue: 'mint', icon: 'spare-clothes', category: 'clothing', labelKey: 'item_shirt' },
  { id: 'shorts', hue: 'peach', icon: 'spare-clothes', category: 'clothing', labelKey: 'item_shorts' },
  { id: 'pants', hue: 'sky', icon: 'spare-clothes', category: 'clothing', labelKey: 'item_pants' },
  { id: 'sweater', hue: 'lavender', icon: 'spare-clothes', category: 'clothing', labelKey: 'item_sweater' },
  { id: 'socks', hue: 'pink', icon: 'socks', category: 'clothing', labelKey: 'item_socks' },
  { id: 'mittens', hue: 'peach', icon: 'beanie', category: 'clothing', labelKey: 'item_mittens' },
  { id: 'winter-overalls', hue: 'sky', icon: 'spare-clothes', category: 'clothing', labelKey: 'item_winter-overalls' },
  { id: 'rain-gear', hue: 'lavender', icon: 'rain-gear', category: 'weather', labelKey: 'item_rain-gear' },
  { id: 'rubber-boots', hue: 'sea', icon: 'shoe', category: 'weather', labelKey: 'item_rubber-boots' },
  { id: 'warm-hat', hue: 'lavender', icon: 'beanie', category: 'weather', labelKey: 'item_warm-hat' },
  { id: 'sun-hat', hue: 'peach', icon: 'sun-hat', category: 'weather', labelKey: 'item_sun-hat' },
  { id: 'sunscreen', hue: 'yellow', icon: 'sun-hat', category: 'weather', labelKey: 'item_sunscreen' },
  { id: 'water-bottle', hue: 'sea', icon: 'water-bottle', category: 'feeding', labelKey: 'item_water-bottle' },
];

const BY_ID = new Map(CATALOGUE.map((entry) => [entry.id, entry]));

export function catalogueEntry(id: string): CatalogueEntry | undefined {
  return BY_ID.get(id);
}

// What a fresh install starts with; the other catalogue entries arrive through templates.
export const SEED_IDS: readonly string[] = [
  'diapers',
  'pacifier',
  'cuddly-toy',
  'spare-clothes',
  'rain-gear',
  'water-bottle',
  'sun-hat',
];

// Weather-specific items only, with no overlap, so switching one weather off never hides what another needs.
export const TEMPLATE_ITEM_IDS: Record<TemplateId, readonly string[]> = {
  warm: ['shirt', 'shorts', 'sun-hat', 'sunscreen'],
  cold: ['sweater', 'pants', 'socks', 'rain-gear', 'rubber-boots', 'warm-hat', 'mittens', 'winter-overalls'],
};

import type { TranslationKey } from '../i18n/en';
import type { IconId } from '../icons/iconIds';
import type { Hue } from './items';

// Display order of the groups on the list.
export const CATEGORIES = ['clothing', 'sleep', 'hygiene', 'feeding', 'comfort', 'weather', 'swim', 'other'] as const;
export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value);
}

export const TEMPLATES = ['warm', 'cold', 'overnight', 'swim'] as const;
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
  { id: 'socks', hue: 'pink', icon: 'socks', category: 'clothing', labelKey: 'item_socks' },
  { id: 'shirt', hue: 'mint', icon: 'spare-clothes', category: 'clothing', labelKey: 'item_shirt' },
  { id: 'shorts', hue: 'peach', icon: 'spare-clothes', category: 'clothing', labelKey: 'item_shorts' },
  { id: 'pants', hue: 'sky', icon: 'spare-clothes', category: 'clothing', labelKey: 'item_pants' },
  { id: 'sweater', hue: 'lavender', icon: 'spare-clothes', category: 'clothing', labelKey: 'item_sweater' },
  { id: 'mittens', hue: 'peach', icon: 'beanie', category: 'clothing', labelKey: 'item_mittens' },
  { id: 'winter-overalls', hue: 'sky', icon: 'spare-clothes', category: 'clothing', labelKey: 'item_winter-overalls' },
  { id: 'uv-clothes', hue: 'yellow', icon: 'spare-clothes', category: 'clothing', labelKey: 'item_uv-clothes' },
  { id: 'bodysuits', hue: 'mint', icon: 'spare-clothes', category: 'clothing', labelKey: 'item_bodysuits' },
  { id: 'pyjamas', hue: 'lavender', icon: 'spare-clothes', category: 'sleep', labelKey: 'item_pyjamas' },
  { id: 'travel-cot', hue: 'sea', icon: 'blanket', category: 'sleep', labelKey: 'item_travel-cot' },
  { id: 'cot-sheet', hue: 'sky', icon: 'blanket', category: 'sleep', labelKey: 'item_cot-sheet' },
  { id: 'sleeping-bag', hue: 'lavender', icon: 'blanket', category: 'sleep', labelKey: 'item_sleeping-bag' },
  { id: 'blanket', hue: 'pink', icon: 'blanket', category: 'sleep', labelKey: 'item_blanket' },
  { id: 'night-light', hue: 'yellow', icon: 'star', category: 'sleep', labelKey: 'item_night-light' },
  { id: 'bedtime-books', hue: 'peach', icon: 'book', category: 'sleep', labelKey: 'item_bedtime-books' },
  { id: 'wet-wipes', hue: 'sky', icon: 'diapers', category: 'hygiene', labelKey: 'item_wet-wipes' },
  { id: 'toiletry-bag', hue: 'mint', icon: 'heart', category: 'hygiene', labelKey: 'item_toiletry-bag' },
  { id: 'washcloths', hue: 'sea', icon: 'heart', category: 'hygiene', labelKey: 'item_washcloths' },
  { id: 'toothbrush', hue: 'pink', icon: 'heart', category: 'hygiene', labelKey: 'item_toothbrush' },
  { id: 'rehydration', hue: 'peach', icon: 'heart', category: 'hygiene', labelKey: 'item_rehydration' },
  { id: 'water-bottle', hue: 'sea', icon: 'water-bottle', category: 'feeding', labelKey: 'item_water-bottle' },
  { id: 'formula', hue: 'yellow', icon: 'water-bottle', category: 'feeding', labelKey: 'item_formula' },
  { id: 'baby-bottles', hue: 'sky', icon: 'water-bottle', category: 'feeding', labelKey: 'item_baby-bottles' },
  { id: 'food-pouches', hue: 'mint', icon: 'snack', category: 'feeding', labelKey: 'item_food-pouches' },
  { id: 'snack', hue: 'peach', icon: 'snack', category: 'feeding', labelKey: 'item_snack' },
  { id: 'spoons', hue: 'lavender', icon: 'snack', category: 'feeding', labelKey: 'item_spoons' },
  { id: 'bib', hue: 'pink', icon: 'snack', category: 'feeding', labelKey: 'item_bib' },
  { id: 'rain-gear', hue: 'lavender', icon: 'rain-gear', category: 'weather', labelKey: 'item_rain-gear' },
  { id: 'rubber-boots', hue: 'sea', icon: 'shoe', category: 'weather', labelKey: 'item_rubber-boots' },
  { id: 'warm-hat', hue: 'lavender', icon: 'beanie', category: 'weather', labelKey: 'item_warm-hat' },
  { id: 'sun-hat', hue: 'peach', icon: 'sun-hat', category: 'weather', labelKey: 'item_sun-hat' },
  { id: 'sunscreen', hue: 'yellow', icon: 'sun-hat', category: 'weather', labelKey: 'item_sunscreen' },
  { id: 'sunglasses', hue: 'sky', icon: 'star', category: 'weather', labelKey: 'item_sunglasses' },
  { id: 'swim-trunks', hue: 'sky', icon: 'spare-clothes', category: 'swim', labelKey: 'item_swim-trunks' },
  { id: 'swim-diaper', hue: 'sea', icon: 'diapers', category: 'swim', labelKey: 'item_swim-diaper' },
  { id: 'bathrobe', hue: 'lavender', icon: 'spare-clothes', category: 'swim', labelKey: 'item_bathrobe' },
  { id: 'towel', hue: 'mint', icon: 'blanket', category: 'swim', labelKey: 'item_towel' },
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
  'socks',
  'rain-gear',
  'water-bottle',
  'sun-hat',
];

// Each template owns its items and none overlap, so switching one off never hides what another needs.
// Everyday items (diapers, socks, water bottle) stay out of every template for the same reason.
export const TEMPLATE_ITEM_IDS: Record<TemplateId, readonly string[]> = {
  warm: ['shirt', 'shorts', 'sun-hat', 'sunscreen', 'uv-clothes', 'sunglasses'],
  cold: ['sweater', 'pants', 'rain-gear', 'rubber-boots', 'warm-hat', 'mittens', 'winter-overalls'],
  overnight: [
    'travel-cot', 'cot-sheet', 'sleeping-bag', 'blanket', 'night-light', 'bedtime-books', 'pyjamas', 'bodysuits',
    'toiletry-bag', 'washcloths', 'toothbrush', 'rehydration', 'wet-wipes',
    'formula', 'baby-bottles', 'food-pouches', 'snack', 'spoons', 'bib',
  ],
  swim: ['swim-trunks', 'swim-diaper', 'bathrobe', 'towel'],
};

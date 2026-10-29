// The first seven double as the built-in items' icons; the rest are generic picks for custom items.
export const ICON_IDS = [
  'diapers',
  'pacifier',
  'cuddly-toy',
  'spare-clothes',
  'rain-gear',
  'water-bottle',
  'sun-hat',
  'star',
  'heart',
  'book',
  'socks',
  'snack',
  'blanket',
] as const;

export type IconId = (typeof ICON_IDS)[number];

export function isIconId(value: unknown): value is IconId {
  return typeof value === 'string' && (ICON_IDS as readonly string[]).includes(value);
}

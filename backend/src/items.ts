export const LANGS = ['en', 'sv'] as const;
export type Lang = (typeof LANGS)[number];

export type Hue = 'yellow' | 'sky' | 'pink' | 'mint' | 'peach' | 'lavender' | 'sea';

export interface Item {
  id: string;
  hue: Hue;
  label: string;
}

interface SeedItem {
  id: string;
  hue: Hue;
  labels: Record<Lang, string>;
}

const SEED_ITEMS: readonly SeedItem[] = [
  { id: 'diapers', hue: 'yellow', labels: { en: 'Diapers', sv: 'Blöjor' } },
  { id: 'pacifier', hue: 'sky', labels: { en: 'Pacifier', sv: 'Napp' } },
  { id: 'cuddly-toy', hue: 'pink', labels: { en: 'Cuddly toy', sv: 'Gosedjur' } },
  { id: 'spare-clothes', hue: 'mint', labels: { en: 'Spare clothes', sv: 'Extrakläder' } },
  { id: 'rain-gear', hue: 'lavender', labels: { en: 'Rain gear', sv: 'Regnkläder' } },
  { id: 'water-bottle', hue: 'sea', labels: { en: 'Water bottle', sv: 'Vattenflaska' } },
  { id: 'sun-hat', hue: 'peach', labels: { en: 'Sun hat', sv: 'Solhatt' } },
];

export function parseLang(value: string | undefined): Lang {
  return LANGS.find((lang) => lang === value) ?? 'en';
}

export function getItems(lang: Lang): Item[] {
  return SEED_ITEMS.map(({ id, hue, labels }) => ({ id, hue, label: labels[lang] }));
}

import type { Category } from '../state/catalogue';
import type { TranslationKey } from './en';

export const CATEGORY_KEYS: Record<Category, TranslationKey> = {
  clothing: 'category_clothing',
  sleep: 'category_sleep',
  hygiene: 'category_hygiene',
  feeding: 'category_feeding',
  comfort: 'category_comfort',
  weather: 'category_weather',
  outing: 'category_outing',
  swim: 'category_swim',
  other: 'category_other',
};

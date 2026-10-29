import type { Category } from '../state/catalogue';
import type { TranslationKey } from './en';

export const CATEGORY_KEYS: Record<Category, TranslationKey> = {
  clothing: 'category_clothing',
  hygiene: 'category_hygiene',
  feeding: 'category_feeding',
  comfort: 'category_comfort',
  weather: 'category_weather',
  other: 'category_other',
};

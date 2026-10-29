import { en, type Dictionary, type TranslationKey } from './en';
import { sv } from './sv';

export type Lang = 'en' | 'sv';

export const LANG_STORAGE_KEY = 'daypack.lang';
export const LANGS: readonly Lang[] = ['en', 'sv'];

export const dictionaries: Record<Lang, Dictionary> = { en, sv };

export function parseLang(value: string | null): Lang | null {
  return LANGS.find((lang) => lang === value) ?? null;
}

export function detectLang(navigatorLanguage: string): Lang {
  return navigatorLanguage.toLowerCase().startsWith('sv') ? 'sv' : 'en';
}

export function initialLang(stored: string | null, navigatorLanguage: string): Lang {
  return parseLang(stored) ?? detectLang(navigatorLanguage);
}

export function translate(
  lang: Lang,
  key: TranslationKey,
  vars: Record<string, string | number> = {},
): string {
  return dictionaries[lang][key].replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    String(vars[name] ?? placeholder),
  );
}

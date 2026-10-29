import { describe, expect, it } from 'vitest';
import { en } from './en';
import { detectLang, dictionaries, initialLang, parseLang, translate } from './lang';

describe('dictionaries', () => {
  it('has exactly the same keys in en and sv', () => {
    expect(Object.keys(dictionaries.sv).sort()).toEqual(Object.keys(en).sort());
  });

  it('keeps the same placeholders in every language', () => {
    const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(placeholders(dictionaries.sv[key])).toEqual(placeholders(en[key]));
    }
  });
});

describe('language detection', () => {
  it('maps sv locales to Swedish and everything else to English', () => {
    expect(detectLang('sv')).toBe('sv');
    expect(detectLang('sv-SE')).toBe('sv');
    expect(detectLang('en-US')).toBe('en');
    expect(detectLang('de')).toBe('en');
  });

  it('prefers a valid stored choice over the browser language', () => {
    expect(initialLang('en', 'sv-SE')).toBe('en');
    expect(initialLang('sv', 'en-US')).toBe('sv');
  });

  it('ignores an invalid stored value', () => {
    expect(parseLang('fr')).toBeNull();
    expect(initialLang('fr', 'sv-SE')).toBe('sv');
    expect(initialLang(null, 'en-GB')).toBe('en');
  });
});

describe('translate', () => {
  it('fills placeholders', () => {
    expect(translate('en', 'packedCount', { packed: 2, total: 7 })).toBe('2 of 7 packed');
    expect(translate('sv', 'packedCount', { packed: 2, total: 7 })).toBe('2 av 7 packade');
  });
});

// en.ts is the source of truth for dictionary keys; sv.ts must match it exactly (see Dictionary).
export const en = {
  dateLocale: 'en-GB',
  wordmark: 'daypack',
  title: "Today's packing list",
  packedCount: '{packed} of {total} packed',
  reset: 'Reset for tomorrow',
  themeLabel: 'Theme: {mode}',
  themeSystem: 'System',
  themeLight: 'Light',
  themeDark: 'Dark',
  languageLabel: 'Language',
  languageEnglish: 'English',
  languageSwedish: 'Swedish',
  loading: 'Loading your list…',
  loadError: "Couldn't load the list",
  retry: 'Try again',
};

export type Dictionary = { [K in keyof typeof en]: string };
export type TranslationKey = keyof Dictionary;

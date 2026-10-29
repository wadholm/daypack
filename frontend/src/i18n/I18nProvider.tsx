import { createContext, type ComponentChildren } from 'preact';
import { useContext, useEffect, useMemo, useState } from 'preact/hooks';
import { readStorage, writeStorage } from '../state/safeStorage';
import type { TranslationKey } from './en';
import { LANG_STORAGE_KEY, initialLang, translate, type Lang } from './lang';

type TranslateFn = (key: TranslationKey, vars?: Record<string, string | number>) => string;

interface I18n {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: TranslateFn;
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ComponentChildren }) {
  const [lang, setLangState] = useState<Lang>(() =>
    initialLang(readStorage(LANG_STORAGE_KEY), navigator.language),
  );

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<I18n>(
    () => ({
      lang,
      setLang: (next) => {
        writeStorage(LANG_STORAGE_KEY, next);
        setLangState(next);
      },
      t: (key, vars) => translate(lang, key, vars),
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}

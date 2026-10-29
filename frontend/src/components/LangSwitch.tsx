import { css } from '../../styled-system/css';
import { useI18n } from '../i18n/I18nProvider';
import { LANGS, type Lang } from '../i18n/lang';
import type { TranslationKey } from '../i18n/en';

const LANG_NAME_KEYS: Record<Lang, TranslationKey> = {
  en: 'languageEnglish',
  sv: 'languageSwedish',
};

const groupStyle = css({
  display: 'inline-flex',
  alignItems: 'center',
  height: 'chip',
  padding: 'chipInset',
  borderRadius: 'full',
  bg: 'chip',
});

const segmentStyle = css({
  position: 'relative',
  minWidth: 'segment',
  height: 'full',
  border: 'none',
  borderRadius: 'full',
  bg: 'transparent',
  color: 'text',
  fontFamily: 'body',
  fontSize: 'pill',
  fontWeight: 'bold',
  cursor: 'pointer',
  // Grows the tap area to tapTarget without growing the visible pill.
  '&::after': { content: '""', position: 'absolute', insetBlock: '-3', insetInline: '-1' },
  '&[aria-pressed=true]': { bg: 'brand', color: 'onBrand' },
});

export function LangSwitch() {
  const { lang, setLang, t } = useI18n();

  return (
    <div class={groupStyle} role="group" aria-label={t('languageLabel')}>
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          class={segmentStyle}
          aria-pressed={code === lang}
          aria-label={t(LANG_NAME_KEYS[code])}
          onClick={() => setLang(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

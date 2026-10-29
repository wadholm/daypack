import { css } from '../styled-system/css';
import { LangSwitch } from './components/LangSwitch';
import { ThemeButton } from './components/ThemeButton';
import { useI18n } from './i18n/I18nProvider';
import type { TranslationKey } from './i18n/en';
import { useTheme, type ThemePref } from './state/theme';

const THEME_NAME_KEYS: Record<ThemePref, TranslationKey> = {
  system: 'themeSystem',
  light: 'themeLight',
  dark: 'themeDark',
};

export function App() {
  const { t } = useI18n();
  const { pref, setPref } = useTheme();

  return (
    <main class={css({ display: 'flex', alignItems: 'center', gap: '4', padding: '4' })}>
      {t('wordmark')}
      <LangSwitch />
      <ThemeButton pref={pref} label={t('themeLabel', { mode: t(THEME_NAME_KEYS[pref]) })} onChange={setPref} />
    </main>
  );
}

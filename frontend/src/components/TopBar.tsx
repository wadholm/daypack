import { css } from '../../styled-system/css';
import { useI18n } from '../i18n/I18nProvider';
import type { TranslationKey } from '../i18n/en';
import { LogoIcon } from '../icons/LogoIcon';
import { useTheme, type ThemePref } from '../state/theme';
import { LangSwitch } from './LangSwitch';
import { ThemeButton } from './ThemeButton';

const THEME_NAME_KEYS: Record<ThemePref, TranslationKey> = {
  system: 'themeSystem',
  light: 'themeLight',
  dark: 'themeDark',
};

const barStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  minHeight: 'tapTarget',
  paddingInline: '5',
});

const brandStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  color: 'brand',
  fontSize: 'wordmark',
  fontWeight: 'bold',
  letterSpacing: 'wordmark',
});

const controlsStyle = css({ display: 'flex', alignItems: 'center', gap: '2' });

export function TopBar() {
  const { t } = useI18n();
  const { pref, setPref } = useTheme();

  return (
    <div class={barStyle}>
      <div class={brandStyle}>
        <LogoIcon />
        <span>{t('wordmark')}</span>
      </div>
      <div class={controlsStyle}>
        <LangSwitch />
        <ThemeButton
          pref={pref}
          label={t('themeLabel', { mode: t(THEME_NAME_KEYS[pref]) })}
          onChange={setPref}
        />
      </div>
    </div>
  );
}

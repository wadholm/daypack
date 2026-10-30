import { css } from '../../styled-system/css';
import { useI18n } from '../i18n/I18nProvider';

export type View = 'pack' | 'daycare';

const groupStyle = css({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  marginInline: '4',
  marginBottom: '4',
  padding: 'chipInset',
  borderRadius: 'full',
  bg: 'chip',
});

const segmentStyle = css({
  minHeight: 'tapTarget',
  border: 'none',
  borderRadius: 'full',
  bg: 'transparent',
  color: 'text',
  fontFamily: 'body',
  fontSize: 'meta',
  fontWeight: 'bold',
  cursor: 'pointer',
  '&[aria-pressed=true]': { bg: 'brand', color: 'onBrand' },
});

interface ViewSwitchProps {
  view: View;
  onChange: (view: View) => void;
}

export function ViewSwitch({ view, onChange }: ViewSwitchProps) {
  const { t } = useI18n();

  return (
    <div class={groupStyle} role="group" aria-label={t('viewLabel')}>
      <button type="button" class={segmentStyle} aria-pressed={view === 'pack'} onClick={() => onChange('pack')}>
        {t('viewPack')}
      </button>
      <button
        type="button"
        class={segmentStyle}
        aria-pressed={view === 'daycare'}
        onClick={() => onChange('daycare')}
      >
        {t('viewDaycare')}
      </button>
    </div>
  );
}

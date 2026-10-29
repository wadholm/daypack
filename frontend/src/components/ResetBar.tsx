import { css } from '../../styled-system/css';
import { useI18n } from '../i18n/I18nProvider';

// pointer-events pass through the fade so the list underneath stays scrollable.
const barStyle = css({
  position: 'fixed',
  insetInline: '0',
  bottom: '0',
  zIndex: 1,
  display: 'flex',
  justifyContent: 'center',
  paddingInline: '4',
  paddingTop: '8',
  paddingBottom: 'resetBarBottom',
  backgroundImage: 'linear-gradient(to top, {colors.bg} 55%, transparent)',
  pointerEvents: 'none',
});

const buttonStyle = css({
  width: 'full',
  maxWidth: 'content',
  height: 'reset',
  border: 'none',
  borderRadius: 'reset',
  backgroundImage: '{gradients.accent}',
  color: 'onAccent',
  boxShadow: 'reset',
  fontFamily: 'body',
  fontSize: 'label',
  fontWeight: 'bold',
  cursor: 'pointer',
  pointerEvents: 'auto',
  transitionProperty: 'transform',
  transitionDuration: 'press',
  transitionTimingFunction: 'out',
  _active: { transform: 'translateY(1px) scale(0.99)' },
  _motionReduce: { transitionDuration: 'none', _active: { transform: 'none' } },
});

export function ResetBar({ onReset }: { onReset: () => void }) {
  const { t } = useI18n();

  return (
    <div class={barStyle}>
      <button type="button" class={buttonStyle} onClick={onReset}>
        {t('reset')}
      </button>
    </div>
  );
}

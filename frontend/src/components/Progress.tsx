import { css } from '../../styled-system/css';
import { useI18n } from '../i18n/I18nProvider';

const rowStyle = css({
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 'meta',
  fontWeight: 'bold',
});

const mutedStyle = css({ color: 'textMuted', fontWeight: 'semibold' });

const trackStyle = css({
  height: 'progress',
  borderRadius: 'full',
  bg: 'track',
  overflow: 'hidden',
});

const fillStyle = css({
  height: 'full',
  borderRadius: 'full',
  backgroundImage: '{gradients.progressFill}',
  transitionProperty: 'width',
  transitionDuration: 'progress',
  transitionTimingFunction: 'out',
  _motionReduce: { transitionDuration: 'none' },
});

interface ProgressProps {
  packed: number;
  total: number;
  percent: number;
}

export function Progress({ packed, total, percent }: ProgressProps) {
  const { t } = useI18n();

  return (
    <div>
      <div class={rowStyle}>
        <span>{t('packedCount', { packed, total })}</span>
        <span class={mutedStyle}>{percent}%</span>
      </div>
      <div class={trackStyle} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        <div class={fillStyle} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

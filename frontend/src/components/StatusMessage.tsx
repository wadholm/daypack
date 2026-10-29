import { css } from '../../styled-system/css';
import { useI18n } from '../i18n/I18nProvider';

const messageStyle = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '3',
  padding: '6',
  color: 'textMuted',
  fontSize: 'meta',
  fontWeight: 'semibold',
  textAlign: 'center',
});

const retryStyle = css({
  minHeight: 'tapTarget',
  paddingInline: '6',
  border: 'none',
  borderRadius: 'full',
  bg: 'brand',
  color: 'onBrand',
  fontFamily: 'body',
  fontSize: 'meta',
  fontWeight: 'bold',
  cursor: 'pointer',
});

type StatusMessageProps = { status: 'loading' } | { status: 'error'; onRetry: () => void };

export function StatusMessage(props: StatusMessageProps) {
  const { t } = useI18n();

  if (props.status === 'loading') {
    return (
      <p class={messageStyle} role="status">
        {t('loading')}
      </p>
    );
  }

  return (
    <div class={messageStyle} role="alert">
      <span>{t('loadError')}</span>
      <button type="button" class={retryStyle} onClick={props.onRetry}>
        {t('retry')}
      </button>
    </div>
  );
}

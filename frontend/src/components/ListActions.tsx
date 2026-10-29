import { css } from '../../styled-system/css';
import { useI18n } from '../i18n/I18nProvider';
import { iconProps } from '../icons/svgProps';

const barStyle = css({ display: 'flex', gap: '3', paddingInline: '4', paddingTop: '4' });

const buttonStyle = css({
  flex: '1',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2',
  minHeight: 'tapTarget',
  border: 'none',
  borderRadius: 'full',
  bg: 'surface',
  boxShadow: 'card',
  color: 'brand',
  fontFamily: 'body',
  fontSize: 'meta',
  fontWeight: 'bold',
  cursor: 'pointer',
});

const plusStyle = css({ width: 'icon', height: 'icon' });

interface ListActionsProps {
  editing: boolean;
  onAdd: () => void;
  onEditList: () => void;
}

export function ListActions({ editing, onAdd, onEditList }: ListActionsProps) {
  const { t } = useI18n();

  return (
    <div class={barStyle}>
      <button type="button" class={buttonStyle} onClick={onAdd}>
        <svg {...iconProps} stroke-width={2.4} class={plusStyle}>
          <path d="M12 5v14M5 12h14" />
        </svg>
        {t('addItem')}
      </button>
      {!editing && (
        <button type="button" class={buttonStyle} onClick={onEditList}>
          {t('editList')}
        </button>
      )}
    </div>
  );
}

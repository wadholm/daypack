import { css } from '../../styled-system/css';
import { useI18n } from '../i18n/I18nProvider';
import type { Item } from '../state/items';
import { ItemRow } from './ItemRow';
import { cardStyle } from './rowStyles';

const emptyStyle = css({
  margin: '0',
  padding: '6',
  color: 'textMuted',
  fontSize: 'meta',
  fontWeight: 'semibold',
  textAlign: 'center',
});

interface ItemListProps {
  items: readonly Item[];
  checked: ReadonlySet<string>;
  editing: boolean;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
}

export function ItemList({ items, checked, editing, onToggle, onEdit }: ItemListProps) {
  const { t } = useI18n();

  return (
    <div class={cardStyle} role="group" aria-label={t('title')}>
      {items.length === 0 && <p class={emptyStyle}>{t('emptyList')}</p>}
      {items.map((item) => (
        <ItemRow
          key={item.id}
          item={item}
          checked={checked.has(item.id)}
          editing={editing}
          onToggle={onToggle}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

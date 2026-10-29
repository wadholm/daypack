import { css } from '../../styled-system/css';
import type { Item } from '../api/items';
import { useI18n } from '../i18n/I18nProvider';
import { ItemRow } from './ItemRow';

const cardStyle = css({
  marginInline: '4',
  borderRadius: 'card',
  bg: 'surface',
  boxShadow: 'card',
  overflow: 'hidden',
});

interface ItemListProps {
  items: readonly Item[];
  checked: ReadonlySet<string>;
  onToggle: (id: string) => void;
}

export function ItemList({ items, checked, onToggle }: ItemListProps) {
  const { t } = useI18n();

  return (
    <div class={cardStyle} role="group" aria-label={t('title')}>
      {items.map((item) => (
        <ItemRow key={item.id} item={item} checked={checked.has(item.id)} onToggle={onToggle} />
      ))}
    </div>
  );
}

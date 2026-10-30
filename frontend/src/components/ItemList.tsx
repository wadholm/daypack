import { css } from '../../styled-system/css';
import { CATEGORY_KEYS } from '../i18n/categoryKeys';
import { useI18n } from '../i18n/I18nProvider';
import { groupByCategory, type Item } from '../state/items';
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

const headingStyle = css({
  margin: '0',
  paddingInline: '5',
  paddingTop: '4',
  paddingBottom: '1',
  color: 'textMuted',
  fontSize: 'meta',
  fontWeight: 'bold',
});

interface ItemListProps {
  items: readonly Item[];
  emptyText: string;
  checked: ReadonlySet<string>;
  editing: boolean;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onSetHidden: (id: string, hidden: boolean) => void;
}

export function ItemList({ items, emptyText, checked, editing, onToggle, onEdit, onSetHidden }: ItemListProps) {
  const { t } = useI18n();

  return (
    <div class={cardStyle} role="group" aria-label={t('title')}>
      {items.length === 0 && <p class={emptyStyle}>{emptyText}</p>}
      {groupByCategory(items).map((group) => (
        <section key={group.category}>
          <h2 class={headingStyle}>{t(CATEGORY_KEYS[group.category])}</h2>
          {group.items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              checked={checked.has(item.id)}
              editing={editing}
              onToggle={onToggle}
              onEdit={onEdit}
              onSetHidden={onSetHidden}
            />
          ))}
        </section>
      ))}
    </div>
  );
}

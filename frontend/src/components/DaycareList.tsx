import { css, cx } from '../../styled-system/css';
import { CATEGORY_KEYS } from '../i18n/categoryKeys';
import { useI18n } from '../i18n/I18nProvider';
import { itemLabel } from '../i18n/itemLabel';
import { ItemIcon } from '../icons/ItemIcon';
import { MAX_COUNT, groupByCategory, type Item } from '../state/items';
import { tileHue } from './hueStyles';
import { Stepper } from './Stepper';
import { cardStyle, labelStyle, noteStyle, textStyle, tileStyle } from './rowStyles';

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

const rowStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  minHeight: 'row',
  paddingBlock: '2',
  paddingInlineStart: '4',
  paddingInlineEnd: '2',
  '& + &': {
    borderTopWidth: 'divider',
    borderTopStyle: 'solid',
    borderTopColor: 'divider',
  },
});

interface DaycareListProps {
  items: readonly Item[];
  onSetStock: (id: string, stock: number) => void;
}

// What is at daycare right now. The Pack view works out what to bring from this and each item's target.
export function DaycareList({ items, onSetStock }: DaycareListProps) {
  const { t } = useI18n();

  return (
    <div class={cardStyle} role="group" aria-label={t('viewDaycare')}>
      {items.length === 0 && <p class={emptyStyle}>{t('daycareEmpty')}</p>}
      {groupByCategory(items).map((group) => (
        <section key={group.category}>
          <h2 class={headingStyle}>{t(CATEGORY_KEYS[group.category])}</h2>
          {group.items.map((item) => {
            const label = itemLabel(item, t);
            return (
              <div key={item.id} class={rowStyle}>
                <span class={cx(tileStyle, tileHue({ hue: item.hue }))}>
                  <ItemIcon id={item.icon} />
                </span>
                <span class={textStyle}>
                  <span class={labelStyle}>{label}</span>
                  <span class={noteStyle}>{t('wantedCount', { count: item.target })}</span>
                </span>
                <Stepper
                  value={item.stock}
                  min={0}
                  max={MAX_COUNT}
                  decreaseLabel={t('fewerLabel', { name: label })}
                  increaseLabel={t('moreLabel', { name: label })}
                  onChange={(stock) => onSetStock(item.id, stock)}
                />
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}

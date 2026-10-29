import { css, cx } from '../../styled-system/css';
import { useI18n } from '../i18n/I18nProvider';
import { itemLabel } from '../i18n/itemLabel';
import { ItemIcon } from '../icons/ItemIcon';
import type { Item } from '../state/items';
import { tileHue } from './hueStyles';
import { cardStyle, labelStyle, rowStyle, textStyle, tileStyle } from './rowStyles';

const headingStyle = css({
  margin: '0',
  paddingInline: '5',
  paddingTop: '6',
  paddingBottom: '2',
  color: 'textMuted',
  fontSize: 'meta',
  fontWeight: 'bold',
});

const dimmedStyle = css({ opacity: 'dimmed' });

const actionStyle = css({
  flexShrink: 0,
  color: 'brand',
  fontSize: 'meta',
  fontWeight: 'bold',
});

interface HiddenItemsProps {
  items: readonly Item[];
  onShow: (id: string) => void;
}

export function HiddenItems({ items, onShow }: HiddenItemsProps) {
  const { t } = useI18n();
  if (items.length === 0) return null;

  return (
    <section>
      <h2 class={headingStyle}>{t('hiddenItems', { count: items.length })}</h2>
      <div class={cardStyle}>
        {items.map((item) => {
          const label = itemLabel(item, t);
          return (
            <button
              key={item.id}
              type="button"
              class={rowStyle}
              aria-label={t('showItemLabel', { name: label })}
              onClick={() => onShow(item.id)}
            >
              <span class={cx(tileStyle, tileHue({ hue: item.hue }), dimmedStyle)}>
                <ItemIcon id={item.icon} />
              </span>
              <span class={cx(textStyle, dimmedStyle)}>
                <span class={labelStyle}>{label}</span>
              </span>
              <span class={actionStyle}>{t('showItem')}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

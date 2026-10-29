import { css, cx } from '../../styled-system/css';
import { useI18n } from '../i18n/I18nProvider';
import { itemLabel } from '../i18n/itemLabel';
import { ItemIcon } from '../icons/ItemIcon';
import { iconProps } from '../icons/svgProps';
import type { Item } from '../state/items';
import { checkHue, tileHue } from './hueStyles';
import { editRowStyle, labelStyle, noteStyle, rowStyle, textStyle, tileStyle } from './rowStyles';

// The checkbox itself never dims, only the tile and label do.
const checkboxStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: 'checkbox',
  height: 'checkbox',
  borderRadius: 'full',
  borderWidth: 'check',
  borderStyle: 'solid',
  bg: 'transparent',
});

const tickStyle = css({
  width: 'tickGlyph',
  height: 'tickGlyph',
  color: 'tick',
  animationName: 'tickPop',
  animationDuration: 'tick',
  animationTimingFunction: 'out',
  _motionReduce: { animationDuration: 'none' },
});

const editMainStyle = css({ flex: '1', minWidth: 'zero' });

const hideButtonStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: 'tapTarget',
  height: 'tapTarget',
  marginInlineEnd: '2',
  padding: '0',
  border: 'none',
  borderRadius: 'full',
  bg: 'transparent',
  color: 'textMuted',
  cursor: 'pointer',
});

const chevronStyle = css({ width: 'icon', height: 'icon', flexShrink: 0, color: 'textMuted' });

const hideIconStyle = css({ width: 'icon', height: 'icon' });

interface ItemRowProps {
  item: Item;
  checked: boolean;
  editing: boolean;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onHide: (id: string) => void;
}

// In pack mode a tap ticks the item; in edit mode the same row opens the editor instead.
export function ItemRow({ item, checked, editing, onToggle, onEdit, onHide }: ItemRowProps) {
  const { t } = useI18n();
  const label = itemLabel(item, t);

  const content = (
    <>
      <span class={cx(tileStyle, tileHue({ hue: item.hue }))}>
        <ItemIcon id={item.icon} />
      </span>
      <span class={textStyle}>
        <span class={labelStyle}>{label}</span>
        {item.note !== '' && <span class={noteStyle}>{item.note}</span>}
      </span>
    </>
  );

  if (editing) {
    return (
      <div class={editRowStyle}>
        <button
          type="button"
          class={cx(rowStyle, editMainStyle)}
          aria-label={t('editItemLabel', { name: label })}
          onClick={() => onEdit(item.id)}
        >
          {content}
          <svg {...iconProps} class={chevronStyle}>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
        <button
          type="button"
          class={hideButtonStyle}
          aria-label={t('hideItemLabel', { name: label })}
          onClick={() => onHide(item.id)}
        >
          <svg {...iconProps} class={hideIconStyle}>
            <path d="M3 3l18 18" />
            <path d="M10.6 6.1A9.8 9.8 0 0 1 12 6c5 0 8.5 4.2 9.5 6-.4.8-1.2 2-2.3 3.1M6.7 7.3C4.6 8.7 3.2 10.8 2.5 12c1 1.8 4.5 6 9.5 6 1.5 0 2.9-.4 4.1-1M9.9 9.9a3 3 0 0 0 4.2 4.2" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      class={rowStyle}
      onClick={() => onToggle(item.id)}
    >
      {content}
      <span class={cx(checkboxStyle, checkHue({ hue: item.hue }))}>
        {checked && (
          <svg {...iconProps} stroke-width={3} class={tickStyle}>
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        )}
      </span>
    </button>
  );
}

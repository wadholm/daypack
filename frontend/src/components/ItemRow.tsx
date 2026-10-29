import { css, cx } from '../../styled-system/css';
import { useI18n } from '../i18n/I18nProvider';
import { itemLabel } from '../i18n/itemLabel';
import { ItemIcon } from '../icons/ItemIcon';
import { iconProps } from '../icons/svgProps';
import type { Item } from '../state/items';
import { checkHue, tileHue } from './hueStyles';
import { labelStyle, noteStyle, rowStyle, textStyle, tileStyle } from './rowStyles';

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

const chevronStyle = css({ width: 'icon', height: 'icon', flexShrink: 0, color: 'textMuted' });

interface ItemRowProps {
  item: Item;
  checked: boolean;
  editing: boolean;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
}

// In pack mode a tap ticks the item; in edit mode the same row opens the editor instead.
export function ItemRow({ item, checked, editing, onToggle, onEdit }: ItemRowProps) {
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
      <button
        type="button"
        class={rowStyle}
        aria-label={t('editItemLabel', { name: label })}
        onClick={() => onEdit(item.id)}
      >
        {content}
        <svg {...iconProps} class={chevronStyle}>
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
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

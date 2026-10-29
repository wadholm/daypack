import { css, cx } from '../../styled-system/css';
import type { Item } from '../api/items';
import { ItemIcon } from '../icons/ItemIcon';
import { iconProps } from '../icons/svgProps';
import { checkHue, tileHue } from './hueStyles';

const rowStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  width: 'full',
  minHeight: 'row',
  paddingBlock: '2',
  paddingInline: '4',
  border: 'none',
  bg: 'transparent',
  color: 'text',
  fontFamily: 'body',
  textAlign: 'start',
  cursor: 'pointer',
  '& + &': {
    borderTopWidth: 'divider',
    borderTopStyle: 'solid',
    borderTopColor: 'divider',
  },
});

const fadeStyle = {
  transitionProperty: 'opacity',
  transitionDuration: 'fade',
  '[aria-checked=true] &': { opacity: 'dimmed' },
  _motionReduce: { transitionDuration: 'none' },
} as const;

const tileStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: 'iconTile',
  height: 'iconTile',
  borderRadius: 'full',
  ...fadeStyle,
});

const labelStyle = css({
  flexGrow: 1,
  fontSize: 'label',
  fontWeight: 'semibold',
  ...fadeStyle,
  '[aria-checked=true] &': { opacity: 'dimmed', textDecoration: 'line-through' },
});

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

interface ItemRowProps {
  item: Item;
  checked: boolean;
  onToggle: (id: string) => void;
}

export function ItemRow({ item, checked, onToggle }: ItemRowProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      class={rowStyle}
      onClick={() => onToggle(item.id)}
    >
      <span class={cx(tileStyle, tileHue({ hue: item.hue }))}>
        <ItemIcon id={item.id} />
      </span>
      <span class={labelStyle}>{item.label}</span>
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

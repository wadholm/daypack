import { css } from '../../styled-system/css';

// Shared by the pack rows, edit rows and hidden rows so all three look like one list.
export const rowStyle = css({
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

// Edit mode splits the row into an edit button and a hide button, so it can't be one <button>.
export const editRowStyle = css({
  display: 'flex',
  alignItems: 'center',
  width: 'full',
  minHeight: 'row',
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

export const tileStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: 'iconTile',
  height: 'iconTile',
  borderRadius: 'full',
  ...fadeStyle,
});

export const textStyle = css({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  minWidth: 'zero',
  ...fadeStyle,
  '[aria-checked=true] &': { opacity: 'dimmed' },
});

export const labelStyle = css({
  fontSize: 'label',
  fontWeight: 'semibold',
  '[aria-checked=true] &': { textDecoration: 'line-through' },
});

export const noteStyle = css({
  fontSize: 'meta',
  color: 'textMuted',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const cardStyle = css({
  marginInline: '4',
  borderRadius: 'card',
  bg: 'surface',
  boxShadow: 'card',
  overflow: 'hidden',
});

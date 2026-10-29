import { css } from '../../styled-system/css';

export const dialogStyle = css({
  position: 'fixed',
  insetInline: '0',
  bottom: '0',
  top: 'auto',
  width: 'full',
  maxWidth: 'content',
  maxHeight: 'sheetMax',
  marginInline: 'auto',
  marginBottom: '0',
  padding: '0',
  border: 'none',
  borderTopLeftRadius: 'sheet',
  borderTopRightRadius: 'sheet',
  bg: 'surface',
  color: 'text',
  fontFamily: 'body',
  overflowY: 'auto',
  animationName: 'sheetUp',
  animationDuration: 'sheet',
  animationTimingFunction: 'out',
  _backdrop: {
    bg: 'scrim',
    animationName: 'scrimIn',
    animationDuration: 'sheet',
    _motionReduce: { animationDuration: 'none' },
  },
  _motionReduce: { animationDuration: 'none' },
});

export const headingStyle = css({ margin: '0', fontSize: 'wordmark', fontWeight: 'extrabold' });

export const actionsStyle = css({ display: 'flex', gap: '3' });

// Variants merge into one class (css with several objects) because separate single-class rules
// for bg/color would fight over source order instead of the variant winning.
const buttonBase = {
  flex: '1',
  minHeight: 'tapTarget',
  border: 'none',
  borderRadius: 'full',
  fontFamily: 'body',
  fontSize: 'meta',
  fontWeight: 'bold',
  cursor: 'pointer',
} as const;

export const buttonStyle = css(buttonBase, { bg: 'bg', color: 'text' });

export const primaryButtonStyle = css(buttonBase, {
  bg: 'brand',
  color: 'onBrand',
  _disabled: { opacity: 'dimmed', cursor: 'default' },
});

export const dangerButtonStyle = css(buttonBase, { bg: 'bg', color: 'danger' });

export const formStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  padding: '5',
  paddingBottom: 'resetBarBottom',
});

export const inputStyle = css({
  minHeight: 'tapTarget',
  paddingInline: '4',
  border: 'none',
  borderRadius: 'reset',
  bg: 'bg',
  color: 'text',
  fontFamily: 'body',
  // 17px keeps iOS from zooming the page on focus.
  fontSize: 'label',
  fontWeight: 'semibold',
});

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

export const buttonStyle = css({
  flex: '1',
  minHeight: 'tapTarget',
  border: 'none',
  borderRadius: 'full',
  bg: 'bg',
  color: 'text',
  fontFamily: 'body',
  fontSize: 'meta',
  fontWeight: 'bold',
  cursor: 'pointer',
});

export const formStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  padding: '5',
  paddingBottom: 'resetBarBottom',
});

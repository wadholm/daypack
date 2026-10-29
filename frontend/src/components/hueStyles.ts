import { cva } from '../../styled-system/css';

// Spelled out per hue because Panda extracts token names statically at build time.
export const tileHue = cva({
  variants: {
    hue: {
      yellow: { bg: 'hue.yellow.tile', color: 'hue.yellow.icon' },
      sky: { bg: 'hue.sky.tile', color: 'hue.sky.icon' },
      pink: { bg: 'hue.pink.tile', color: 'hue.pink.icon' },
      mint: { bg: 'hue.mint.tile', color: 'hue.mint.icon' },
      peach: { bg: 'hue.peach.tile', color: 'hue.peach.icon' },
      lavender: { bg: 'hue.lavender.tile', color: 'hue.lavender.icon' },
      sea: { bg: 'hue.sea.tile', color: 'hue.sea.icon' },
    },
  },
});

export const checkHue = cva({
  variants: {
    hue: {
      yellow: { borderColor: 'hue.yellow.check/70', '[aria-checked=true] &': { bg: 'hue.yellow.check', borderColor: 'hue.yellow.check' } },
      sky: { borderColor: 'hue.sky.check/70', '[aria-checked=true] &': { bg: 'hue.sky.check', borderColor: 'hue.sky.check' } },
      pink: { borderColor: 'hue.pink.check/70', '[aria-checked=true] &': { bg: 'hue.pink.check', borderColor: 'hue.pink.check' } },
      mint: { borderColor: 'hue.mint.check/70', '[aria-checked=true] &': { bg: 'hue.mint.check', borderColor: 'hue.mint.check' } },
      peach: { borderColor: 'hue.peach.check/70', '[aria-checked=true] &': { bg: 'hue.peach.check', borderColor: 'hue.peach.check' } },
      lavender: { borderColor: 'hue.lavender.check/70', '[aria-checked=true] &': { bg: 'hue.lavender.check', borderColor: 'hue.lavender.check' } },
      sea: { borderColor: 'hue.sea.check/70', '[aria-checked=true] &': { bg: 'hue.sea.check', borderColor: 'hue.sea.check' } },
    },
  },
});

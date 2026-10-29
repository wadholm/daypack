import { defineConfig, defineKeyframes } from '@pandacss/dev'

// Values below come from DESIGN.md; keep the two in sync.

// [tile, icon, check (light), check (dark)]
const HUES = {
  yellow: ['#FFE3A0', '#8A5A00', '#E3C27C', '#EBCD8C'],
  sky: ['#CDE4FA', '#1F5A8F', '#90B3DC', '#A0C1E8'],
  pink: ['#FBD3E0', '#962E57', '#DA9DB5', '#E8B0C6'],
  mint: ['#C9F0DE', '#1A7050', '#90C6AC', '#A0D4BC'],
  peach: ['#FFD6C2', '#933F1A', '#E6AA8E', '#F0B89D'],
  lavender: ['#E3D7FA', '#523896', '#AE9DDB', '#BEAFE8'],
  sea: ['#C7EEEC', '#16696A', '#8BC3C1', '#9ACFCD'],
} as const

// Dark mode: tile is the light tile color at ~18% opacity (0x2E), icon is the light tile color.
const DARK_TILE_ALPHA = '2E'

const hueTokens = Object.fromEntries(
  Object.entries(HUES).map(([hue, [tile, icon, checkLight, checkDark]]) => [
    hue,
    {
      tile: { value: { base: tile, _dark: `${tile}${DARK_TILE_ALPHA}` } },
      icon: { value: { base: icon, _dark: tile } },
      check: { value: { base: checkLight, _dark: checkDark } },
    },
  ]),
)

const keyframes = defineKeyframes({
  tickPop: {
    '0%': { transform: 'scale(0.2)' },
    '60%': { transform: 'scale(1.15)' },
    '100%': { transform: 'scale(1)' },
  },
})

export default defineConfig({
  presets: ['@pandacss/preset-base', '@pandacss/preset-panda'],
  preflight: true,
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  outdir: 'styled-system',
  jsxFramework: 'preact',
  strictTokens: true,

  // The inline script in index.html always resolves System to light or dark and sets data-theme.
  conditions: {
    extend: {
      dark: '[data-theme=dark] &',
      light: '[data-theme=light] &',
    },
  },

  theme: {
    keyframes,
    tokens: {
      // Replace the preset palette so only DESIGN.md colors (semantic tokens below) type-check.
      colors: {},
      fonts: {
        body: {
          value: "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
        },
      },
      fontSizes: {
        title: { value: '31px' },
        wordmark: { value: '20px' },
        label: { value: '17px' },
        meta: { value: '15px' },
        pill: { value: '13px' },
      },
      fontWeights: {
        regular: { value: '400' },
        medium: { value: '500' },
        semibold: { value: '600' },
        bold: { value: '700' },
        extrabold: { value: '800' },
      },
      letterSpacings: {
        title: { value: '-0.03em' },
        wordmark: { value: '-0.02em' },
      },
      spacing: {
        '0': { value: '0px' },
        '1': { value: '4px' },
        '2': { value: '8px' },
        '3': { value: '12px' },
        '4': { value: '16px' },
        '5': { value: '20px' },
        '6': { value: '24px' },
        '8': { value: '32px' },
        resetBottom: { value: '34px' },
      },
      sizes: {
        full: { value: '100%' },
        tapTarget: { value: '48px' },
        row: { value: '56px' },
        iconTile: { value: '38px' },
        checkbox: { value: '30px' },
        progress: { value: '10px' },
        reset: { value: '60px' },
        headerGlow: { value: '330px' },
      },
      borderWidths: {
        check: { value: '2px' },
        divider: { value: '1px' },
      },
      radii: {
        card: { value: '24px' },
        reset: { value: '18px' },
        full: { value: '9999px' },
      },
      durations: {
        tick: { value: '360ms' },
        fade: { value: '280ms' },
        progress: { value: '500ms' },
        press: { value: '120ms' },
      },
    },

    semanticTokens: {
      colors: {
        bg: { value: { base: '#F8F5F8', _dark: '#16131F' } },
        surface: { value: { base: '#FFFFFF', _dark: '#201C2D' } },
        text: { value: { base: '#24213A', _dark: '#F1EEF8' } },
        textMuted: { value: { base: '#5C5876', _dark: '#B3ADCB' } },
        brand: { value: { base: '#5B63D3', _dark: '#C3C6FF' } },
        onBrand: { value: { base: '#FFFFFF', _dark: '#18153A' } },
        divider: { value: { base: '#F0ECF2', _dark: '#2C2739' } },
        track: { value: { base: '#E9E4EF', _dark: '#302A40' } },
        chip: { value: { base: 'rgba(255, 255, 255, 0.75)', _dark: 'rgba(255, 255, 255, 0.10)' } },
        onAccent: { value: '#3A2A06' },
        // White tick on a pastel check color; in dark mode the tick uses the bg color.
        tick: { value: { base: '#FFFFFF', _dark: '#16131F' } },
        hue: hueTokens,
      },
      gradients: {
        accent: {
          value: {
            base: 'linear-gradient(180deg, #FFE070, #FFC43A)',
            _dark: 'linear-gradient(180deg, #FFE27A, #FFCA48)',
          },
        },
        progressFill: {
          value: {
            base: 'linear-gradient(90deg, #9FD0FF, #A68DF5 55%, #6A63E0)',
            _dark: 'linear-gradient(90deg, #6A63E0, #B49CFF 55%, #A6D6FF)',
          },
        },
        headerGlow: {
          value: {
            base: [
              'radial-gradient(60% 55% at 16% 44%, rgba(222, 196, 250, 0.7), transparent 70%)',
              'radial-gradient(55% 50% at 90% 8%, rgba(170, 212, 255, 0.75), transparent 70%)',
              'radial-gradient(50% 45% at 60% 70%, rgba(255, 214, 226, 0.45), transparent 70%)',
            ].join(', '),
            _dark: [
              'radial-gradient(60% 55% at 16% 44%, rgba(176, 140, 255, 0.24), transparent 70%)',
              'radial-gradient(55% 50% at 90% 8%, rgba(110, 175, 255, 0.26), transparent 70%)',
            ].join(', '),
          },
        },
      },
      shadows: {
        card: {
          value: {
            base: '0 1px 2px rgba(60, 40, 90, 0.05), 0 10px 30px -12px rgba(60, 40, 90, 0.2)',
            _dark: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 12px 30px -14px rgba(0, 0, 0, 0.5)',
          },
        },
        reset: {
          value: {
            base: '0 12px 24px -12px rgba(240, 170, 30, 0.75)',
            _dark: '0 12px 26px -14px rgba(255, 200, 72, 0.5)',
          },
        },
      },
    },
  },

  globalCss: {
    body: {
      bg: 'bg',
      color: 'text',
      fontFamily: 'body',
      margin: '0',
    },
  },
})

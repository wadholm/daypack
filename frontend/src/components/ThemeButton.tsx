import { css } from '../../styled-system/css';
import { nextThemePref, type ThemePref } from '../state/theme';

interface ThemeButtonProps {
  pref: ThemePref;
  label: string;
  onChange: (pref: ThemePref) => void;
}

const buttonStyle = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 'tapTarget',
  height: 'tapTarget',
  borderRadius: 'full',
  border: 'none',
  bg: 'chip',
  color: 'text',
  cursor: 'pointer',
});

const svgProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': 2,
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
  'aria-hidden': true,
} as const;

function ThemeIcon({ pref }: { pref: ThemePref }) {
  if (pref === 'light') {
    return (
      <svg {...svgProps}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  }
  if (pref === 'dark') {
    return (
      <svg {...svgProps}>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    );
  }
  return (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" />
    </svg>
  );
}

export function ThemeButton({ pref, label, onChange }: ThemeButtonProps) {
  return (
    <button type="button" class={buttonStyle} aria-label={label} onClick={() => onChange(nextThemePref(pref))}>
      <ThemeIcon pref={pref} />
    </button>
  );
}

import type { JSX } from 'preact';
import { css } from '../../styled-system/css';
import { iconProps } from './svgProps';

const iconStyle = css({ width: 'icon', height: 'icon' });

// Keyed by stable item id; an unknown id (new server item) falls back to a plain circle.
const ICON_PATHS: Record<string, JSX.Element> = {
  diapers: (
    <>
      <path d="M3 6h18v4c0 5-4 9-9 9s-9-4-9-9z" />
      <path d="M7 6v3M17 6v3" />
    </>
  ),
  pacifier: (
    <>
      <circle cx="12" cy="5.5" r="2.5" />
      <path d="M5 12.5c0-1 1-2 2-2h10c1 0 2 1 2 2 0 2.5-3 4-7 4s-7-1.5-7-4z" />
      <path d="M10 16.5V19a2 2 0 0 0 4 0v-2.5" />
    </>
  ),
  'cuddly-toy': (
    <>
      <circle cx="12" cy="13.5" r="6.5" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="6.5" r="2.5" />
      <path d="M10 12h.01M14 12h.01M11 15.5c.6.5 1.4.5 2 0" />
    </>
  ),
  'spare-clothes': <path d="M8 3 3 6l2 4 3-1v11h8V9l3 1 2-4-5-3a4 4 0 0 1-8 0z" />,
  'rain-gear': (
    <>
      <path d="M3 12a9 9 0 0 1 18 0z" />
      <path d="M12 12v6a2 2 0 0 1-4 0" />
    </>
  ),
  'water-bottle': (
    <>
      <path d="M10 2h4v3h-4z" />
      <path d="M8 7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2z" />
      <path d="M8 12h8" />
    </>
  ),
  'sun-hat': (
    <>
      <path d="M2 16c0-2 4-3 10-3s10 1 10 3-4 3-10 3-10-1-10-3z" />
      <path d="M6.5 14.5C6.5 9 8.5 6 12 6s5.5 3 5.5 8.5" />
    </>
  ),
};

export function ItemIcon({ id }: { id: string }) {
  return (
    <svg {...iconProps} class={iconStyle}>
      {ICON_PATHS[id] ?? <circle cx="12" cy="12" r="8" />}
    </svg>
  );
}

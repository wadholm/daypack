import type { JSX } from 'preact';
import { css } from '../../styled-system/css';
import { iconProps } from './svgProps';
import type { IconId } from './iconIds';

const iconStyle = css({ width: 'icon', height: 'icon' });

const ICON_PATHS: Record<IconId, JSX.Element> = {
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
  star: <path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6-4.5-4.2 6.1-.8z" />,
  heart: <path d="M12 20S4 15 4 9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15 12 20 12 20z" />,
  book: (
    <>
      <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
      <path d="M4 19a2 2 0 0 1 2-2h13" />
    </>
  ),
  socks: (
    <>
      <path d="M8 3h6v9l5 4a3 3 0 0 1-2 5c-1.5 0-2.500-.5-4-1.5L8 14z" />
      <path d="M8 7h6" />
    </>
  ),
  snack: (
    <>
      <path d="M12 8c-3-3-8-1-8 4 0 4 3 8 5 8 1.5 0 1.5-.5 3-.5s1.5.5 3 .5c2 0 5-4 5-8 0-5-5-7-8-4z" />
      <path d="M12 8c0-2 1-4 3-5" />
    </>
  ),
  blanket: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 9h18M8 9v10M13 9v10" />
    </>
  ),
  shoe: (
    <>
      <path d="M4 5h5v6c0 1.2 1 2 2.2 2H15c3 0 5 1.5 5 4v1H4z" />
      <path d="M9 8h3M9 11h2" />
    </>
  ),
  beanie: (
    <>
      <path d="M5 15a7 7 0 0 1 14 0z" />
      <path d="M4 15h16v3.5H4z" />
      <circle cx="12" cy="5" r="1.8" />
    </>
  ),
};

export function ItemIcon({ id }: { id: IconId }) {
  return (
    <svg {...iconProps} class={iconStyle}>
      {ICON_PATHS[id]}
    </svg>
  );
}

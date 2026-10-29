import { css } from '../../styled-system/css';
import { iconProps } from './svgProps';

const logoStyle = css({ width: 'logo', height: 'logo' });

export function LogoIcon() {
  return (
    <svg {...iconProps} class={logoStyle}>
      <path d="M3 11a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" />
      <path d="M3 12.5h18M10 16h4" />
    </svg>
  );
}

import { css } from '../../styled-system/css';
import { iconProps } from './svgProps';

const logoStyle = css({ width: 'logo', height: 'logo' });

export function LogoIcon() {
  return (
    <svg {...iconProps} class={logoStyle}>
      <path d="M6 9a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z" />
      <path d="M9 6V5a3 3 0 0 1 6 0v1" />
      <path d="M6 12h12M10 16h4" />
    </svg>
  );
}

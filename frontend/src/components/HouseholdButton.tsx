import { css, cx } from '../../styled-system/css';
import { chipButtonStyle } from './ThemeButton';

const connectedStyle = css({ color: 'brand' });

interface HouseholdButtonProps {
  label: string;
  connected: boolean;
  onPress: () => void;
}

// Brand-coloured while the list is shared, so it is visible at a glance whether changes reach the others.
export function HouseholdButton({ label, connected, onPress }: HouseholdButtonProps) {
  return (
    <button type="button" class={cx(chipButtonStyle, connected && connectedStyle)} aria-label={label} onClick={onPress}>
      <svg
        width={22}
        height={22}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width={2}
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
        <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.4c2.2.7 3.5 2.6 3.5 5.6" />
      </svg>
    </button>
  );
}

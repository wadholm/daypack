import { css } from '../../styled-system/css';
import { iconProps } from '../icons/svgProps';

const groupStyle = css({ display: 'inline-flex', alignItems: 'center', flexShrink: 0 });

const buttonStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 'tapTarget',
  height: 'tapTarget',
  padding: '0',
  border: 'none',
  borderRadius: 'full',
  bg: 'transparent',
  color: 'brand',
  cursor: 'pointer',
  _disabled: { opacity: 'dimmed', cursor: 'default' },
});

const valueStyle = css({
  minWidth: 'stepperValue',
  textAlign: 'center',
  fontSize: 'label',
  fontWeight: 'bold',
});

const glyphStyle = css({ width: 'icon', height: 'icon' });

interface StepperProps {
  value: number;
  min: number;
  max: number;
  decreaseLabel: string;
  increaseLabel: string;
  onChange: (value: number) => void;
}

export function Stepper({ value, min, max, decreaseLabel, increaseLabel, onChange }: StepperProps) {
  return (
    <span class={groupStyle}>
      <button
        type="button"
        class={buttonStyle}
        aria-label={decreaseLabel}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        <svg {...iconProps} stroke-width={2.4} class={glyphStyle}>
          <path d="M5 12h14" />
        </svg>
      </button>
      <output class={valueStyle}>{value}</output>
      <button
        type="button"
        class={buttonStyle}
        aria-label={increaseLabel}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        <svg {...iconProps} stroke-width={2.4} class={glyphStyle}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </span>
  );
}

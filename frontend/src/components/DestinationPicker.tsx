import { css } from '../../styled-system/css';
import { useI18n } from '../i18n/I18nProvider';
import { DESTINATIONS, DESTINATION_KEYS, isDestination, type DestinationId } from '../state/destinations';
import { iconProps } from '../icons/svgProps';

const wrapStyle = css({ position: 'relative', display: 'inline-flex', flexShrink: 0 });

// A native select keeps the OS picker, which suits one-handed use and scales to more destinations.
const selectStyle = css({
  appearance: 'none',
  minHeight: 'tapTarget',
  paddingInlineStart: '4',
  paddingInlineEnd: '8',
  border: 'none',
  borderRadius: 'full',
  bg: 'chip',
  color: 'text',
  fontFamily: 'body',
  fontSize: 'meta',
  fontWeight: 'bold',
  cursor: 'pointer',
});

const chevronStyle = css({
  position: 'absolute',
  insetInlineEnd: '2',
  top: '0',
  bottom: '0',
  marginBlock: 'auto',
  width: 'icon',
  height: 'icon',
  color: 'textMuted',
  pointerEvents: 'none',
});

interface DestinationPickerProps {
  value: DestinationId;
  onChange: (id: DestinationId) => void;
}

export function DestinationPicker({ value, onChange }: DestinationPickerProps) {
  const { t } = useI18n();

  return (
    <span class={wrapStyle}>
      <select
        class={selectStyle}
        aria-label={t('destinationLabel')}
        value={value}
        onChange={(event) => {
          const next = event.currentTarget.value;
          if (isDestination(next)) onChange(next);
        }}
      >
        {DESTINATIONS.map((id) => (
          <option key={id} value={id}>
            {t(DESTINATION_KEYS[id])}
          </option>
        ))}
      </select>
      <svg {...iconProps} stroke-width={2.4} class={chevronStyle} aria-hidden="true">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </span>
  );
}

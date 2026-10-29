import { css, cx } from '../../styled-system/css';
import { useI18n } from '../i18n/I18nProvider';
import type { TranslationKey } from '../i18n/en';
import { ItemIcon } from '../icons/ItemIcon';
import { ICON_IDS, type IconId } from '../icons/iconIds';
import { iconProps } from '../icons/svgProps';
import { HUES, type Hue } from '../state/items';
import { tileHue } from './hueStyles';

const HUE_KEYS: Record<Hue, TranslationKey> = {
  yellow: 'hue_yellow',
  sky: 'hue_sky',
  pink: 'hue_pink',
  mint: 'hue_mint',
  peach: 'hue_peach',
  lavender: 'hue_lavender',
  sea: 'hue_sea',
};

const ICON_KEYS: Record<IconId, TranslationKey> = {
  diapers: 'icon_diapers',
  pacifier: 'icon_pacifier',
  'cuddly-toy': 'icon_cuddly-toy',
  'spare-clothes': 'icon_spare-clothes',
  'rain-gear': 'icon_rain-gear',
  'water-bottle': 'icon_water-bottle',
  'sun-hat': 'icon_sun-hat',
  star: 'icon_star',
  heart: 'icon_heart',
  book: 'icon_book',
  socks: 'icon_socks',
  snack: 'icon_snack',
  blanket: 'icon_blanket',
  shoe: 'icon_shoe',
  beanie: 'icon_beanie',
};

const groupStyle = css({ display: 'flex', flexWrap: 'wrap', gap: '2' });

const optionStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 'swatch',
  height: 'swatch',
  padding: '0',
  borderRadius: 'full',
  borderWidth: 'check',
  borderStyle: 'solid',
  borderColor: 'transparent',
  bg: 'bg',
  color: 'text',
  cursor: 'pointer',
  '&[aria-checked=true]': { borderColor: 'brand' },
});

const swatchDotStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 'checkbox',
  height: 'checkbox',
  borderRadius: 'full',
});

const checkStyle = css({ width: 'tickGlyph', height: 'tickGlyph' });

export function HuePicker({ value, onChange }: { value: Hue; onChange: (hue: Hue) => void }) {
  const { t } = useI18n();

  return (
    <div class={groupStyle} role="radiogroup" aria-label={t('hueField')}>
      {HUES.map((hue) => (
        <button
          key={hue}
          type="button"
          role="radio"
          aria-checked={hue === value}
          aria-label={t(HUE_KEYS[hue])}
          class={optionStyle}
          onClick={() => onChange(hue)}
        >
          <span class={cx(swatchDotStyle, tileHue({ hue }))}>
            {hue === value && (
              <svg {...iconProps} stroke-width={3} class={checkStyle}>
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

export function IconPicker({
  value,
  hue,
  onChange,
}: {
  value: IconId;
  hue: Hue;
  onChange: (icon: IconId) => void;
}) {
  const { t } = useI18n();

  return (
    <div class={groupStyle} role="radiogroup" aria-label={t('iconField')}>
      {ICON_IDS.map((icon) => (
        <button
          key={icon}
          type="button"
          role="radio"
          aria-checked={icon === value}
          aria-label={t(ICON_KEYS[icon])}
          class={optionStyle}
          onClick={() => onChange(icon)}
        >
          <span class={cx(swatchDotStyle, tileHue({ hue }))}>
            <ItemIcon id={icon} />
          </span>
        </button>
      ))}
    </div>
  );
}

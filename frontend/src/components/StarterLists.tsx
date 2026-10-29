import { css, cx } from '../../styled-system/css';
import { useEffect, useRef } from 'preact/hooks';
import { useI18n } from '../i18n/I18nProvider';
import type { TranslationKey } from '../i18n/en';
import { TEMPLATES, type TemplateId } from '../state/catalogue';
import { templateState, type Item, type TemplateState } from '../state/items';
import { actionsStyle, buttonStyle, dialogStyle, formStyle, headingStyle } from './sheetStyles';

const TEMPLATE_KEYS: Record<TemplateId, TranslationKey> = {
  warm: 'starter_warm',
  cold: 'starter_cold',
  rain: 'starter_rain',
  overnight: 'starter_overnight',
  outing: 'starter_outing',
  swim: 'starter_swim',
};

const STATE_KEYS: Record<TemplateState, TranslationKey> = {
  on: 'starterOn',
  partial: 'starterPartial',
  off: 'starterOff',
};

const introStyle = css({ margin: '0', color: 'textMuted', fontSize: 'meta', fontWeight: 'semibold' });

const optionStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
  paddingInline: '4',
  textAlign: 'start',
  // Needs the attribute selector to outrank the base button's bg and color.
  '&[aria-checked=true]': { bg: 'brand', color: 'onBrand' },
});

const optionLabelStyle = css({ fontSize: 'label', fontWeight: 'semibold' });

const optionStateStyle = css({ fontSize: 'meta', fontWeight: 'bold' });

// Partly on keeps the neutral background but turns the state label to the brand colour.
const partialStateStyle = css({ color: 'brand' });

interface StarterListsProps {
  items: readonly Item[];
  onToggle: (template: TemplateId, active: boolean) => void;
  onClose: () => void;
}

export function StarterLists({ items, onToggle, onClose }: StarterListsProps) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      class={dialogStyle}
      aria-label={t('starterLists')}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div class={formStyle}>
        <h2 class={headingStyle}>{t('starterLists')}</h2>
        <p class={introStyle}>{t('starterIntro')}</p>
        {TEMPLATES.map((template) => {
          const state = templateState(items, template);
          return (
            <button
              key={template}
              type="button"
              role="switch"
              aria-checked={state === 'partial' ? 'mixed' : state === 'on'}
              class={cx(buttonStyle, optionStyle)}
              onClick={() => onToggle(template, state !== 'on')}
            >
              <span class={optionLabelStyle}>{t(TEMPLATE_KEYS[template])}</span>
              <span class={cx(optionStateStyle, state === 'partial' && partialStateStyle)}>
                {t(STATE_KEYS[state])}
              </span>
            </button>
          );
        })}
        <div class={actionsStyle}>
          <button type="button" class={buttonStyle} onClick={onClose}>
            {t('done')}
          </button>
        </div>
      </div>
    </dialog>
  );
}

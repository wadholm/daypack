import { css, cx } from '../../styled-system/css';
import { useEffect, useRef } from 'preact/hooks';
import { useI18n } from '../i18n/I18nProvider';
import type { TranslationKey } from '../i18n/en';
import { TEMPLATES, type TemplateId } from '../state/catalogue';
import { templateActive, type Item } from '../state/items';
import { actionsStyle, buttonStyle, dialogStyle, formStyle, headingStyle } from './sheetStyles';

const TEMPLATE_KEYS: Record<TemplateId, TranslationKey> = {
  warm: 'starter_warm',
  cold: 'starter_cold',
  overnight: 'starter_overnight',
  swim: 'starter_swim',
};

const introStyle = css({ margin: '0', color: 'textMuted', fontSize: 'meta', fontWeight: 'semibold' });

const optionStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
  paddingInline: '4',
  textAlign: 'start',
});

const onStyle = css({ bg: 'brand', color: 'onBrand' });

const optionLabelStyle = css({ fontSize: 'label', fontWeight: 'semibold' });

const optionStateStyle = css({ fontSize: 'meta', fontWeight: 'bold' });

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
          const active = templateActive(items, template);
          return (
            <button
              key={template}
              type="button"
              role="switch"
              aria-checked={active}
              class={cx(buttonStyle, optionStyle, active && onStyle)}
              onClick={() => onToggle(template, !active)}
            >
              <span class={optionLabelStyle}>{t(TEMPLATE_KEYS[template])}</span>
              <span class={optionStateStyle}>{active ? t('starterOn') : t('starterOff')}</span>
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

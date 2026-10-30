import { css, cx } from '../../styled-system/css';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useI18n } from '../i18n/I18nProvider';
import { itemLabel } from '../i18n/itemLabel';
import { CATEGORIES, type Category } from '../state/catalogue';
import { MAX_COUNT, canDelete, categoryOf, type Hue, type Item, type ItemDraft } from '../state/items';
import type { IconId } from '../icons/iconIds';
import { CATEGORY_KEYS } from '../i18n/categoryKeys';
import { HuePicker, IconPicker } from './Pickers';
import { iconProps } from '../icons/svgProps';
import { Stepper } from './Stepper';
import {
  actionsStyle,
  buttonStyle,
  dangerButtonStyle,
  dialogStyle,
  formStyle,
  headingStyle,
  inputStyle,
  primaryButtonStyle,
} from './sheetStyles';

const fieldStyle = css({ display: 'flex', flexDirection: 'column', gap: '2', border: 'none', padding: '0', margin: '0' });

const fieldLabelStyle = css({ fontSize: 'meta', fontWeight: 'bold', color: 'textMuted', padding: '0' });

const toggleStyle = css({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  minHeight: 'tapTarget',
  fontSize: 'label',
  fontWeight: 'semibold',
});

// The real input stays focusable but invisible; the box beside it is what the user sees, matching the list checkboxes.
const checkboxInputStyle = css({
  position: 'absolute',
  width: 'checkbox',
  height: 'checkbox',
  margin: '0',
  overflow: 'hidden',
  clipPath: 'inset(50%)',
});

const checkboxBoxStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: 'checkbox',
  height: 'checkbox',
  borderRadius: 'full',
  borderWidth: 'check',
  borderStyle: 'solid',
  borderColor: 'brand',
  color: 'onBrand',
  'input:checked + &': { bg: 'brand' },
  'input:focus-visible + &': { outlineWidth: 'check', outlineStyle: 'solid', outlineColor: 'brand', outlineOffset: '1' },
});

const tickStyle = css({ width: 'tickGlyph', height: 'tickGlyph' });

const selectWrapStyle = css({ position: 'relative', display: 'flex', flexDirection: 'column' });

const selectStyle = css({ appearance: 'none', paddingInlineEnd: '8' });

const chevronStyle = css({
  position: 'absolute',
  insetInlineEnd: '4',
  top: '0',
  bottom: '0',
  width: 'icon',
  height: 'icon',
  marginBlock: 'auto',
  color: 'textMuted',
  pointerEvents: 'none',
});

const amountRowStyle = css({ display: 'flex', alignItems: 'center', justifyContent: 'space-between' });

const noteInputStyle = css({ minHeight: 'noteField', paddingBlock: '3', resize: 'none' });

interface ItemEditorProps {
  // null opens the editor for a brand-new custom item.
  item: Item | null;
  // Prefills the name when the editor was opened from a search with no match.
  initialLabel?: string;
  onSave: (draft: ItemDraft) => void;
  onHide: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function ItemEditor({ item, initialLabel = '', onSave, onHide, onDelete, onClose }: ItemEditorProps) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [label, setLabel] = useState(item ? (item.label ?? '') : initialLabel);
  const [hue, setHue] = useState<Hue>(item?.hue ?? 'lavender');
  const [icon, setIcon] = useState<IconId>(item?.icon ?? 'star');
  const [category, setCategory] = useState<Category>(item ? categoryOf(item) : 'other');
  const [note, setNote] = useState(item?.note ?? '');
  const [target, setTarget] = useState(item?.target ?? 1);
  const [daily, setDaily] = useState(item?.daily ?? false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const builtin = item?.builtin ?? false;
  const canSave = builtin || label.trim() !== '';

  return (
    <dialog
      ref={dialogRef}
      class={dialogStyle}
      aria-label={item ? t('editItem') : t('newItem')}
      // Esc fires cancel; clicks on the scrim land on the dialog element itself.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <form
        class={formStyle}
        onSubmit={(event) => {
          event.preventDefault();
          if (canSave) onSave({ label, hue, icon, category, note, target, daily });
        }}
      >
        <h2 class={headingStyle}>{item && builtin ? itemLabel(item, t) : item ? t('editItem') : t('newItem')}</h2>

        {!builtin && (
          <label class={fieldStyle}>
            <span class={fieldLabelStyle}>{t('labelField')}</span>
            <input
              class={inputStyle}
              type="text"
              value={label}
              maxLength={40}
              autoFocus={item === null}
              onInput={(event) => setLabel(event.currentTarget.value)}
            />
          </label>
        )}

        <fieldset class={fieldStyle}>
          <legend class={fieldLabelStyle}>{t('iconField')}</legend>
          <IconPicker value={icon} hue={hue} onChange={setIcon} />
        </fieldset>

        <fieldset class={fieldStyle}>
          <legend class={fieldLabelStyle}>{t('hueField')}</legend>
          <HuePicker value={hue} onChange={setHue} />
        </fieldset>

        <label class={fieldStyle}>
          <span class={fieldLabelStyle}>{t('categoryField')}</span>
          <span class={selectWrapStyle}>
            <select
              class={cx(inputStyle, selectStyle)}
              value={category}
              onChange={(event) => setCategory(event.currentTarget.value as Category)}
            >
              {CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {t(CATEGORY_KEYS[value])}
                </option>
              ))}
            </select>
            <svg {...iconProps} stroke-width={2.4} class={chevronStyle} aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </label>

        <div class={amountRowStyle}>
          <span class={fieldLabelStyle}>{t('targetField')}</span>
          <Stepper
            value={target}
            min={1}
            max={MAX_COUNT}
            decreaseLabel={t('fewerLabel', { name: t('targetField') })}
            increaseLabel={t('moreLabel', { name: t('targetField') })}
            onChange={setTarget}
          />
        </div>

        <label class={toggleStyle}>
          <input
            class={checkboxInputStyle}
            type="checkbox"
            checked={daily}
            onChange={(event) => setDaily(event.currentTarget.checked)}
          />
          <span class={checkboxBoxStyle} aria-hidden="true">
            {daily && (
              <svg {...iconProps} stroke-width={3} class={tickStyle}>
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            )}
          </span>
          {t('dailyField')}
        </label>

        <label class={fieldStyle}>
          <span class={fieldLabelStyle}>{t('noteField')}</span>
          <textarea
            class={cx(inputStyle, noteInputStyle)}
            value={note}
            maxLength={120}
            onInput={(event) => setNote(event.currentTarget.value)}
          />
        </label>

        <div class={actionsStyle}>
          <button type="button" class={buttonStyle} onClick={onClose}>
            {t('cancel')}
          </button>
          <button type="submit" class={primaryButtonStyle} disabled={!canSave}>
            {t('save')}
          </button>
        </div>

        {item && (
          <div class={actionsStyle}>
            <button type="button" class={buttonStyle} onClick={onHide}>
              {t('hideItem')}
            </button>
            {item && canDelete(item) && (
              <button
                type="button"
                class={dangerButtonStyle}
                onClick={() => (confirmingDelete ? onDelete() : setConfirmingDelete(true))}
              >
                {confirmingDelete ? t('confirmDelete') : t('deleteItem')}
              </button>
            )}
          </div>
        )}
      </form>
    </dialog>
  );
}

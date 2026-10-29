import { css, cx } from '../../styled-system/css';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useI18n } from '../i18n/I18nProvider';
import { itemLabel } from '../i18n/itemLabel';
import { CATEGORIES, type Category } from '../state/catalogue';
import { canDelete, categoryOf, type Hue, type Item, type ItemDraft } from '../state/items';
import type { IconId } from '../icons/iconIds';
import { CATEGORY_KEYS } from '../i18n/categoryKeys';
import { HuePicker, IconPicker } from './Pickers';
import { actionsStyle, buttonStyle, dialogStyle, formStyle, headingStyle } from './sheetStyles';

const fieldStyle = css({ display: 'flex', flexDirection: 'column', gap: '2', border: 'none', padding: '0', margin: '0' });

const fieldLabelStyle = css({ fontSize: 'meta', fontWeight: 'bold', color: 'textMuted', padding: '0' });

const inputStyle = css({
  minHeight: 'tapTarget',
  paddingInline: '4',
  border: 'none',
  borderRadius: 'reset',
  bg: 'bg',
  color: 'text',
  fontFamily: 'body',
  // 17px keeps iOS from zooming the page on focus.
  fontSize: 'label',
  fontWeight: 'semibold',
});

const noteInputStyle = css({ minHeight: 'noteField', paddingBlock: '3', resize: 'none' });

const primaryStyle = css({ bg: 'brand', color: 'onBrand', _disabled: { opacity: 'dimmed', cursor: 'default' } });

const dangerStyle = css({ color: 'danger' });

interface ItemEditorProps {
  // null opens the editor for a brand-new custom item.
  item: Item | null;
  onSave: (draft: ItemDraft) => void;
  onHide: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function ItemEditor({ item, onSave, onHide, onDelete, onClose }: ItemEditorProps) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [label, setLabel] = useState(item ? (item.label ?? '') : '');
  const [hue, setHue] = useState<Hue>(item?.hue ?? 'lavender');
  const [icon, setIcon] = useState<IconId>(item?.icon ?? 'star');
  const [category, setCategory] = useState<Category>(item ? categoryOf(item) : 'other');
  const [note, setNote] = useState(item?.note ?? '');
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
          if (canSave) onSave({ label, hue, icon, category, note });
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
          <select
            class={inputStyle}
            value={category}
            onChange={(event) => setCategory(event.currentTarget.value as Category)}
          >
            {CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {t(CATEGORY_KEYS[value])}
              </option>
            ))}
          </select>
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
          <button type="submit" class={cx(buttonStyle, primaryStyle)} disabled={!canSave}>
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
                class={cx(buttonStyle, dangerStyle)}
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

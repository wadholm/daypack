import { css, cx } from '../../styled-system/css';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useI18n } from '../i18n/I18nProvider';
import { itemLabel } from '../i18n/itemLabel';
import type { Hue, Item, ItemDraft } from '../state/items';
import type { IconId } from '../icons/iconIds';
import { HuePicker, IconPicker } from './Pickers';

const dialogStyle = css({
  position: 'fixed',
  insetInline: '0',
  bottom: '0',
  top: 'auto',
  width: 'full',
  maxWidth: 'content',
  maxHeight: 'sheetMax',
  marginInline: 'auto',
  marginBottom: '0',
  padding: '0',
  border: 'none',
  borderTopLeftRadius: 'sheet',
  borderTopRightRadius: 'sheet',
  bg: 'surface',
  color: 'text',
  fontFamily: 'body',
  overflowY: 'auto',
  animationName: 'sheetUp',
  animationDuration: 'sheet',
  animationTimingFunction: 'out',
  _backdrop: {
    bg: 'scrim',
    animationName: 'scrimIn',
    animationDuration: 'sheet',
    _motionReduce: { animationDuration: 'none' },
  },
  _motionReduce: { animationDuration: 'none' },
});

const formStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  padding: '5',
  paddingBottom: 'resetBarBottom',
});

const headingStyle = css({ margin: '0', fontSize: 'wordmark', fontWeight: 'extrabold' });

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

const actionsStyle = css({ display: 'flex', gap: '3' });

const buttonStyle = css({
  flex: '1',
  minHeight: 'tapTarget',
  border: 'none',
  borderRadius: 'full',
  bg: 'bg',
  color: 'text',
  fontFamily: 'body',
  fontSize: 'meta',
  fontWeight: 'bold',
  cursor: 'pointer',
});

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
          if (canSave) onSave({ label, hue, icon, note });
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
            {!builtin && (
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

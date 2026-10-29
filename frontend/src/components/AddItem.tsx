import { css, cx } from '../../styled-system/css';
import { useEffect, useRef, useState } from 'preact/hooks';
import { CATEGORY_KEYS } from '../i18n/categoryKeys';
import { useI18n } from '../i18n/I18nProvider';
import { itemLabel } from '../i18n/itemLabel';
import { ItemIcon } from '../icons/ItemIcon';
import { availableItems, categoryOf, findByLabel, searchItems, type Item } from '../state/items';
import { tileHue } from './hueStyles';
import { labelStyle, noteStyle, rowStyle, textStyle, tileStyle } from './rowStyles';
import {
  actionsStyle,
  buttonStyle,
  dialogStyle,
  formStyle,
  headingStyle,
  inputStyle,
  primaryButtonStyle,
} from './sheetStyles';

const resultsStyle = css({ borderRadius: 'card', bg: 'bg', overflow: 'hidden' });

const hintStyle = css({ margin: '0', color: 'textMuted', fontSize: 'meta', fontWeight: 'semibold' });

const addActionStyle = css({ flexShrink: 0, color: 'brand', fontSize: 'meta', fontWeight: 'bold' });

interface AddItemProps {
  items: readonly Item[];
  onInclude: (id: string) => void;
  // Called only when nothing existing fits; the name is whatever was typed.
  onCreate: (label: string) => void;
  onClose: () => void;
}

// Search what already exists first, so a new custom item is only made for something genuinely new.
export function AddItem({ items, onInclude, onCreate, onClose }: AddItemProps) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const labelOf = (item: Item) => itemLabel(item, t);
  const candidates = availableItems(items);
  const matches = searchItems(candidates, labelOf, query);
  const name = query.trim();
  const existing = findByLabel([...items, ...candidates], labelOf, name);
  const onList = existing !== undefined && !existing.hidden && items.some((item) => item.id === existing.id);

  return (
    <dialog
      ref={dialogRef}
      class={dialogStyle}
      aria-label={t('addItem')}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div class={formStyle}>
        <h2 class={headingStyle}>{t('addItem')}</h2>
        <input
          class={inputStyle}
          type="search"
          value={query}
          maxLength={40}
          placeholder={t('searchItems')}
          aria-label={t('searchItems')}
          onInput={(event) => setQuery(event.currentTarget.value)}
        />

        {onList && <p class={hintStyle}>{t('alreadyOnList', { name })}</p>}

        {matches.length > 0 && (
          <div class={resultsStyle}>
            {matches.map((item) => {
              const label = labelOf(item);
              return (
                <button
                  key={item.id}
                  type="button"
                  class={rowStyle}
                  aria-label={t('addItemLabel', { name: label })}
                  onClick={() => onInclude(item.id)}
                >
                  <span class={cx(tileStyle, tileHue({ hue: item.hue }))}>
                    <ItemIcon id={item.icon} />
                  </span>
                  <span class={textStyle}>
                    <span class={labelStyle}>{label}</span>
                    <span class={noteStyle}>{t(CATEGORY_KEYS[categoryOf(item)])}</span>
                  </span>
                  <span class={addActionStyle}>{t('add')}</span>
                </button>
              );
            })}
          </div>
        )}

        {matches.length === 0 && name === '' && <p class={hintStyle}>{t('nothingToAdd')}</p>}

        <div class={actionsStyle}>
          <button type="button" class={buttonStyle} onClick={onClose}>
            {t('done')}
          </button>
          {existing === undefined && (
            <button type="button" class={primaryButtonStyle} onClick={() => onCreate(name)}>
              {name === '' ? t('createNewItem') : t('createItem', { name })}
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}

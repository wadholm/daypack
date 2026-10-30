import { css } from '../styled-system/css';
import { useState } from 'preact/hooks';
import { AddItem } from './components/AddItem';
import { BottomBar } from './components/BottomBar';
import { ItemEditor } from './components/ItemEditor';
import { ItemList } from './components/ItemList';
import { DaycareList } from './components/DaycareList';
import { ListActions } from './components/ListActions';
import { StarterLists } from './components/StarterLists';
import { Progress } from './components/Progress';
import { TopBar } from './components/TopBar';
import { ViewSwitch, type View } from './components/ViewSwitch';
import { useI18n } from './i18n/I18nProvider';
import { countPacked, progressPercent, useChecked } from './state/checked';
import { daycareItems, editableItems, packItems, useItemList, visibleItems } from './state/items';

// 'new' opens the editor for a fresh custom item; a string is the id being edited.
type EditorTarget = 'new' | string | null;

const pageStyle = css({ position: 'relative', minHeight: 'viewport' });

const glowStyle = css({
  position: 'absolute',
  insetInline: '0',
  top: '0',
  height: 'headerGlow',
  backgroundImage: '{gradients.headerGlow}',
  pointerEvents: 'none',
});

const contentStyle = css({
  position: 'relative',
  maxWidth: 'content',
  marginInline: 'auto',
  paddingTop: 'pageTop',
  paddingBottom: 'pageBottom',
});

const headerStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
  paddingInline: '5',
  paddingBlock: '4',
});

const dateStyle = css({ fontSize: 'meta', fontWeight: 'semibold', color: 'textMuted' });

const titleStyle = css({
  margin: '0',
  fontSize: 'title',
  fontWeight: 'extrabold',
  letterSpacing: 'title',
  whiteSpace: 'nowrap',
});

function formatToday(locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
}

export function App() {
  const { t } = useI18n();
  const list = useItemList();
  const { checked, toggle, forget, reset } = useChecked();
  const [view, setView] = useState<View>('pack');
  const [editing, setEditing] = useState(false);
  // Ids on the list when editing began; see editableItems.
  const [editStart, setEditStart] = useState<ReadonlySet<string>>(new Set());
  const [editorTarget, setEditorTarget] = useState<EditorTarget>(null);
  const [startersOpen, setStartersOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  // Name typed in the add sheet when nothing matched; prefills the editor for the new item.
  const [draftLabel, setDraftLabel] = useState('');

  const visible = visibleItems(list.items);
  const toPack = packItems(list.items);
  const packed = countPacked(toPack.map((item) => item.id), checked);
  const percent = progressPercent(packed, toPack.length);
  const editedItem = list.items.find((item) => item.id === editorTarget) ?? null;
  // Editing works on the full list whichever view it started from, so the pack-style rows serve both.
  const showPackList = view === 'pack' || editing;
  const closeEditor = () => setEditorTarget(null);

  return (
    <div class={pageStyle}>
      <div class={glowStyle} aria-hidden="true" />
      <div class={contentStyle}>
        <TopBar />
        <header class={headerStyle}>
          <span class={dateStyle}>{formatToday(t('dateLocale'))}</span>
          <h1 class={titleStyle}>{t('title')}</h1>
          <Progress packed={packed} total={toPack.length} percent={percent} />
        </header>
        {!editing && <ViewSwitch view={view} onChange={setView} />}
        {showPackList ? (
          <ItemList
            items={editing ? editableItems(list.items, editStart) : toPack}
            emptyText={t(visible.length === 0 ? 'emptyList' : 'allAtDaycare')}
            checked={checked}
            editing={editing}
            onToggle={toggle}
            onEdit={setEditorTarget}
            onSetHidden={list.hide}
          />
        ) : (
          <DaycareList items={daycareItems(list.items)} onSetStock={list.setStock} />
        )}
        <ListActions
          editing={editing}
          onAdd={() => setAdding(true)}
          onEditList={() => {
            setEditStart(new Set(visible.map((item) => item.id)));
            setEditing(true);
          }}
          onStarters={() => setStartersOpen(true)}
        />
      </div>
      {showPackList && (
        <BottomBar
          label={editing ? t('done') : t('reset')}
          onPress={editing ? () => setEditing(false) : reset}
        />
      )}
      {adding && (
        <AddItem
          items={list.items}
          onInclude={list.include}
          onCreate={(label) => {
            setAdding(false);
            setDraftLabel(label);
            setEditorTarget('new');
          }}
          onClose={() => setAdding(false)}
        />
      )}
      {startersOpen && (
        <StarterLists
          items={list.items}
          onToggle={list.setWeather}
          onClose={() => setStartersOpen(false)}
        />
      )}
      {editorTarget !== null && (
        <ItemEditor
          // Remount per target so the form fields reset.
          key={editorTarget}
          item={editedItem}
          initialLabel={draftLabel}
          onClose={closeEditor}
          onSave={(draft) => {
            if (editedItem) list.update(editedItem.id, draft);
            else list.add(draft);
            closeEditor();
          }}
          onHide={() => {
            if (editedItem) list.hide(editedItem.id, true);
            closeEditor();
          }}
          onDelete={() => {
            if (editedItem) {
              list.remove(editedItem.id);
              forget(editedItem.id);
            }
            closeEditor();
          }}
        />
      )}
    </div>
  );
}

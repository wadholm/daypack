import { css } from '../styled-system/css';
import { ItemList } from './components/ItemList';
import { Progress } from './components/Progress';
import { ResetBar } from './components/ResetBar';
import { StatusMessage } from './components/StatusMessage';
import { TopBar } from './components/TopBar';
import { useI18n } from './i18n/I18nProvider';
import { countPacked, progressPercent, useChecked } from './state/checked';
import { useItems } from './state/useItems';

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
  gap: '2',
  paddingInline: '5',
  paddingBlock: '5',
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
  const { t, lang } = useI18n();
  const itemsState = useItems(lang);
  const { checked, toggle, reset } = useChecked();

  const items = itemsState.status === 'ready' ? itemsState.items : [];
  const packed = countPacked(items.map((item) => item.id), checked);
  const percent = progressPercent(packed, items.length);

  return (
    <div class={pageStyle}>
      <div class={glowStyle} aria-hidden="true" />
      <div class={contentStyle}>
        <TopBar />
        <header class={headerStyle}>
          <span class={dateStyle}>{formatToday(t('dateLocale'))}</span>
          <h1 class={titleStyle}>{t('title')}</h1>
          {itemsState.status === 'ready' && <Progress packed={packed} total={items.length} percent={percent} />}
        </header>
        {itemsState.status === 'ready' ? (
          <ItemList items={items} checked={checked} onToggle={toggle} />
        ) : (
          <StatusMessage
            {...(itemsState.status === 'error'
              ? { status: 'error' as const, onRetry: itemsState.retry }
              : { status: 'loading' as const })}
          />
        )}
      </div>
      {itemsState.status === 'ready' && <ResetBar onReset={reset} />}
    </div>
  );
}

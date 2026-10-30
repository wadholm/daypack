import { css } from '../../styled-system/css';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useI18n } from '../i18n/I18nProvider';
import type { TranslationKey } from '../i18n/en';
import { inviteLink, parseInviteInput } from '../state/household';
import type { Sync, SyncStatus } from '../state/useSync';
import { actionsStyle, buttonStyle, dangerButtonStyle, dialogStyle, formStyle, headingStyle, inputStyle, primaryButtonStyle } from './sheetStyles';

const STATUS_KEYS: Record<SyncStatus, TranslationKey> = {
  idle: 'householdStatusIdle',
  syncing: 'householdStatusSyncing',
  offline: 'householdStatusOffline',
};

const textStyle = css({ margin: '0', color: 'textMuted', fontSize: 'meta', fontWeight: 'semibold' });

const statusStyle = css({ margin: '0', fontSize: 'label', fontWeight: 'bold' });

const errorStyle = css({ margin: '0', color: 'danger', fontSize: 'meta', fontWeight: 'semibold' });

interface HouseholdSheetProps {
  sync: Sync;
  onClose: () => void;
}

type Problem = 'failed' | 'invalid' | null;

export function HouseholdSheet({ sync, onClose }: HouseholdSheetProps) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [invite, setInvite] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [problem, setProblem] = useState<Problem>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  // The invite is read from the server rather than kept on the device, so any member can share it.
  useEffect(() => {
    if (!sync.connected) return setInvite(null);
    let current = true;
    void sync.loadInvite().then((value) => current && setInvite(value));
    return () => {
      current = false;
    };
  }, [sync.connected]);

  const guarded = async (action: () => Promise<Problem>) => {
    setBusy(true);
    setProblem(null);
    setProblem(await action());
    setBusy(false);
  };

  const link = invite ? inviteLink(location.origin, invite) : '';
  const code = parseInviteInput(typed);

  return (
    <dialog
      ref={dialogRef}
      class={dialogStyle}
      aria-label={t('household')}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div class={formStyle}>
        <h2 class={headingStyle}>{t('household')}</h2>
        {sync.connected ? (
          <>
            <p class={statusStyle} role="status">
              {t(STATUS_KEYS[sync.status])}
            </p>
            <p class={textStyle}>{t('householdInviteHint')}</p>
            <input class={inputStyle} readOnly value={link} aria-label={t('householdInviteLabel')} onFocus={(e) => e.currentTarget.select()} />
            <div class={actionsStyle}>
              <button
                type="button"
                class={primaryButtonStyle}
                disabled={!invite}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(link);
                    setCopied(true);
                  } catch {
                    // Clipboard access can be refused; the link is selectable in the field above.
                  }
                }}
              >
                {t(copied ? 'householdCopied' : 'householdCopy')}
              </button>
              <button
                type="button"
                class={buttonStyle}
                disabled={busy}
                onClick={() =>
                  guarded(async () => {
                    const next = await sync.newInvite();
                    setCopied(false);
                    if (next) setInvite(next);
                    return next ? null : 'failed';
                  })
                }
              >
                {t('householdNewLink')}
              </button>
            </div>
            <p class={textStyle}>{t('householdNewLinkHint')}</p>
            <button type="button" class={dangerButtonStyle} disabled={busy} onClick={() =>
                guarded(async () => {
                  await sync.leave();
                  return null;
                })
              }>
              {t('householdLeave')}
            </button>
          </>
        ) : (
          <>
            <p class={textStyle}>{t('householdIntro')}</p>
            <button
              type="button"
              class={primaryButtonStyle}
              disabled={busy}
              onClick={() => guarded(async () => ((await sync.create()) ? null : 'failed'))}
            >
              {t('householdStart')}
            </button>
            <p class={textStyle}>{t('householdJoinLabel')}</p>
            <input
              class={inputStyle}
              value={typed}
              aria-label={t('householdJoinLabel')}
              autocomplete="off"
              autocapitalize="off"
              onInput={(event) => setTyped(event.currentTarget.value)}
            />
            <button
              type="button"
              class={buttonStyle}
              disabled={busy || code === null}
              onClick={() =>
                code &&
                guarded(async () => {
                  const outcome = await sync.join(code);
                  return outcome === 'joined' ? null : outcome;
                })
              }
            >
              {t('householdJoin')}
            </button>
          </>
        )}
        {problem && <p class={errorStyle}>{t(problem === 'invalid' ? 'householdInvalid' : 'householdError')}</p>}
        <div class={actionsStyle}>
          <button type="button" class={buttonStyle} onClick={onClose}>
            {t('done')}
          </button>
        </div>
      </div>
    </dialog>
  );
}

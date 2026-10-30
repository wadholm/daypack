import { css } from '../../styled-system/css';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useI18n } from '../i18n/I18nProvider';
import { actionsStyle, buttonStyle, dialogStyle, formStyle, headingStyle, primaryButtonStyle } from './sheetStyles';

const textStyle = css({ margin: '0', color: 'textMuted', fontSize: 'meta', fontWeight: 'semibold' });

const errorStyle = css({ margin: '0', color: 'danger', fontSize: 'meta', fontWeight: 'semibold' });

interface JoinPromptProps {
  // Resolves to an error key when joining fails.
  onJoin: () => Promise<'invalid' | 'failed' | null>;
  onClose: () => void;
}

// Shown when the app is opened from an invite link. Joining replaces the list on this device, so it is confirmed first.
export function JoinPrompt({ onJoin, onClose }: JoinPromptProps) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<'invalid' | 'failed' | null>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      class={dialogStyle}
      aria-label={t('joinTitle')}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div class={formStyle}>
        <h2 class={headingStyle}>{t('joinTitle')}</h2>
        <p class={textStyle}>{t('joinBody')}</p>
        {problem && <p class={errorStyle}>{t(problem === 'invalid' ? 'householdInvalid' : 'householdError')}</p>}
        <div class={actionsStyle}>
          <button type="button" class={buttonStyle} onClick={onClose}>
            {t('cancel')}
          </button>
          <button
            type="button"
            class={primaryButtonStyle}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const result = await onJoin();
              setBusy(false);
              if (result) setProblem(result);
              else onClose();
            }}
          >
            {t('householdJoin')}
          </button>
        </div>
      </div>
    </dialog>
  );
}

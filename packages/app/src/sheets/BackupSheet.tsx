import { useState } from 'react';
import { useAppState, relTime, isBackupStale, daysSince } from '../state';
import { useToast, Sheet, Button, IconButton } from '../ui';
import { useNav } from '../nav/context';
import { uploadSnapshot } from '../backup/client';

export function BackupSheet() {
  const { state, mutators } = useAppState();
  const { closeSheet } = useNav();
  const toast = useToast();

  const [copied, setCopied] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const stale = isBackupStale(state);
  const d = daysSince(state.lastBackupAt);

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(state.backupKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  const submit = async () => {
    setPhase('uploading');
    setError(null);
    try {
      await uploadSnapshot(state);
      mutators.markBackedUp();
      setPhase('done');
      toast('Backup complete');
      setTimeout(closeSheet, 900);
    } catch (e) {
      setPhase('error');
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const metaText =
    state.lastBackupAt === null
      ? 'Never backed up'
      : stale
        ? `${d} day${d === 1 ? '' : 's'} ago`
        : `Last: ${relTime(state.lastBackupAt)}`;

  return (
    <Sheet open title="Back up" onClose={closeSheet}>
      <div className="field">
        <div className="field-label">Your backup key</div>
        <div className="key-box">
          <span className="mono">{state.backupKey}</span>
          <IconButton
            name={copied ? 'check' : 'copy'}
            label={copied ? 'Copied' : 'Copy key'}
            onClick={copyKey}
          />
        </div>
        <div className="footer-meta" style={{ marginTop: 6 }}>
          {metaText}
        </div>
      </div>

      <Button
        variant="accent"
        onClick={submit}
        disabled={phase === 'uploading' || phase === 'done'}
      >
        {phase === 'uploading' ? 'Uploading…' : phase === 'done' ? 'Done ✓' : 'Upload backup'}
      </Button>

      {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12 }}>{error}</p>}
    </Sheet>
  );
}

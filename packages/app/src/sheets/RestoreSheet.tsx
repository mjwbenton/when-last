import { useState } from 'react';
import { useAppState, BACKUP_KEY_PATTERN } from '../state';
import { useToast, Sheet, Button, Field, Input } from '../ui';
import { useNav } from '../nav/context';
import { downloadSnapshot } from '../backup/client';

export function RestoreSheet() {
  const { state, mutators } = useAppState();
  const { closeSheet, openScreen } = useNav();
  const toast = useToast();

  const [mode, setMode] = useState<'device' | 'custom'>('device');
  const [customKey, setCustomKey] = useState('');
  const [phase, setPhase] = useState<'idle' | 'fetching' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const effectiveKey = mode === 'device' ? state.backupKey : customKey.trim();
  const keyValid = BACKUP_KEY_PATTERN.test(effectiveKey);

  const submit = async () => {
    if (!keyValid) return;
    setPhase('fetching');
    setError(null);
    try {
      const snapshot = await downloadSnapshot(effectiveKey);
      mutators.restoreFromSnapshot(snapshot);
      setPhase('done');
      toast('Restore complete');
      openScreen({ name: 'home' });
      setTimeout(closeSheet, 900);
    } catch (e) {
      setPhase('error');
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Sheet open title="Restore" onClose={closeSheet}>
      <div className="seg">
        <button
          type="button"
          className={['seg-opt', mode === 'device' && 'active'].filter(Boolean).join(' ')}
          onClick={() => setMode('device')}
        >
          This device&apos;s key
        </button>
        <button
          type="button"
          className={['seg-opt', mode === 'custom' && 'active'].filter(Boolean).join(' ')}
          onClick={() => setMode('custom')}
        >
          Custom key
        </button>
      </div>

      {mode === 'device' ? (
        <div className="key-box" style={{ marginTop: 14 }}>
          <span className="mono">{state.backupKey}</span>
        </div>
      ) : (
        <div style={{ marginTop: 14 }}>
          <Field label="Backup key">
            {({ inputId }) => (
              <Input
                id={inputId}
                className="mono"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value.toLowerCase())}
                placeholder="wl-xxxx-xxxx-xxxx"
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
              />
            )}
          </Field>
        </div>
      )}

      <Button
        variant="accent"
        onClick={submit}
        disabled={!keyValid || phase === 'fetching' || phase === 'done'}
        style={{ marginTop: 16 }}
      >
        {phase === 'fetching' ? 'Fetching & restoring…' : phase === 'done' ? 'Done ✓' : 'Restore'}
      </Button>

      {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12 }}>{error}</p>}
    </Sheet>
  );
}

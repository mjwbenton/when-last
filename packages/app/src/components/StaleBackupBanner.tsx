import { useAppState, daysSince, isBackupStale } from '../state';
import { useNav } from '../nav/context';

export function StaleBackupBanner() {
  const { state } = useAppState();
  const { openSheet } = useNav();
  if (!isBackupStale(state)) return null;

  const d = daysSince(state.lastBackupAt);
  const label = d === Infinity ? 'never' : `${d} day${d === 1 ? '' : 's'}`;

  return (
    <button
      type="button"
      className="stale"
      onClick={() => openSheet({ kind: 'backup' })}
      style={{ width: 'calc(100% - var(--pad) * 2)', border: 'none', textAlign: 'left' }}
    >
      <span className="dotpulse" aria-hidden />
      <span style={{ flex: 1 }}>
        It&apos;s been <strong>{label}</strong> since your last backup.
      </span>
      <span style={{ fontWeight: 500 }}>Back up →</span>
    </button>
  );
}

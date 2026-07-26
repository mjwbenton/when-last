import { useAppState, isBackupStale, relTime, daysSince } from '../state';
import { useNav } from '../nav/context';
import { Button } from '../ui';
import { Icon } from '../icons';

export function BackupFooter() {
  const { state } = useAppState();
  const { openSheet } = useNav();
  const stale = isBackupStale(state);
  const d = daysSince(state.lastBackupAt);
  const metaText =
    state.lastBackupAt === null
      ? 'Never backed up'
      : stale
        ? `${d} day${d === 1 ? '' : 's'} ago`
        : `Last: ${relTime(state.lastBackupAt)}`;

  return (
    <footer className="footer">
      <div className="footer-head">
        <div className="footer-title">Backup</div>
        <div className={['footer-meta', stale && 'stale'].filter(Boolean).join(' ')}>
          {stale && <Icon name="alert" size={12} style={{ verticalAlign: '-2px' }} />} {metaText}
        </div>
      </div>
      <div className="footer-btns">
        <Button variant="ghost" onClick={() => openSheet({ kind: 'backup' })}>
          <Icon name="upload" size={16} /> Backup
        </Button>
        <Button variant="ghost" onClick={() => openSheet({ kind: 'restore' })}>
          <Icon name="download" size={16} /> Restore
        </Button>
      </div>
    </footer>
  );
}

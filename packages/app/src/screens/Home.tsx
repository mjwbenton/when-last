import { useAppState, sortedActions, lastLoggedAt, relativeTime } from '../state';
import { useNav } from '../nav/context';
import { StaleBackupBanner } from '../components/StaleBackupBanner';
import { BackupFooter } from '../components/BackupFooter';

export function Home() {
  const { state } = useAppState();
  const { openScreen, openSheet } = useNav();
  const actions = sortedActions(state);

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div className="home-body">
        <div className="home-head">
          <h1 className="home-title">When Last?</h1>
        </div>

        <StaleBackupBanner />

        <div className="tile-grid">
          {actions.map((a) => {
            const last = lastLoggedAt(a);
            return (
              <button
                key={a.id}
                type="button"
                className="tile"
                onClick={() => openScreen({ name: 'action', actionId: a.id })}
              >
                <div className="tile-name">{a.name}</div>
                <div className={['tile-last', last === null && 'never'].filter(Boolean).join(' ')}>
                  {last === null ? 'Never logged' : relativeTime(last)}
                </div>
              </button>
            );
          })}

          <button
            type="button"
            className="tile-add"
            aria-label="Add action"
            onClick={() => openSheet({ kind: 'add-action' })}
          >
            <span className="tile-add-plus">+</span>
          </button>
        </div>
      </div>

      <BackupFooter />
    </div>
  );
}

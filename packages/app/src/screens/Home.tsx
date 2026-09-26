import { Fragment } from 'react';
import {
  useAppState,
  groupedActions,
  lastLoggedAt,
  relativeTime,
  colorForCategory,
} from '../state';
import { useNav } from '../nav/context';
import { StaleBackupBanner } from '../components/StaleBackupBanner';
import { BackupFooter } from '../components/BackupFooter';

export function Home() {
  const { state } = useAppState();
  const { openScreen, openSheet } = useNav();
  const groups = groupedActions(state);
  const showHeaders = state.categories.length > 0;

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div className="home-body">
        <div className="home-head">
          <h1 className="home-title">When Last?</h1>
          <button
            type="button"
            className="home-manage"
            onClick={() => openSheet({ kind: 'categories' })}
          >
            Categories
          </button>
        </div>

        <StaleBackupBanner />

        <div className="tile-grid">
          {groups.map((group) => (
            <Fragment key={group.category?.id ?? 'uncategorized'}>
              {showHeaders && (
                <div className="group-head">
                  {group.category && (
                    <span
                      className="group-dot"
                      style={{ background: group.category.color }}
                      aria-hidden
                    />
                  )}
                  {group.category?.name ?? 'Uncategorized'}
                </div>
              )}
              {group.actions.map((a) => {
                const last = lastLoggedAt(a);
                const color = colorForCategory(state.categories, a.categoryId);
                return (
                  <button
                    key={a.id}
                    type="button"
                    className="tile"
                    onClick={() => openScreen({ name: 'action', actionId: a.id })}
                  >
                    <div className="tile-name">{a.name}</div>
                    <div
                      className={['tile-last', last === null && 'never'].filter(Boolean).join(' ')}
                      style={color ? { color } : undefined}
                    >
                      {last === null ? 'Never logged' : relativeTime(last)}
                    </div>
                  </button>
                );
              })}
            </Fragment>
          ))}

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

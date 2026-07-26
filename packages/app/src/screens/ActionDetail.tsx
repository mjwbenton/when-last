import { useEffect, useState } from 'react';
import { useAppState, relativeTime, exactTime, toLocalInputValue } from '../state';
import { useNav } from '../nav/context';

type Props = { actionId: string };

export function ActionDetail({ actionId }: Props) {
  const { state, mutators } = useAppState();
  const { openScreen } = useNav();
  const action = state.actions.find((a) => a.id === actionId);

  const [showCustom, setShowCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!action) openScreen({ name: 'home' });
  }, [action, openScreen]);

  if (!action) return null;

  const logs = [...action.logs].sort((a, b) => b - a);

  const logNow = () => {
    mutators.logNow(action.id);
    setShowCustom(false);
  };

  const toggleCustom = () => {
    setShowCustom((prev) => {
      const next = !prev;
      if (next) setCustomValue(toLocalInputValue(Date.now()));
      return next;
    });
  };

  const saveCustom = () => {
    if (!customValue) return;
    const ts = new Date(customValue).getTime();
    if (Number.isNaN(ts)) return;
    mutators.logAt(action.id, ts);
    setShowCustom(false);
  };

  return (
    <div className="page detail">
      <div className="detail-top">
        <button
          type="button"
          className="detail-back"
          aria-label="Back"
          onClick={() => openScreen({ name: 'home' })}
        >
          ←
        </button>
        <h2 className="detail-name">{action.name}</h2>
      </div>

      <button type="button" className="log-now" onClick={logNow}>
        Log — done now
      </button>

      {showCustom && (
        <div className="custom-time">
          <input
            type="datetime-local"
            className="custom-time-input"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
          />
          <button type="button" className="custom-time-save" onClick={saveCustom}>
            Save
          </button>
        </div>
      )}

      <button type="button" className="custom-time-toggle" onClick={toggleCustom}>
        {showCustom ? 'Cancel custom time' : 'Log a different time…'}
      </button>

      <div className="history-label">History</div>

      {logs.length > 0 ? (
        <div className="history-list">
          {logs.map((ts, idx) => {
            const isExpanded = expanded[idx] ?? false;
            return (
              <button
                key={idx}
                type="button"
                className="history-row"
                onClick={() => setExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }))}
              >
                <span>{isExpanded ? exactTime(ts) : relativeTime(ts)}</span>
                <span className="history-hint">
                  {isExpanded ? relativeTime(ts) : exactTime(ts)}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="history-empty">No entries yet.</div>
      )}
    </div>
  );
}

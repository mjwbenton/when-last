import { useRef, useState } from 'react';
import { useDrag } from '@use-gesture/react';
import { relativeTime, exactTime } from '../state';
import { IconButton } from '../ui';

const OPEN_OFFSET = -76;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

type HistoryRowProps = {
  timestamp: number;
  expanded: boolean;
  onToggleExpanded: () => void;
  onDelete: () => void;
};

export function HistoryRow({ timestamp, expanded, onToggleExpanded, onDelete }: HistoryRowProps) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const isOpenRef = useRef(false);

  const bind = useDrag(
    ({ active, movement: [mx], last, tap }) => {
      setDragging(active);
      if (tap) {
        if (isOpenRef.current) {
          isOpenRef.current = false;
          setOffset(0);
        } else {
          onToggleExpanded();
        }
        return;
      }
      const next = clamp((isOpenRef.current ? OPEN_OFFSET : 0) + mx, OPEN_OFFSET, 0);
      setOffset(next);
      if (last) {
        const openNow = next <= OPEN_OFFSET / 2;
        isOpenRef.current = openNow;
        setOffset(openNow ? OPEN_OFFSET : 0);
      }
    },
    { axis: 'x', filterTaps: true, bounds: { left: OPEN_OFFSET, right: 0 } },
  );

  const isOpen = offset <= OPEN_OFFSET / 2;

  return (
    <div className="history-row-wrap">
      <IconButton
        name="trash"
        label="Delete entry"
        className="history-row-delete"
        tabIndex={isOpen ? 0 : -1}
        aria-hidden={!isOpen}
        onClick={onDelete}
      />
      <button
        {...bind()}
        type="button"
        className="history-row"
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? 'none' : 'transform 200ms ease',
          touchAction: 'pan-y',
        }}
      >
        <span>{expanded ? exactTime(timestamp) : relativeTime(timestamp)}</span>
        <span className="history-hint">
          {expanded ? relativeTime(timestamp) : exactTime(timestamp)}
        </span>
      </button>
    </div>
  );
}

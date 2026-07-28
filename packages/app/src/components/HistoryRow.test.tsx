import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { HistoryRow } from './HistoryRow';

const POINTER = { pointerId: 1, buttons: 1, pointerType: 'mouse' } as const;

function tap(row: Element, x = 100) {
  fireEvent.pointerDown(row, { clientX: x, clientY: 0, ...POINTER });
  fireEvent.pointerUp(row, { clientX: x, clientY: 0, ...POINTER });
}

function swipeLeft(row: Element, startX: number, deltaX: number) {
  fireEvent.pointerDown(row, { clientX: startX, clientY: 0, ...POINTER });
  fireEvent.pointerMove(row, { clientX: startX + deltaX, clientY: 0, ...POINTER });
  fireEvent.pointerUp(row, { clientX: startX + deltaX, clientY: 0, ...POINTER });
}

describe('HistoryRow', () => {
  it('a tap on a closed row toggles expanded rather than revealing delete', () => {
    const onToggleExpanded = vi.fn();
    const onDelete = vi.fn();
    const { container } = render(
      <HistoryRow
        timestamp={1000}
        expanded={false}
        onToggleExpanded={onToggleExpanded}
        onDelete={onDelete}
      />,
    );
    const row = container.querySelector('.history-row')!;
    tap(row);
    expect(onToggleExpanded).toHaveBeenCalledOnce();
    expect(onDelete).not.toHaveBeenCalled();

    const deleteBtn = container.querySelector('.history-row-delete')!;
    expect(deleteBtn.getAttribute('aria-hidden')).toBe('true');
    expect(deleteBtn.getAttribute('tabindex')).toBe('-1');
  });

  it('a leftward swipe past the threshold reveals delete, and clicking it deletes', () => {
    const onToggleExpanded = vi.fn();
    const onDelete = vi.fn();
    const { container } = render(
      <HistoryRow
        timestamp={1000}
        expanded={false}
        onToggleExpanded={onToggleExpanded}
        onDelete={onDelete}
      />,
    );
    const row = container.querySelector('.history-row')!;
    swipeLeft(row, 100, -60);

    expect(onToggleExpanded).not.toHaveBeenCalled();
    const deleteBtn = container.querySelector('.history-row-delete')!;
    expect(deleteBtn.getAttribute('aria-hidden')).toBe('false');
    expect(deleteBtn.getAttribute('tabindex')).toBe('0');

    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('tapping an open row closes it without toggling or deleting', () => {
    const onToggleExpanded = vi.fn();
    const onDelete = vi.fn();
    const { container } = render(
      <HistoryRow
        timestamp={1000}
        expanded={false}
        onToggleExpanded={onToggleExpanded}
        onDelete={onDelete}
      />,
    );
    const row = container.querySelector('.history-row')!;
    swipeLeft(row, 100, -60);
    const deleteBtn = container.querySelector('.history-row-delete')!;
    expect(deleteBtn.getAttribute('aria-hidden')).toBe('false');

    tap(row, 100);

    expect(onToggleExpanded).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
    expect(deleteBtn.getAttribute('aria-hidden')).toBe('true');
  });
});

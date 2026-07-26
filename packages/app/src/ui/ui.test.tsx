import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sheet } from './Sheet';
import { ToastProvider, useToast } from './Toast';

describe('Sheet', () => {
  function SheetHarness({ onClose }: { onClose: () => void }) {
    return (
      <Sheet open title="New action" onClose={onClose}>
        <div>body content</div>
      </Sheet>
    );
  }

  it('renders title and body when open', () => {
    render(<SheetHarness onClose={() => {}} />);
    expect(screen.getByRole('dialog', { name: 'New action' })).toBeInTheDocument();
    expect(screen.getByText('body content')).toBeInTheDocument();
  });

  it('scrim click triggers onClose', () => {
    const onClose = vi.fn();
    const { container } = render(<SheetHarness onClose={onClose} />);
    const scrim = container.querySelector('.sheet-scrim');
    expect(scrim).not.toBeNull();
    fireEvent.click(scrim!);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('Cancel button triggers onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<SheetHarness onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe('Toast', () => {
  function ToastHarness() {
    const toast = useToast();
    return <button onClick={() => toast('Added Watered plants')}>fire</button>;
  }

  it('shows message on fire and auto-dismisses after ~2s', () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText('fire'));
    expect(screen.getByRole('status')).toHaveTextContent('Added Watered plants');
    expect(screen.getByRole('status').className).toContain('show');
    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(screen.getByRole('status').className).not.toContain('show');
    vi.useRealTimers();
  });
});

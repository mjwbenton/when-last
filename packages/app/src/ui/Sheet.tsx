import { useEffect, useState, type ReactNode } from 'react';

type SheetProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  children: ReactNode;
};

const EXIT_MS = 260;

export function Sheet({
  open,
  title,
  onClose,
  actionLabel,
  onAction,
  actionDisabled,
  children,
}: SheetProps) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      // force next tick to flip .open so the transition runs
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), EXIT_MS);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <>
      <div
        className={['sheet-scrim', visible && 'open'].filter(Boolean).join(' ')}
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={['sheet', visible && 'open'].filter(Boolean).join(' ')}
      >
        <div className="sheet-grabber" />
        <div className="sheet-head">
          <button type="button" className="sheet-close" onClick={onClose}>
            Cancel
          </button>
          <div className="sheet-title">{title}</div>
          {actionLabel ? (
            <button
              type="button"
              className="sheet-action"
              onClick={onAction}
              disabled={actionDisabled}
            >
              {actionLabel}
            </button>
          ) : (
            <span style={{ width: 52 }} />
          )}
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </>
  );
}

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

type ToastApi = (message: string) => void;

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const show = useCallback<ToastApi>((m) => {
    setMessage(m);
    setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(t);
  }, [visible, message]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {message !== null && (
        <div
          role="status"
          aria-live="polite"
          className={['toast', visible && 'show'].filter(Boolean).join(' ')}
        >
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const fn = useContext(ToastContext);
  if (!fn) throw new Error('useToast must be used inside <ToastProvider>');
  return fn;
}

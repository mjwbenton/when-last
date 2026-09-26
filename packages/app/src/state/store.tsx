import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { AppState } from './types';
import { loadState, saveState } from './persistence';
import * as M from './mutators';

type Mutators = {
  addAction: (args: Parameters<typeof M.addAction>[1]) => void;
  setActionCategory: (actionId: string, categoryId: string | null) => void;
  addCategory: (args: Parameters<typeof M.addCategory>[1]) => void;
  renameCategory: (categoryId: string, name: string) => void;
  removeCategory: (categoryId: string) => void;
  logNow: (actionId: string) => void;
  logAt: (actionId: string, timestamp: number) => void;
  removeLog: (actionId: string, timestamp: number) => void;
  markBackedUp: (at?: number) => void;
  restoreFromSnapshot: (snapshot: AppState) => void;
};

type Ctx = { state: AppState; mutators: Mutators };

const StateContext = createContext<Ctx | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    saveState(state);
  }, [state]);

  const apply = useCallback(<A extends unknown[]>(fn: (s: AppState, ...args: A) => AppState) => {
    return (...args: A) => {
      setState((prev) => fn(prev, ...args));
    };
  }, []);

  const mutators = useMemo<Mutators>(
    () => ({
      addAction: apply(M.addAction),
      setActionCategory: (actionId, categoryId) =>
        setState((prev) => M.setActionCategory(prev, actionId, categoryId)),
      addCategory: apply(M.addCategory),
      renameCategory: (categoryId, name) =>
        setState((prev) => M.renameCategory(prev, categoryId, name)),
      removeCategory: (categoryId) => setState((prev) => M.removeCategory(prev, categoryId)),
      logNow: (actionId) => setState((prev) => M.logNow(prev, actionId)),
      logAt: (actionId, timestamp) => setState((prev) => M.logAt(prev, actionId, timestamp)),
      removeLog: (actionId, timestamp) =>
        setState((prev) => M.removeLog(prev, actionId, timestamp)),
      markBackedUp: (at) => setState((prev) => M.markBackedUp(prev, at)),
      restoreFromSnapshot: apply(M.restoreFromSnapshot),
    }),
    [apply],
  );

  const value = useMemo(() => ({ state, mutators }), [state, mutators]);
  return <StateContext.Provider value={value}>{children}</StateContext.Provider>;
}

export function useAppState(): Ctx {
  const ctx = useContext(StateContext);
  if (!ctx) throw new Error('useAppState must be used inside <AppStateProvider>');
  return ctx;
}

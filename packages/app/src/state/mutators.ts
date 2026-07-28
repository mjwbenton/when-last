import type { AppState, TrackedAction } from './types';
import { uid } from './id';

export function addAction(state: AppState, args: { name: string }): AppState {
  const action: TrackedAction = {
    id: uid('action'),
    name: args.name.trim(),
    logs: [],
  };
  return { ...state, actions: [...state.actions, action] };
}

export function logNow(state: AppState, actionId: string): AppState {
  const now = Date.now();
  return {
    ...state,
    actions: state.actions.map((a) => (a.id === actionId ? { ...a, logs: [now, ...a.logs] } : a)),
  };
}

export function logAt(state: AppState, actionId: string, timestamp: number): AppState {
  return {
    ...state,
    actions: state.actions.map((a) =>
      a.id === actionId ? { ...a, logs: [...a.logs, timestamp].sort((x, y) => y - x) } : a,
    ),
  };
}

export function removeLog(state: AppState, actionId: string, timestamp: number): AppState {
  return {
    ...state,
    actions: state.actions.map((a) => {
      if (a.id !== actionId) return a;
      const idx = a.logs.indexOf(timestamp);
      if (idx === -1) return a;
      const logs = [...a.logs];
      logs.splice(idx, 1);
      return { ...a, logs };
    }),
  };
}

export function markBackedUp(state: AppState, at: number = Date.now()): AppState {
  return { ...state, lastBackupAt: at };
}

export function restoreFromSnapshot(state: AppState, snapshot: AppState): AppState {
  return { ...snapshot, backupKey: state.backupKey };
}

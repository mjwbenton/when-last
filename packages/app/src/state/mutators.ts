import type { AppState, Category, TrackedAction } from './types';
import { uid } from './id';
import { nextCategoryColor } from './categoryColors';

export function addAction(
  state: AppState,
  args: { name: string; categoryId?: string | null },
): AppState {
  const action: TrackedAction = {
    id: uid('action'),
    name: args.name.trim(),
    logs: [],
    categoryId: args.categoryId ?? null,
  };
  return { ...state, actions: [...state.actions, action] };
}

export function setActionCategory(
  state: AppState,
  actionId: string,
  categoryId: string | null,
): AppState {
  return {
    ...state,
    actions: state.actions.map((a) => (a.id === actionId ? { ...a, categoryId } : a)),
  };
}

export function addCategory(
  state: AppState,
  args: { name: string; id?: string; color?: string },
): AppState {
  const name = args.name.trim();
  if (!name) return state;
  if (state.categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) return state;
  const category: Category = {
    id: args.id ?? uid('cat'),
    name,
    color: args.color ?? nextCategoryColor(state.categories.map((c) => c.color)),
  };
  return { ...state, categories: [...state.categories, category] };
}

export function setCategoryColor(state: AppState, categoryId: string, color: string): AppState {
  return {
    ...state,
    categories: state.categories.map((c) => (c.id === categoryId ? { ...c, color } : c)),
  };
}

export function renameCategory(state: AppState, categoryId: string, name: string): AppState {
  const trimmed = name.trim();
  if (!trimmed) return state;
  if (
    state.categories.some(
      (c) => c.id !== categoryId && c.name.toLowerCase() === trimmed.toLowerCase(),
    )
  ) {
    return state;
  }
  return {
    ...state,
    categories: state.categories.map((c) => (c.id === categoryId ? { ...c, name: trimmed } : c)),
  };
}

export function removeCategory(state: AppState, categoryId: string): AppState {
  return {
    ...state,
    categories: state.categories.filter((c) => c.id !== categoryId),
    actions: state.actions.map((a) =>
      a.categoryId === categoryId ? { ...a, categoryId: null } : a,
    ),
  };
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

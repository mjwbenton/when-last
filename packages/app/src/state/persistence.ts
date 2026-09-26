import type { AppState } from './types';
import { generateBackupKey } from './id';

export const STATE_KEY = 'whenlast.state.v1';

export function emptyState(): AppState {
  return {
    actions: [],
    categories: [],
    backupKey: generateBackupKey(),
    lastBackupAt: null,
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      // Migrate pre-category state in place: `categories` defaults to empty and
      // each action's missing `categoryId` becomes null.
      return {
        ...emptyState(),
        ...parsed,
        categories: Array.isArray(parsed.categories) ? parsed.categories : [],
        actions: Array.isArray(parsed.actions)
          ? parsed.actions.map((a) => ({ ...a, categoryId: a.categoryId ?? null }))
          : [],
      };
    }
  } catch {
    // fall through to empty state
  }
  const fresh = emptyState();
  saveState(fresh);
  return fresh;
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable — in-memory only for this session
  }
}

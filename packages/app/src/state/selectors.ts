import type { AppState, Category, TrackedAction } from './types';

const DAY_MS = 1000 * 60 * 60 * 24;
export const BACKUP_STALE_DAYS = 15;

// ── Action-log formatting (reproduced from the design spec) ──────────────────

export function relativeTime(ts: number | null, now: number = Date.now()): string {
  if (ts == null) return 'Never';
  const diff = now - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min} ${min === 1 ? 'min' : 'mins'} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ${hr === 1 ? 'hr' : 'hrs'} ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d} ${d === 1 ? 'day' : 'days'} ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w} ${w === 1 ? 'week' : 'weeks'} ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} ${mo === 1 ? 'month' : 'months'} ago`;
  const y = Math.floor(d / 365);
  return `${y} ${y === 1 ? 'year' : 'years'} ago`;
}

export function exactTime(ts: number): string {
  const d = new Date(ts);
  const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const timeStr = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${dateStr}, ${timeStr}`;
}

export function toLocalInputValue(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

export function lastLoggedAt(action: TrackedAction): number | null {
  return action.logs.length ? Math.max(...action.logs) : null;
}

export function sortedActions(state: AppState): TrackedAction[] {
  return [...state.actions].sort((a, b) => {
    const la = lastLoggedAt(a) ?? -1;
    const lb = lastLoggedAt(b) ?? -1;
    return lb - la;
  });
}

export type ActionGroup = { category: Category | null; actions: TrackedAction[] };

// Actions grouped by category, each group sorted most-recently-logged first.
// Categories keep their creation order; uncategorized actions come last. Empty
// groups are omitted so the home grid stays dense.
export function groupedActions(state: AppState): ActionGroup[] {
  const sorted = sortedActions(state);
  const known = new Set(state.categories.map((c) => c.id));

  const groups: ActionGroup[] = [];
  for (const category of state.categories) {
    const actions = sorted.filter((a) => a.categoryId === category.id);
    if (actions.length) groups.push({ category, actions });
  }

  const uncategorized = sorted.filter((a) => a.categoryId === null || !known.has(a.categoryId));
  if (uncategorized.length) groups.push({ category: null, actions: uncategorized });

  return groups;
}

// ── Backup-feature helpers (coarser day/hour/min formatting) ─────────────────

export function daysSince(ts: number | null, now: number = Date.now()): number {
  if (ts === null) return Infinity;
  return Math.floor((now - ts) / DAY_MS);
}

export function isBackupStale(state: AppState, now: number = Date.now()): boolean {
  return daysSince(state.lastBackupAt, now) > BACKUP_STALE_DAYS;
}

export function relTime(ts: number | null, now: number = Date.now()): string {
  if (ts === null) return 'never';
  const diff = now - ts;
  const d = Math.floor(diff / DAY_MS);
  if (d >= 1) return `${d} day${d === 1 ? '' : 's'} ago`;
  const h = Math.floor(diff / (1000 * 60 * 60));
  if (h >= 1) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const m = Math.max(1, Math.floor(diff / (1000 * 60)));
  return `${m} min${m === 1 ? '' : 's'} ago`;
}

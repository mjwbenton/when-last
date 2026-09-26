import { describe, expect, it, beforeEach } from 'vitest';
import {
  BACKUP_KEY_PATTERN,
  emptyState,
  generateBackupKey,
  isBackupStale,
  daysSince,
  STATE_KEY,
  loadState,
  saveState,
  relativeTime,
  exactTime,
  lastLoggedAt,
  sortedActions,
  groupedActions,
} from './index';
import {
  addAction,
  addCategory,
  renameCategory,
  removeCategory,
  setActionCategory,
  logNow,
  logAt,
  removeLog,
  markBackedUp,
  restoreFromSnapshot,
} from './mutators';
import type { AppState } from './types';

function fresh(): AppState {
  return emptyState();
}

describe('backup key', () => {
  it('matches expected pattern wl-xxxx-xxxx-xxxx', () => {
    for (let i = 0; i < 10; i++) {
      expect(generateBackupKey()).toMatch(BACKUP_KEY_PATTERN);
    }
  });
});

describe('persistence round-trip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and reloads state', () => {
    const afterAdd = addAction(fresh(), { name: 'Watered plants' });
    saveState(afterAdd);
    const reloaded = loadState();
    expect(reloaded.actions).toHaveLength(1);
    expect(reloaded.actions[0]?.name).toBe('Watered plants');
    expect(reloaded.backupKey).toBe(afterAdd.backupKey);
  });

  it('generates backupKey on first visit', () => {
    const loaded = loadState();
    expect(loaded.backupKey).toMatch(BACKUP_KEY_PATTERN);
    expect(localStorage.getItem(STATE_KEY)).not.toBeNull();
  });

  it('recovers from malformed JSON', () => {
    localStorage.setItem(STATE_KEY, '{{not json');
    const loaded = loadState();
    expect(loaded.actions).toEqual([]);
    expect(loaded.backupKey).toMatch(BACKUP_KEY_PATTERN);
  });

  it('starts with no seeded actions', () => {
    const loaded = loadState();
    expect(loaded.actions).toEqual([]);
  });

  it('migrates pre-category state by defaulting categories and categoryId', () => {
    localStorage.setItem(
      STATE_KEY,
      JSON.stringify({
        actions: [{ id: 'a', name: 'Watered plants', logs: [1] }],
        backupKey: 'wl-aaaa-aaaa-aaaa',
        lastBackupAt: null,
      }),
    );
    const loaded = loadState();
    expect(loaded.categories).toEqual([]);
    expect(loaded.actions[0]?.categoryId).toBeNull();
  });
});

describe('action mutators', () => {
  it('addAction trims the name and starts with empty logs', () => {
    const s = addAction(fresh(), { name: '  Oil change  ' });
    expect(s.actions).toHaveLength(1);
    expect(s.actions[0]?.name).toBe('Oil change');
    expect(s.actions[0]?.logs).toEqual([]);
  });

  it('logNow prepends the current timestamp', () => {
    let s = addAction(fresh(), { name: 'Watered plants' });
    const id = s.actions[0]!.id;
    s = logNow(s, id);
    expect(s.actions[0]?.logs).toHaveLength(1);
    expect(s.actions[0]?.logs[0]).toBeTypeOf('number');
  });

  it('logAt inserts and keeps logs sorted descending', () => {
    let s = addAction(fresh(), { name: 'Oil change' });
    const id = s.actions[0]!.id;
    s = logAt(s, id, 1000);
    s = logAt(s, id, 3000);
    s = logAt(s, id, 2000);
    expect(s.actions[0]?.logs).toEqual([3000, 2000, 1000]);
  });

  it('logNow only touches the targeted action', () => {
    let s = addAction(fresh(), { name: 'A' });
    s = addAction(s, { name: 'B' });
    const idA = s.actions[0]!.id;
    s = logNow(s, idA);
    expect(s.actions[0]?.logs).toHaveLength(1);
    expect(s.actions[1]?.logs).toHaveLength(0);
  });

  it('removeLog removes the matching entry, keeping the rest', () => {
    let s = addAction(fresh(), { name: 'Oil change' });
    const id = s.actions[0]!.id;
    s = logAt(s, id, 1000);
    s = logAt(s, id, 3000);
    s = logAt(s, id, 2000);
    s = removeLog(s, id, 2000);
    expect(s.actions[0]?.logs).toEqual([3000, 1000]);
  });

  it('removeLog removes only the first matching duplicate timestamp', () => {
    let s = addAction(fresh(), { name: 'Oil change' });
    const id = s.actions[0]!.id;
    s = logAt(s, id, 1000);
    s = logAt(s, id, 1000);
    s = removeLog(s, id, 1000);
    expect(s.actions[0]?.logs).toEqual([1000]);
  });

  it('removeLog is a no-op when the timestamp is not found', () => {
    let s = addAction(fresh(), { name: 'Oil change' });
    const id = s.actions[0]!.id;
    s = logAt(s, id, 1000);
    s = removeLog(s, id, 9999);
    expect(s.actions[0]?.logs).toEqual([1000]);
  });

  it('removeLog only touches the targeted action', () => {
    let s = addAction(fresh(), { name: 'A' });
    s = addAction(s, { name: 'B' });
    const idA = s.actions[0]!.id;
    const idB = s.actions[1]!.id;
    s = logAt(s, idA, 1000);
    s = logAt(s, idB, 1000);
    s = removeLog(s, idA, 1000);
    expect(s.actions[0]?.logs).toEqual([]);
    expect(s.actions[1]?.logs).toEqual([1000]);
  });

  it('markBackedUp sets lastBackupAt', () => {
    const s = markBackedUp(fresh(), 1234);
    expect(s.lastBackupAt).toBe(1234);
  });
});

describe('restoreFromSnapshot preserves local backup key', () => {
  it('keeps local key, takes everything else from snapshot', () => {
    const local = fresh();
    const snapshot: AppState = {
      ...fresh(),
      backupKey: 'wl-aaaa-aaaa-aaaa',
      actions: [{ id: 'x', name: 'Watered plants', logs: [1], categoryId: null }],
      categories: [{ id: 'cat-1', name: 'Home' }],
    };
    const restored = restoreFromSnapshot(local, snapshot);
    expect(restored.backupKey).toBe(local.backupKey);
    expect(restored.actions).toHaveLength(1);
  });
});

describe('stale backup detection', () => {
  const DAY = 1000 * 60 * 60 * 24;
  const now = Date.now();

  it('returns Infinity when never backed up', () => {
    expect(daysSince(null)).toBe(Infinity);
    expect(isBackupStale(fresh())).toBe(true);
  });

  it('15 days ago is not stale (boundary)', () => {
    const s: AppState = { ...fresh(), lastBackupAt: now - 15 * DAY };
    expect(isBackupStale(s, now)).toBe(false);
  });

  it('16 days ago is stale', () => {
    const s: AppState = { ...fresh(), lastBackupAt: now - 16 * DAY };
    expect(isBackupStale(s, now)).toBe(true);
  });
});

describe('relativeTime formatting', () => {
  const now = 1_000_000_000_000;
  const MIN = 60000;
  const HR = 60 * MIN;
  const DAY = 24 * HR;

  it('under a minute is Just now', () => {
    expect(relativeTime(now - 30_000, now)).toBe('Just now');
  });

  it('null is Never', () => {
    expect(relativeTime(null, now)).toBe('Never');
  });

  it('minutes with singular/plural', () => {
    expect(relativeTime(now - 1 * MIN, now)).toBe('1 min ago');
    expect(relativeTime(now - 5 * MIN, now)).toBe('5 mins ago');
  });

  it('hours', () => {
    expect(relativeTime(now - 1 * HR, now)).toBe('1 hr ago');
    expect(relativeTime(now - 3 * HR, now)).toBe('3 hrs ago');
  });

  it('days', () => {
    expect(relativeTime(now - 1 * DAY, now)).toBe('1 day ago');
    expect(relativeTime(now - 3 * DAY, now)).toBe('3 days ago');
  });

  it('weeks', () => {
    expect(relativeTime(now - 7 * DAY, now)).toBe('1 week ago');
    expect(relativeTime(now - 21 * DAY, now)).toBe('3 weeks ago');
  });

  it('months', () => {
    expect(relativeTime(now - 60 * DAY, now)).toBe('2 months ago');
  });

  it('years', () => {
    expect(relativeTime(now - 400 * DAY, now)).toBe('1 year ago');
  });
});

describe('exactTime formatting', () => {
  it('includes a date and time separated by a comma', () => {
    const out = exactTime(new Date('2026-03-05T14:30:00').getTime());
    expect(out).toContain(', ');
  });
});

describe('lastLoggedAt / sortedActions', () => {
  it('lastLoggedAt returns max or null', () => {
    expect(lastLoggedAt({ id: 'a', name: 'A', logs: [], categoryId: null })).toBeNull();
    expect(lastLoggedAt({ id: 'a', name: 'A', logs: [1, 9, 4], categoryId: null })).toBe(9);
  });

  it('sorts most-recently-logged first, never-logged last', () => {
    const s: AppState = {
      ...emptyState(),
      actions: [
        { id: 'old', name: 'Old', logs: [100], categoryId: null },
        { id: 'never', name: 'Never', logs: [], categoryId: null },
        { id: 'recent', name: 'Recent', logs: [500], categoryId: null },
      ],
    };
    const order = sortedActions(s).map((a) => a.id);
    expect(order).toEqual(['recent', 'old', 'never']);
  });
});

describe('categories', () => {
  it('addAction stores the given category', () => {
    let s = addCategory(fresh(), { name: 'Home' });
    const catId = s.categories[0]!.id;
    s = addAction(s, { name: 'Watered plants', categoryId: catId });
    expect(s.actions[0]?.categoryId).toBe(catId);
  });

  it('addAction defaults to uncategorized', () => {
    const s = addAction(fresh(), { name: 'Watered plants' });
    expect(s.actions[0]?.categoryId).toBeNull();
  });

  it('addCategory trims names and ignores empties/duplicates', () => {
    let s = addCategory(fresh(), { name: '  Home  ' });
    expect(s.categories.map((c) => c.name)).toEqual(['Home']);
    s = addCategory(s, { name: 'home' });
    s = addCategory(s, { name: '   ' });
    expect(s.categories).toHaveLength(1);
  });

  it('addCategory honours a supplied id', () => {
    const s = addCategory(fresh(), { name: 'Home', id: 'cat-fixed' });
    expect(s.categories[0]?.id).toBe('cat-fixed');
  });

  it('renameCategory renames and rejects duplicates', () => {
    let s = addCategory(fresh(), { name: 'Home' });
    s = addCategory(s, { name: 'Car' });
    const home = s.categories[0]!.id;
    s = renameCategory(s, home, 'Household');
    expect(s.categories[0]?.name).toBe('Household');
    s = renameCategory(s, home, 'car');
    expect(s.categories[0]?.name).toBe('Household');
  });

  it('removeCategory uncategorizes its actions without deleting them', () => {
    let s = addCategory(fresh(), { name: 'Home' });
    const catId = s.categories[0]!.id;
    s = addAction(s, { name: 'Watered plants', categoryId: catId });
    s = removeCategory(s, catId);
    expect(s.categories).toHaveLength(0);
    expect(s.actions).toHaveLength(1);
    expect(s.actions[0]?.categoryId).toBeNull();
  });

  it('setActionCategory moves an action and can clear it', () => {
    let s = addCategory(fresh(), { name: 'Home' });
    const catId = s.categories[0]!.id;
    s = addAction(s, { name: 'Watered plants' });
    const actionId = s.actions[0]!.id;
    s = setActionCategory(s, actionId, catId);
    expect(s.actions[0]?.categoryId).toBe(catId);
    s = setActionCategory(s, actionId, null);
    expect(s.actions[0]?.categoryId).toBeNull();
  });

  it('groupedActions orders categories, sorts within, and puts uncategorized last', () => {
    let s = addCategory(fresh(), { name: 'Home' });
    s = addCategory(s, { name: 'Car' });
    const home = s.categories[0]!.id;
    const car = s.categories[1]!.id;
    s = addAction(s, { name: 'Watered plants', categoryId: home });
    s = addAction(s, { name: 'Oil change', categoryId: car });
    s = addAction(s, { name: 'Dust shelves' });

    const groups = groupedActions(s);
    expect(groups.map((g) => g.category?.name ?? null)).toEqual(['Home', 'Car', null]);
    expect(groups[0]?.actions.map((a) => a.name)).toEqual(['Watered plants']);
    expect(groups[2]?.actions.map((a) => a.name)).toEqual(['Dust shelves']);
  });

  it('groupedActions drops empty categories', () => {
    const s = addCategory(fresh(), { name: 'Empty' });
    expect(groupedActions(s)).toEqual([]);
  });
});

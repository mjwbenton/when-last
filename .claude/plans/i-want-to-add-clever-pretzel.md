# Swipe-to-delete log entries

## Context

`TrackedAction.logs` is an append-only `number[]` of timestamps — there's currently no way to remove a mis-logged entry short of clearing localStorage. The user wants an iOS-style swipe gesture on each history row in the action detail view: swipe left to reveal a trash button, tap it to delete that entry. Deletion is immediate (no confirm dialog, no undo) — confirmed with the user, matching standard swipe-to-delete UX and the fact that this app has no existing confirm/undo pattern to extend.

The app has no gesture/animation library today (`grep` confirms no framer-motion/react-spring/use-gesture), so this adds one: `@use-gesture/react` (see RESPONSE below for why, over the alternative). There's also no per-log-entry id — deletion has to key off the timestamp value itself.

COMMENT: It's fine for us to introduce a library for this if you think that would make it easier

RESPONSE: Checked the two obvious options. `react-swipeable-list` would've replaced almost all of the custom gesture code with ready-made swipeable-row/trailing-action components, but its published peer deps cap out at `react@^16.12.0 || ^17` and it hasn't been released since Oct 2024 — too risky to pin into a React 18 app. Instead I'm using `@use-gesture/react` (pmndrs, actively maintained, peer dep is just `react >= 16.8.0`, so React 18/19-safe): its `useDrag` hook has a built-in `filterTaps`/`tap` flag that does exactly the tap-vs-swipe distinction I was going to hand-roll with a movement-threshold ref, plus it manages pointer capture and axis-locking for us. We still own the actual reveal markup/CSS/`removeLog` wiring — this only replaces the low-level pointer-math bookkeeping, not the app-specific UI, which is why I didn't reach for `react-swipeable-list`'s own opinionated row/action components anyway (they'd fight this app's plain-CSS design-token system). Updated the "New HistoryRow component" section below accordingly and added the dependency to package.json.

## State layer

**`packages/app/src/state/mutators.ts`** — add a new mutator following the exact immutable-update pattern of `logAt`/`logNow`:

```ts
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
```

Uses `indexOf` + `splice` (removes the first match only) rather than `.filter`, so if two custom entries ever land on the exact same timestamp, deleting one doesn't wipe both.

**`packages/app/src/state/store.tsx`** — add `removeLog` to the `Mutators` type and the `mutators` object, same shape as `logAt`:

```ts
removeLog: (actionId: string, timestamp: number) => void;
...
removeLog: (actionId, timestamp) => setState((prev) => M.removeLog(prev, actionId, timestamp)),
```

No changes needed to `persistence.ts`, `backup/schema.ts` (`logs: z.array(z.number())` already permits any length), or `selectors.ts` (`lastLoggedAt`/`sortedActions` recompute from whatever's left in `logs`).

## Dependency

**`packages/app/package.json`** — add `@use-gesture/react` (^10.3.1) as a direct dependency. No `react-spring` needed — we drive the reveal with plain React state + CSS transition, not physics-based animation.

## Icon

**`packages/app/src/icons/Icon.tsx`** — add `'trash'` to the `IconName` union and a corresponding simple bin `<path>` (follow the existing style: `currentColor` stroke, `viewBox="0 0 24 24"`, matching the other icons' line weight).

## New `HistoryRow` component

Extract the currently-inline row markup in `ActionDetail.tsx` into **`packages/app/src/components/HistoryRow.tsx`** (matches the existing convention of feature components living in `components/`, vs. generic primitives in `ui/`). This is also the natural place to fix a latent bug: today `expanded` and the React `key` are keyed by **array index**, which is fine while logs are never removed, but breaks the moment deletion is possible (removing row 0 would shift row 1's expanded/exact-time state onto the new row 0). Switch keying to the **timestamp value** instead.

```tsx
type HistoryRowProps = {
  timestamp: number;
  expanded: boolean;
  onToggleExpanded: () => void;
  onDelete: () => void;
};
```

Internal gesture state, using `useDrag` from `@use-gesture/react`:

- `offset` (number, 0 = closed, `OPEN_OFFSET = -76` = fully revealed) drives `transform: translateX(${offset}px)` on the row's button content; `transition: transform 200ms ease` when not actively dragging (i.e. not `active` from `useDrag`), none while dragging.
- A wrapper `<div className="history-row-wrap">` with `position: relative; overflow: hidden` contains the row button and an absolutely-positioned delete `<button>` (using `IconButton` with `name="trash"`, styled with `var(--danger)`) sitting behind it on the right, width matching `76px`.
- Bind the gesture to the row button:
  ```tsx
  const isOpenRef = useRef(false); // mirrors `offset` for reading inside the drag callback
  const bind = useDrag(
    ({ active, movement: [mx], last, tap }) => {
      if (tap) {
        if (isOpenRef.current) setOffset(0);
        else onToggleExpanded();
        return;
      }
      const next = clamp((isOpenRef.current ? OPEN_OFFSET : 0) + mx, OPEN_OFFSET, 0);
      setOffset(next);
      if (last) {
        const openNow = next <= OPEN_OFFSET / 2;
        isOpenRef.current = openNow;
        setOffset(openNow ? OPEN_OFFSET : 0);
      }
    },
    { axis: 'x', filterTaps: true, bounds: { left: OPEN_OFFSET, right: 0 } },
  );
  ```
  `filterTaps: true` + the `tap` flag is `@use-gesture`'s built-in tap-vs-drag distinction, replacing the manual movement-threshold tracking a from-scratch version would need. `axis: 'x'` plus the library's own touch-action handling keeps vertical page scroll working.
- The delete button gets `tabIndex={-1}` / `aria-hidden` while closed so it isn't keyboard/screen-reader reachable while visually clipped off-screen, and becomes reachable once swiped open.
- Delete button `onClick` calls `onDelete()` directly (no confirmation, per the agreed UX).

## Wire into `ActionDetail.tsx`

Replace the inline `logs.map((ts, idx) => ...)` block (lines 85-100) with:

```tsx
{
  logs.map((ts) => (
    <HistoryRow
      key={ts}
      timestamp={ts}
      expanded={expanded[ts] ?? false}
      onToggleExpanded={() => setExpanded((prev) => ({ ...prev, [ts]: !prev[ts] }))}
      onDelete={() => mutators.removeLog(action.id, ts)}
    />
  ));
}
```

`expanded` state type changes from `Record<number, boolean>` keyed by index to keyed by timestamp (same type signature, different semantics — no type change needed, just the key values used).

## CSS

**`packages/app/src/styles/global.css`** — under the existing `/* ================= Detail view ================= */` section (near `.history-row` at line ~286), add rules for `.history-row-wrap` (relative, overflow hidden, so it slots into the existing `.history-list` flex column unchanged) and `.history-row-delete` (absolute right 0/top 0/bottom 0, width 76px, `background: var(--danger)`, centered icon, white/contrast text). Reuse `var(--radius)`/`var(--line)` tokens already used by `.history-list`/`.history-row` so corners and borders still look correct now that the first/last row's wrapper — not the row button itself — is the flex child.

## Tests

- **`packages/app/src/state/state.test.ts`** — new test(s) in the `'action mutators'` describe block for `removeLog`, following the existing `fresh()` + chained-mutator style used for `logAt`: build up logs via `addAction`/`logAt`, call `removeLog`, assert the entry is gone and sibling entries/actions are untouched (mirror the existing "logNow only touches the targeted action" test).
- **`packages/app/src/components/HistoryRow.test.tsx`** (new) — using `@testing-library/react` + `fireEvent` (the precedent set by `ui/ui.test.tsx` for gesture-adjacent interaction testing, since `user-event` has no swipe support): simulate `pointerDown`/`pointerMove`/`pointerUp` with `clientX` deltas (large enough to clear `@use-gesture`'s default tap threshold, ~3px) to verify (a) a no-movement pointerDown+pointerUp toggles `onToggleExpanded` instead of revealing delete, (b) a leftward drag past the halfway point reveals the delete button and clicking it calls `onDelete`, (c) tapping an open row closes it without calling either callback.

## Verification

1. `cd packages/app && npx vitest run src/state/state.test.ts` and `npx vitest run src/components/HistoryRow.test.tsx`.
2. `npm run typecheck` and `npm run lint` from repo root.
3. `npm run dev`, open an action with a few log entries, and manually confirm: swiping left reveals the trash button, tapping it removes that entry (and only that one), tapping a row when closed still toggles relative/exact time, tapping an open row closes it, and deleting the only remaining entry falls back to the "No entries yet." empty state.

# When Last

Track when you last did something. Add an action (watered the plants, changed the oil,
cleaned the fridge), log it whenever you do it, and see at a glance how long it's been.
Installs as a PWA from [whenlast.mattb.tech](https://whenlast.mattb.tech) onto your home screen.

All data lives in the browser (`localStorage`). The only cloud feature is an opt-in
encrypted-at-rest snapshot to S3, keyed by a random string the user copies down — no
accounts, no passwords.

## Repo layout

npm workspaces monorepo:

```
packages/
  app/      — React 18 + Vite PWA (the thing users install)
  infra/    — Pulumi (TypeScript) program + the backup Lambda
docs/
  first-deploy.md  — one-time AWS bootstrap steps
when-last-app-design/       — Claude Design handoff bundle (reference only)
.github/workflows/deploy.yml  — verify → pulumi up → vite build → S3 sync
```

## Commands

Run from the repo root.

| Command                | What it does                                        |
| ---------------------- | --------------------------------------------------- |
| `npm run dev`          | Vite dev server for the SPA on port 5173            |
| `npm run build`        | Build all workspaces                                |
| `npm run typecheck`    | `tsc --noEmit` per workspace                        |
| `npm run lint`         | ESLint across the repo                              |
| `npm run format`       | Prettier write                                      |
| `npm run format:check` | Prettier check                                      |
| `npm run test`         | Vitest in every workspace (jsdom + Testing Library) |

Single test file: `cd packages/app && npx vitest run src/path/to/file.test.tsx` (add `-t "<name>"` to filter by name).

PWA icons: `cd packages/app && npm run build:pwa-assets`.

Infra preview/deploy (CI normally handles this): `cd packages/infra && npm run preview` or `npm run up`.

## Local dev notes

The app reads `VITE_BACKUP_API` at build time to know where the backup Lambda lives. In CI it's wired up from the Pulumi stack output; for local dev it's fine to leave unset — the backup feature will just throw if invoked.

Node 24+.

## Architecture, deep dive

- **Bootstrapping AWS from scratch:** [`docs/first-deploy.md`](docs/first-deploy.md).
- **Per-package guidance for Claude:** [`CLAUDE.md`](CLAUDE.md).

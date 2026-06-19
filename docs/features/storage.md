# Local Storage & Offline Model

reqspec is offline-first. All data lives on-device.

## What it does

- Persistence uses **IndexedDB via [Dexie](https://dexie.org/)** — the same store works on web
  and inside the native webview, so there is a single uniform data layer across all platforms.
- Stored entities: collections, folders, requests, environments, globals, and history.
- No server is required to use any feature. The app works entirely offline.

## Reading & writing

- **Reads** go through [TanStack Query](https://tanstack.com/query) over thin repository
  functions (caching, loading states, invalidation).
- **Writes** call the repository functions directly, then invalidate the relevant query keys.
- Repositories never expose raw Dexie tables, which keeps them unit-testable (tests run against
  `fake-indexeddb`).

## The sync boundary (future, paid)

Local-first is the default and is fully free. Cloud **synchronization** across devices is the
only paid in-app purchase and is **not** part of Milestone 1. The `packages/sql` package
(Prisma / PostgreSQL) is reserved for that future sync backend and is not used by the local app.

## Current limits

- No export/backup of the local database yet.
- No conflict resolution (only relevant once sync exists).

## Where it lives

- `frontend/src/lib/db/` — `db.ts` (schema), `types.ts`, `*.repo.ts`
- Query hooks: `frontend/src/hooks/queries/`

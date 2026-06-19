# Architecture

## Layering

```
UI components (React)
   │  read via TanStack Query hooks        write via repo fns + invalidate
   ▼
Repositories  (frontend/src/lib/db/*.repo.ts)   ← pure-ish async seam
   ▼
Dexie / IndexedDB  (frontend/src/lib/db/db.ts)  ← on-device source of truth
```

Domain logic is kept **pure and side-effect-free** so it is fully unit-testable:

- `lib/request/model.ts` — request model + zod schema
- `lib/vars/*` — variable scope + interpolation
- `lib/http/serialize.ts` / `normalize.ts` — request/response transforms

The only impure step in a send is the HTTP **adapter**; everything around it is pure. See
[features/http-execution.md](features/http-execution.md).

## State management

Three stores with clear responsibilities:

| Layer | Holds | Examples |
| --- | --- | --- |
| **Dexie** | Persisted source of truth | collections, requests, environments, history |
| **TanStack Query** | Cache/loading over repos | `["collections"]`, `["history"]`, … |
| **Zustand** (`lib/store/*`) | Ephemeral on-screen state | active request draft, selected env, theme, modals, mobile pane |

Rule of thumb: **survives reload → Dexie (+Query); on-screen right now → Zustand.** Query never
holds UI state; Zustand never holds the persisted lists.

## UI conventions

- Generic primitives in `frontend/src/components/ui/`; feature composites under
  `frontend/src/components/<feature>/`.
- No native `<select>` / `alert` / `confirm` — custom `CustomSelect` and promise-based modal
  helpers (`lib/ui/modal.ts`) are used instead.
- All text inputs debounce to preserve native undo and avoid parent re-render storms.
- Responsive: desktop renders a 3-pane layout; mobile renders one pane at a time with a bottom
  nav (`components/layout/AppShell/`).

## Platforms

One codebase ships to web, mobile, and desktop via Tauri 2. Runtime detection (`isTauri()`)
selects the native HTTP adapter; otherwise the web adapter is used.

# Collection Runner (M7)

Run an entire collection or a single folder in order, optionally driven by a data
file across multiple iterations, reusing the existing send + scripting pipeline.
Results stream in live and can be exported as JSON.

## Entry points

- A **▶ Run** icon on each collection and folder row in the collections tree
  (`components/collections/CollectionsTree/CollectionNode.tsx`) opens the runner
  scoped to that target via `useRunnerStore.open({ collectionId, folderId, name })`.
- The `RunnerPanel` modal is mounted once at the app root (`routes/__root.tsx`).

## Pieces

Pure logic lives in `frontend/src/lib/runner/` (no I/O, 100% line+function coverage):

- **`flatten.ts` — `flattenRunItems(folders, requests, { folderId? })`**: depth-first
  tree walk into an ordered `RunItem[]`. At each level the directly-contained requests
  run first (by `order`), then child folders are descended into. A `folderId` scopes the
  walk to that folder and its descendants; otherwise the whole collection runs.
- **`dataFile.ts` — `parseDataFile(content, type)`**: parses a CSV (RFC 4180-ish: quoted
  fields, escaped `""`, CRLF/CR/LF) or JSON-array-of-objects data file into `DataRow[]`,
  coercing every value to a string. `detectDataFileType(filename)` infers the type from the
  extension.
- **`run.ts` — `runCollection(items, config, deps)`**: drives the items `iterations` times.
  `resolveIterations` defaults the count to the data-row count (or 1). Each iteration uses
  data row `i % rows.length` as the `data` variable layer. The actual HTTP + scripting work
  is injected via `deps.send` (normally `httpClient.send`), so the orchestration is testable
  without QuickJS or a network. Env/global/collection variable writes from scripts carry
  forward across the whole run; only the `data` layer swaps per iteration. Errors become a
  failed result row instead of throwing. Cooperative cancellation via `deps.signal.aborted`;
  optional `delayMs` between requests. Returns a `RunReport` (per-request/per-test results,
  pass/fail tallies, timings). `serializeReport` pretty-prints it for download.

## Glue & UI

- **`hooks/use-collection-runner.ts`** gathers the target's folders/requests, builds the base
  scope (selected environment + collection vars + globals), flattens the run order, and calls
  `runCollection` with a `send` wrapper that persists script variable writes back to the DB
  live (so later requests in the run observe them) and invalidates the relevant query keys.
- **`lib/store/runner.store.ts`** (zustand) holds the open target, run status, live results,
  final report, and the abort signal.
- **`components/runner/RunnerPanel/`**: `RunConfigForm` (iterations, delay, data-file picker),
  `RunResults` (summary bar + per-request rows with per-assertion ✓/✕), and the modal shell
  (`index.tsx`) with Run / Stop / Export JSON / Close actions.

## Reused seams

The runner does not reinvent execution: it feeds requests through the M6
`runPreRequest`/send/`runTests` pipeline (`lib/scripting/run.ts` + `lib/http/client.ts`),
and the `data` layer was already part of `ScopeLayers`/`VarScope`.

## Not covered

Per-iteration request selection toggles, run history persistence, and a Tauri-native
newman-style CLI are out of scope for M7.

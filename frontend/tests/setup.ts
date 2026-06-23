import { GlobalRegistrator } from "@happy-dom/global-registrator";
import "fake-indexeddb/auto";

/**
 * Global frontend test bootstrap (registered via bunfig.toml `[test] preload`). Runs ONCE
 * before any test file loads. The frontend analogue of the backend `tests/setup.ts`.
 *
 * The backend bootstrap had to provision a dedicated Postgres test database (reset +
 * replay migrations + seed) because its DB-backed suites hit a real server. The frontend
 * has no server-side database: persistence is IndexedDB, accessed in-process through Dexie.
 * So there is nothing external to provision here — only two browser globals to stand up so
 * tests can run under Bun (a non-browser runtime):
 *
 *   1. happy-dom — registers `window`/`document`/etc. globally, so component and hook tests
 *      (@testing-library/react) have a DOM to render into.
 *   2. fake-indexeddb/auto — installs an in-memory IndexedDB implementation on the global
 *      scope, so repository tests (`src/lib/db/**`) exercise the real Dexie code path against
 *      a throwaway store instead of a browser. It is per-process; suites that need a clean
 *      slate reset their tables in `beforeEach` (see `src/lib/db/tests/repos.test.ts`).
 *
 * Both are cheap and unconditional: there is no DB-free fast path to carve out the way the
 * backend did, so every scope (unit/e2e) gets the same environment. `scripts/test.ts` still
 * exports `TEST_SCOPE` for parity, leaving room to branch here if a future real-browser e2e
 * scope ever needs to skip these registrations.
 */
GlobalRegistrator.register();

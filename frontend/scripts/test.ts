import { spawnSync } from "node:child_process";
import path from "node:path";
import { Glob } from "bun";

/**
 * Frontend test dispatcher (wired as the `test` script in package.json; `test:unit`
 * and `test:e2e` call it with the matching scope). It is the frontend analogue of the
 * backend `tests/setup.ts` bootstrap: the backend split tests by whether they hit the
 * real Postgres test DB, so its bootstrap had to provision a database. The frontend has
 * no server-side database — repository tests run against `fake-indexeddb`, which is an
 * in-process, per-test store registered in `tests/setup.ts` (the bunfig `preload`). So
 * there is nothing to provision here; the only job is selecting WHICH test files run for
 * a given scope and handing them to `bun test`.
 *
 * Scopes (mirrors the turbo `test:unit` input filter that includes every test file but
 * excludes the `.e2e.test.ts` ones):
 *   - unit  → every `.test.ts(x)` EXCEPT `.e2e.test.ts(x)`. The default, fast, in-process
 *             suite (pure logic + happy-dom + fake-indexeddb).
 *   - e2e   → only `*.e2e.test.ts(x)`. Reserved for full browser/Tauri flows; none exist yet,
 *             so this scope is a no-op until such files are added (we exit 0 rather than let
 *             `bun test` fall back to running everything when handed zero file args).
 *   - all   → both of the above (used by a bare `bun run test`).
 *
 * Any extra CLI args after the scope are forwarded verbatim to `bun test`
 * (e.g. `bun run test:unit --coverage -t "interpolate"`).
 */

const SRC_DIR = path.resolve(import.meta.dir, "../src");

const SCOPES = ["unit", "e2e", "all"] as const;
type Scope = (typeof SCOPES)[number];

function isScope(value: string): value is Scope {
	return (SCOPES as readonly string[]).includes(value);
}

const [rawScope = "all", ...passthrough] = process.argv.slice(2);
if (!isScope(rawScope)) {
	throw new Error(`Unknown test scope "${rawScope}". Use one of: ${SCOPES.join(", ")}.`);
}
const scope: Scope = rawScope;

const E2E_GLOB = "**/*.e2e.test.{ts,tsx}";
const ALL_GLOB = "**/*.test.{ts,tsx}";

const allFiles = [...new Glob(ALL_GLOB).scanSync({ cwd: SRC_DIR })].sort();
const e2eFiles = new Set(new Glob(E2E_GLOB).scanSync({ cwd: SRC_DIR }));

let files: string[];
switch (scope) {
	case "unit":
		files = allFiles.filter(file => !e2eFiles.has(file));
		break;
	case "e2e":
		files = allFiles.filter(file => e2eFiles.has(file));
		break;
	case "all":
		files = allFiles;
		break;
}

if (files.length === 0) {
	// No matching files. Crucially we must NOT call `bun test` with zero file args — Bun would
	// then discover and run the ENTIRE suite, defeating the scope filter. Exit clean instead.
	console.log(`No ${scope} test files found; nothing to run.`);
	process.exit(0);
}

// `TEST_SCOPE` is exported for parity with the backend bootstrap (which branches its DB setup on
// it); `tests/setup.ts` can read it if it ever needs to skip happy-dom/fake-indexeddb registration
// for a future real-browser e2e scope.
const result = spawnSync("bun", ["test", ...files, ...passthrough], {
	cwd: path.resolve(import.meta.dir, ".."),
	env: { ...process.env, TEST_SCOPE: scope },
	stdio: "inherit",
});

process.exit(result.status ?? 1);

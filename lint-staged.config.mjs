import { existsSync, readdirSync, readFileSync } from "node:fs";
import { lintStagedConfig } from "@hyoretsu/configs/lint-staged";
import root from "./package.json" with { type: "json" };

// Tasks to run pre-commit for a workspace whose files were staged. A package only
// runs the ones it actually defines in its package.json `scripts`.
const PRECOMMIT_TASKS = ["check-types", "test:unit"];


/** Expand the root `workspaces` globs to concrete package dirs (those with a package.json). */
function workspaceDirs() {
	const dirs = new Set<string>();
	for (const pattern of root.workspaces ?? []) {
		if (pattern.endsWith("/*")) {
			const base = pattern.slice(0, -2);
			for (const entry of readdirSync(base, { withFileTypes: true })) {
				if (entry.isDirectory() && existsSync(`${base}/${entry.name}/package.json`)) {
					dirs.add(`${base}/${entry.name}`);
				}
			}
		} else if (existsSync(`${pattern}/package.json`)) {
			dirs.add(pattern);
		}
	}
	return [...dirs];
}

// One entry per workspace: when files under that package are staged, run its defined
// pre-commit tasks via Turbo, filtered to that package by name.
const workspaceChecks = {};
for (const dir of workspaceDirs()) {
	const pkg = JSON.parse(readFileSync(`${dir}/package.json`, "utf8"));

	const tasks = PRECOMMIT_TASKS.filter(task => pkg.scripts?.[task]);
	if (tasks.length === 0) continue;

	const commands = tasks.map(task => `bun turbo run ${task} -F ${pkg.name}`);

	// Function form: ignore the matched file list — Turbo runs the package task itself.
	workspaceChecks[`${dir}/**`] = () => commands;
}

export default {
	...lintStagedConfig({}),
	...workspaceChecks,
};

#!/usr/bin/env bun
// For each task given, print the workspace package NAMES that should run it for this
// change set. A package qualifies for a task when it is BOTH:
//   (a) affected by the diff against <baseRef> — per Turbo's dependency graph, so a
//       package counts when its own files changed OR it transitively depends on a
//       changed package (a shared lib change schedules its dependents' jobs too); and
//   (b) actually defines that task as a script in its package.json — Turbo plans a
//       root-declared task for every affected package even when it lacks the script,
//       so this presence check keeps phantom packages out of the matrix.
//
// Usage:  bun scripts/affected-packages.ts <baseRef> <task...>
// An empty or all-zero <baseRef> (manual dispatch / a branch's first push) plans every
// package for the task(s) — there is no base commit to diff against.
// Output (stdout): compact JSON object keyed by task, e.g.
//   {"test:unit":["backend"],"test:e2e":["backend"]}
// A task with no affected package maps to []. A GitHub matrix built from [] spawns no
// jobs, so the corresponding check is skipped without needing a separate "any" flag.
//
// The workspace list is derived from the root package.json `workspaces` field, so
// adding a package needs no change here.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";

interface PackageJson {
	name: string;
	workspaces?: string[];
	scripts?: Record<string, string>;
}

const [baseRef, ...tasks] = process.argv.slice(2);
if (tasks.length === 0) {
	console.error("usage: affected-packages.ts <baseRef> <task...>");
	process.exit(1);
}

// An empty or all-zero baseRef (manual dispatch, or a branch's first push with no
// previous commit) means there is no base to diff against → plan every package for
// the task(s) instead of scoping the change set with --affected.
const planAll = !baseRef || /^0+$/.test(baseRef);

const root: PackageJson = JSON.parse(readFileSync("package.json", "utf8"));

/** Expand the `workspaces` globs to concrete package directories. */
function workspaceDirs(): string[] {
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

const packages = workspaceDirs().map(dir => {
	const pkg: PackageJson = JSON.parse(readFileSync(`${dir}/package.json`, "utf8"));
	return { name: pkg.name, scripts: pkg.scripts ?? {} };
});

interface DryRun {
	tasks: { task: string; package: string }[];
}

// `--affected` selects the changed packages and their dependents; TURBO_SCM_BASE pins
// the comparison point to the base commit. `--dry-run=json` plans without executing.
// With no base (planAll) we drop --affected so Turbo plans every package.
const stdout = execFileSync(
	"bun",
	planAll
		? ["turbo", "run", ...tasks, "--dry-run=json"]
		: ["turbo", "run", ...tasks, "--affected", "--dry-run=json"],
	{
		encoding: "utf8",
		env: (planAll
			? process.env
			: { ...process.env, TURBO_SCM_BASE: baseRef }) as unknown as NodeJS.ProcessEnv,
	},
);

// Turbo's plan lists a task per affected package even if the package lacks the script,
// so use it only as the graph-aware "is this package affected?" set, deduped.
const affected = new Set(JSON.parse(stdout).tasks.map((t: DryRun["tasks"][number]) => t.package));

const byTask = Object.fromEntries(
	tasks.map(task => [task, packages.filter(pkg => affected.has(pkg.name) && pkg.scripts[task]).map(pkg => pkg.name)]),
);

console.log(JSON.stringify(byTask));

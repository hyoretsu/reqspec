/**
 * Collection runner orchestration (pure).
 *
 * Drives an ordered list of requests through the existing send pipeline N times,
 * swapping in a per-iteration `data` variable layer, and collects a run report of
 * per-request/per-test pass-fail and timings. The actual HTTP+scripting work is
 * injected via `deps.send` (normally `httpClient.send`), keeping this unit-testable.
 */

import type { NormalizedResponse } from "@/lib/http/types";
import type { RequestModel } from "@/lib/request/model";
import type { TestResult } from "@/lib/scripting/types";
import type { VarScope } from "@/lib/vars/interpolate";
import type { DataRow } from "./dataFile";

/** One request to execute, in order. */
export interface RunItem {
	id: string;
	name: string;
	request: RequestModel;
}

export interface RunConfig {
	/** Iteration count; defaults to the data-row count (or 1 when there is no data). */
	iterations?: number;
	/** Per-iteration data rows; row `i % length` feeds iteration `i`. */
	data?: DataRow[];
	/** Delay in ms inserted before each request after the first. */
	delayMs?: number;
}

export type RunSendFn = (
	request: RequestModel,
	scope: VarScope,
) => Promise<NormalizedResponse>;

export interface RunDeps {
	/** Backing send implementation (interpolate → serialize → auth → adapter → tests). */
	send: RunSendFn;
	/** Shared scope (environment/collection/globals); the runner adds the `data` layer. */
	baseScope?: VarScope;
	/** Fired after each request result is produced (for live progress UIs). */
	onResult?: (result: RunRequestResult) => void;
	/** Cooperative cancellation; checked before each request. */
	signal?: { aborted: boolean };
	/** Injectable delay (defaults to a real timer) so tests stay synchronous. */
	sleep?: (ms: number) => Promise<void>;
}

export interface RunRequestResult {
	/** 1-based iteration number. */
	iteration: number;
	requestId: string;
	name: string;
	status?: number;
	statusText?: string;
	timeMs: number;
	tests: TestResult[];
	passed: number;
	failed: number;
	/** Transport/script error; when set the request did not produce a response. */
	error?: string;
}

export interface RunReport {
	startedAt: number;
	finishedAt: number;
	durationMs: number;
	iterations: number;
	requestCount: number;
	results: RunRequestResult[];
	totalTests: number;
	passedTests: number;
	failedTests: number;
	failedRequests: number;
	/** True when the run was stopped early via the abort signal. */
	aborted: boolean;
}

const EMPTY_SCOPE: VarScope = {
	local: {},
	data: {},
	environment: {},
	collection: {},
	globals: {},
};

/** Resolve the iteration count from the explicit config or the data-row count. */
export function resolveIterations(config: RunConfig): number {
	if (config.iterations !== undefined)
		return Math.max(1, Math.floor(config.iterations));
	const rows = config.data?.length ?? 0;
	return rows > 0 ? rows : 1;
}

/** Execute the items `iterations` times, returning a full report. */
export async function runCollection(
	items: RunItem[],
	config: RunConfig,
	deps: RunDeps,
): Promise<RunReport> {
	const startedAt = Date.now();
	const iterations = resolveIterations(config);
	const data = config.data ?? [];
	const sleep = deps.sleep ?? defaultSleep;
	const results: RunRequestResult[] = [];

	// Env/global/collection writes persist across the whole run; only `data` swaps per iteration.
	let scope: VarScope = cloneScope(deps.baseScope ?? EMPTY_SCOPE);
	let aborted = false;
	let isFirst = true;

	for (let iter = 0; iter < iterations && !aborted; iter++) {
		const dataRow: DataRow =
			data.length > 0 ? { ...data[iter % data.length] } : {};
		scope = { ...scope, data: { ...dataRow } };

		for (const item of items) {
			if (deps.signal?.aborted) {
				aborted = true;
				break;
			}
			if (!isFirst && config.delayMs && config.delayMs > 0)
				await sleep(config.delayMs);
			isFirst = false;

			const result = await runOne(item, scope, iter + 1, deps.send);
			// Carry script-written variables forward, but keep this iteration's data layer.
			if (result.scope) scope = { ...result.scope, data: { ...dataRow } };

			results.push(result.result);
			deps.onResult?.(result.result);
		}
	}

	const finishedAt = Date.now();
	return summarize(results, {
		startedAt,
		finishedAt,
		iterations,
		requestCount: items.length,
		aborted,
	});
}

/** Send one request and shape its result; never throws (errors become a result row). */
async function runOne(
	item: RunItem,
	scope: VarScope,
	iteration: number,
	send: RunSendFn,
): Promise<{ result: RunRequestResult; scope?: VarScope }> {
	try {
		const response = await send(item.request, scope);
		const tests = response.tests ?? [];
		const passed = tests.filter((t) => t.passed).length;
		return {
			result: {
				iteration,
				requestId: item.id,
				name: item.name,
				status: response.status,
				statusText: response.statusText,
				timeMs: response.timeMs,
				tests,
				passed,
				failed: tests.length - passed,
				error: response.error,
			},
			scope: response.scriptVars,
		};
	} catch (err) {
		return {
			result: {
				iteration,
				requestId: item.id,
				name: item.name,
				timeMs: 0,
				tests: [],
				passed: 0,
				failed: 0,
				error: err instanceof Error ? err.message : String(err),
			},
		};
	}
}

function summarize(
	results: RunRequestResult[],
	meta: {
		startedAt: number;
		finishedAt: number;
		iterations: number;
		requestCount: number;
		aborted: boolean;
	},
): RunReport {
	let totalTests = 0;
	let passedTests = 0;
	let failedRequests = 0;
	for (const r of results) {
		totalTests += r.tests.length;
		passedTests += r.passed;
		if (r.error || r.failed > 0) failedRequests++;
	}
	return {
		startedAt: meta.startedAt,
		finishedAt: meta.finishedAt,
		durationMs: meta.finishedAt - meta.startedAt,
		iterations: meta.iterations,
		requestCount: meta.requestCount,
		results,
		totalTests,
		passedTests,
		failedTests: totalTests - passedTests,
		failedRequests,
		aborted: meta.aborted,
	};
}

function cloneScope(scope: VarScope): VarScope {
	return {
		local: { ...scope.local },
		data: { ...scope.data },
		environment: { ...scope.environment },
		collection: { ...scope.collection },
		globals: { ...scope.globals },
	};
}

function defaultSleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Serialize a run report to a JSON string for export/download. */
export function serializeReport(report: RunReport): string {
	return JSON.stringify(report, null, 2);
}
